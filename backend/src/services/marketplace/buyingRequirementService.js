import { supabase, isSupabaseConfigured } from '../../config/supabase.js';

/**
 * Service to manage Buying Requirements (Buyer Demands)
 */

export async function getActivePublicBuyerRequirements({ crop = '', state = '', district = '', limit = 50, offset = 0 } = {}) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase database is not configured.');
  }

  let query = supabase
    .from('buying_requirements')
    .select(`
      id,
      buyer_id,
      crop_name,
      variety,
      required_quantity,
      fulfilled_quantity,
      unit,
      max_price_per_unit,
      price_type,
      price_unit,
      required_by_date,
      delivery_location,
      delivery_state,
      delivery_district,
      preferred_radius_km,
      quality_requirements,
      packaging_requirements,
      transport_preference,
      payment_preferences,
      notes,
      status,
      created_at,
      updated_at,
      buyer_profiles (
        id,
        business_name,
        buyer_type,
        state,
        district,
        city_town
      )
    `)
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false });

  if (crop && crop.trim()) {
    query = query.ilike('crop_name', `%${crop.trim()}%`);
  }
  if (state && state.trim()) {
    query = query.ilike('delivery_state', `%${state.trim()}%`);
  }
  if (district && district.trim()) {
    query = query.ilike('delivery_district', `%${district.trim()}%`);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to fetch buyer opportunities: ${error.message}`);
  }

  return (data || []).map(item => {
    const buyerProfile = item.buyer_profiles || null;
    const reqQty = Number(item.required_quantity) || 0;
    const fulQty = Number(item.fulfilled_quantity) || 0;
    const remainingQty = Math.max(0, reqQty - fulQty);

    return {
      id: item.id,
      cropName: item.crop_name,
      variety: item.variety,
      requiredQuantity: reqQty,
      fulfilledQuantity: fulQty,
      remainingQuantity: remainingQty,
      unit: item.unit,
      maxPricePerUnit: item.max_price_per_unit,
      priceType: item.price_type,
      priceUnit: item.price_unit,
      requiredByDate: item.required_by_date,
      deliveryLocation: item.delivery_location,
      deliveryState: item.delivery_state,
      deliveryDistrict: item.delivery_district,
      preferredRadiusKm: item.preferred_radius_km,
      qualityRequirements: item.quality_requirements,
      packagingRequirements: item.packaging_requirements,
      transportPreference: item.transport_preference,
      paymentPreferences: item.payment_preferences,
      notes: item.notes,
      status: item.status,
      createdAt: item.created_at,
      buyer: buyerProfile ? {
        businessName: buyerProfile.business_name,
        buyerType: buyerProfile.buyer_type,
        state: buyerProfile.state,
        district: buyerProfile.district,
        cityTown: buyerProfile.city_town
      } : null
    };
  });
}

export async function getBuyerRequirements(userId) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase database is not configured.');
  }

  if (!userId) {
    const err = new Error('User identity is required.');
    err.statusCode = 401;
    throw err;
  }

  const { data, error } = await supabase
    .from('buying_requirements')
    .select('*')
    .eq('buyer_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch buying requirements: ${error.message}`);
  }

  return data || [];
}

export async function createBuyingRequirement(reqData, userId) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase database is not configured.');
  }

  if (!userId) {
    const err = new Error('User identity is required.');
    err.statusCode = 401;
    throw err;
  }

  // Ensure buyer profile exists or auto-create placeholder
  const { data: existingBuyer } = await supabase
    .from('buyer_profiles')
    .select('id')
    .eq('id', userId)
    .single();

  if (!existingBuyer) {
    // Auto-create minimal buyer profile entry for FK constraint
    await supabase.from('buyer_profiles').insert({
      id: userId,
      business_name: 'Procurement Account',
      is_profile_complete: false
    });
  }

  const cropName = (reqData.cropName || reqData.crop_name || '').trim();
  if (!cropName) {
    const err = new Error('Crop name is required.');
    err.statusCode = 400;
    throw err;
  }

  const reqQty = Number(reqData.requiredQuantity || reqData.required_quantity);
  if (isNaN(reqQty) || reqQty <= 0) {
    const err = new Error('Required quantity must be a positive number.');
    err.statusCode = 400;
    throw err;
  }

  const reqByDate = reqData.requiredByDate || reqData.required_by_date;
  if (!reqByDate) {
    const err = new Error('Required by date is mandatory.');
    err.statusCode = 400;
    throw err;
  }

  const maxPrice = reqData.maxPricePerUnit !== undefined && reqData.maxPricePerUnit !== null && reqData.maxPricePerUnit !== ''
    ? Number(reqData.maxPricePerUnit)
    : (reqData.max_price_per_unit !== undefined && reqData.max_price_per_unit !== null && reqData.max_price_per_unit !== '' ? Number(reqData.max_price_per_unit) : null);

  const payload = {
    buyer_id: userId,
    crop_name: cropName,
    variety: reqData.variety ? reqData.variety.trim() : null,
    required_quantity: reqQty,
    fulfilled_quantity: 0,
    unit: reqData.unit || 'quintal',
    max_price_per_unit: maxPrice,
    price_type: reqData.priceType || reqData.price_type || 'max_willing_to_pay',
    price_unit: reqData.priceUnit || reqData.price_unit || 'INR/quintal',
    required_by_date: reqByDate,
    delivery_location: (reqData.deliveryLocation || reqData.delivery_location || 'Hyderabad').trim(),
    delivery_state: (reqData.deliveryState || reqData.delivery_state || 'Telangana').trim(),
    delivery_district: (reqData.deliveryDistrict || reqData.delivery_district || 'Hyderabad').trim(),
    preferred_radius_km: Number(reqData.preferredRadiusKm || reqData.preferred_radius_km) || 150,
    quality_requirements: reqData.qualityRequirements || reqData.quality_requirements || null,
    packaging_requirements: reqData.packagingRequirements || reqData.packaging_requirements || null,
    transport_preference: reqData.transportPreference || reqData.transport_preference || 'buyer_arranged',
    payment_preferences: reqData.paymentPreferences || reqData.payment_preferences || 'Payment upon delivery',
    notes: reqData.notes || null,
    status: 'ACTIVE'
  };

  const { data, error } = await supabase
    .from('buying_requirements')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create buying requirement: ${error.message}`);
  }

  return data;
}

export async function updateBuyingRequirementStatus(reqId, status, userId) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase database is not configured.');
  }

  const validStatuses = ['ACTIVE', 'PAUSED', 'FULFILLED', 'CANCELLED'];
  const upperStatus = (status || '').toUpperCase();
  if (!validStatuses.includes(upperStatus)) {
    const err = new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const { data, error } = await supabase
    .from('buying_requirements')
    .update({ status: upperStatus, updated_at: new Date().toISOString() })
    .eq('id', reqId)
    .eq('buyer_id', userId)
    .select()
    .single();

  if (error || !data) {
    const err = new Error('Requirement not found or unauthorized to update.');
    err.statusCode = 404;
    throw err;
  }

  return data;
}
