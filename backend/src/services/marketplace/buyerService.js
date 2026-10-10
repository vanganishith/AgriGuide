import { supabase, isSupabaseConfigured } from '../../config/supabase.js';

/**
 * Service to manage Buyer Profiles
 */

export async function getBuyerProfile(userId) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase database is not configured.');
  }

  if (!userId) {
    const err = new Error('User identity is required.');
    err.statusCode = 401;
    throw err;
  }

  const { data, error } = await supabase
    .from('buyer_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
    throw new Error(`Error fetching buyer profile: ${error.message}`);
  }

  return data || null;
}

export async function upsertBuyerProfile(profileData, userId) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase database is not configured.');
  }

  if (!userId) {
    const err = new Error('User identity is required to save buyer profile.');
    err.statusCode = 401;
    throw err;
  }

  const businessName = (profileData.businessName || profileData.business_name || '').trim();
  if (!businessName) {
    const err = new Error('Business name is required.');
    err.statusCode = 400;
    throw err;
  }

  const payload = {
    id: userId,
    business_name: businessName,
    contact_person: (profileData.contactPerson || profileData.contact_person || '').trim(),
    mobile_number: (profileData.mobileNumber || profileData.mobile_number || '').trim(),
    buyer_type: profileData.buyerType || profileData.buyer_type || 'Wholesaler / Trader',
    state: profileData.state || 'Telangana',
    district: profileData.district || 'Hyderabad',
    city_town: profileData.cityTown || profileData.city_town || '',
    business_location: profileData.businessLocation || profileData.business_location || '',
    business_address: profileData.businessAddress || profileData.business_address || '',
    gstin: (profileData.gstin || '').trim(),
    preferred_crops: Array.isArray(profileData.preferredCrops) 
      ? profileData.preferredCrops 
      : (Array.isArray(profileData.preferred_crops) ? profileData.preferred_crops : ['Cotton', 'Paddy', 'Chilli']),
    typical_quantity_range: profileData.typicalQuantityRange || profileData.typical_quantity_range || '10 - 100 quintals',
    preferred_payment_terms: profileData.preferredPaymentTerms || profileData.preferred_payment_terms || 'Payment upon delivery',
    preferred_procurement_radius_km: Number(profileData.preferredProcurementRadiusKm || profileData.preferred_procurement_radius_km) || 150,
    quality_requirements: profileData.qualityRequirements || profileData.quality_requirements || '',
    is_profile_complete: true,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('buyer_profiles')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save buyer profile: ${error.message}`);
  }

  return data;
}
