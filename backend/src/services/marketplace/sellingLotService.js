import { supabase, isSupabaseConfigured, getOrCreateDefaultFarmerUser } from '../../config/supabase.js';

/**
 * Service to manage Selling Lots (Farmer Supply)
 */

function normalizeCropName(name) {
  if (!name) return '';
  return name.toLowerCase().replace(/[()[\]{}_,.-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function matchesCrop(lotCropName, lotVariety, preferredCrop) {
  if (!lotCropName || !preferredCrop) return false;
  const normLot = normalizeCropName(lotCropName);
  const normVar = normalizeCropName(lotVariety || '');
  const normPref = normalizeCropName(preferredCrop);
  const combinedLot = `${normLot} ${normVar}`.trim();

  if (normLot === normPref || combinedLot === normPref) return true;
  if (combinedLot.includes(normPref) || normPref.includes(normLot)) return true;

  const prefTokens = normPref.split(' ').filter((w) => w.length >= 3);
  const lotTokens = combinedLot.split(' ').filter((w) => w.length >= 3);
  return prefTokens.some((token) => lotTokens.includes(token));
}

function getPreferenceRank(lot, preferredCrops) {
  if (!preferredCrops || !Array.isArray(preferredCrops) || preferredCrops.length === 0) {
    return { rank: 9999 };
  }
  for (let i = 0; i < preferredCrops.length; i++) {
    const pref = preferredCrops[i];
    if (matchesCrop(lot.crop_name, lot.variety, pref)) {
      return { rank: i, matchedCrop: pref };
    }
  }
  return { rank: 9999 };
}

export async function getSellingLots({
  crop = '',
  state = '',
  district = '',
  minQty = null,
  maxPrice = null,
  qualityGrade = '',
  sort = 'newest',
  limit = 50,
  offset = 0,
  buyerId = null,
  preferredCrops = null,
} = {}) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase database is not configured.');
  }

  // Retrieve buyer crop preferences if available
  let buyerPreferences = Array.isArray(preferredCrops) && preferredCrops.length > 0 ? preferredCrops : [];
  if (buyerId && buyerPreferences.length === 0) {
    try {
      const { data: bProfile } = await supabase
        .from('buyer_profiles')
        .select('preferred_crops')
        .eq('id', buyerId)
        .single();
      if (bProfile && Array.isArray(bProfile.preferred_crops) && bProfile.preferred_crops.length > 0) {
        buyerPreferences = bProfile.preferred_crops;
      }
    } catch {
      // ignore
    }
  }

  let query = supabase
    .from('selling_lots')
    .select(`
      id,
      farmer_id,
      plot_id,
      crop_name,
      variety,
      total_quantity,
      available_quantity,
      unit,
      asking_price_per_unit,
      price_unit,
      is_open_to_offers,
      approx_location,
      state,
      district,
      expected_availability_date,
      quality_grade,
      quality_details,
      images,
      status,
      created_at,
      updated_at
    `)
    .eq('status', 'ACTIVE')
    .gt('available_quantity', 0);

  // Filters
  if (crop && crop.trim()) {
    query = query.ilike('crop_name', `%${crop.trim()}%`);
  }
  if (state && state.trim()) {
    query = query.ilike('state', `%${state.trim()}%`);
  }
  if (district && district.trim()) {
    query = query.ilike('district', `%${district.trim()}%`);
  }
  if (minQty && !isNaN(Number(minQty))) {
    query = query.gte('available_quantity', Number(minQty));
  }
  if (maxPrice && !isNaN(Number(maxPrice))) {
    query = query.or(`asking_price_per_unit.lte.${Number(maxPrice)},is_open_to_offers.eq.true`);
  }
  if (qualityGrade && qualityGrade.trim()) {
    query = query.eq('quality_grade', qualityGrade.trim());
  }

  // Database Sorting
  switch (sort) {
    case 'price_low':
      query = query.order('asking_price_per_unit', { ascending: true, nullsFirst: false });
      break;
    case 'price_high':
      query = query.order('asking_price_per_unit', { ascending: false, nullsFirst: false });
      break;
    case 'quantity_high':
      query = query.order('available_quantity', { ascending: false });
      break;
    case 'available_soon':
      query = query.order('expected_availability_date', { ascending: true });
      break;
    case 'preferred':
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  // If buyer preference sorting is active, fetch candidate lots to re-rank in memory
  const isPreferenceSorting = (sort === 'preferred' || sort === 'newest') && buyerPreferences.length > 0;
  if (!isPreferenceSorting) {
    query = query.range(offset, offset + limit - 1);
  } else {
    // Fetch wider candidate pool for preference re-ranking
    query = query.limit(Math.max(100, limit * 3));
  }

  const { data, error, count } = await query;
  if (error) {
    throw new Error(`Failed to fetch selling lots: ${error.message}`);
  }

  let lots = data || [];

  // Annotate lots with buyer preference rank
  lots = lots.map((lot) => {
    const { rank, matchedCrop } = getPreferenceRank(lot, buyerPreferences);
    return {
      ...lot,
      is_preferred: rank < 9999,
      preference_rank: rank < 9999 ? rank : undefined,
      matched_preferred_crop: matchedCrop,
    };
  });

  // Re-rank by buyer preference if requested or default newest with preferences
  if (isPreferenceSorting) {
    lots.sort((a, b) => {
      const rankA = a.preference_rank !== undefined ? a.preference_rank : 9999;
      const rankB = b.preference_rank !== undefined ? b.preference_rank : 9999;

      if (rankA !== rankB) {
        return rankA - rankB;
      }

      // Secondary: newest upload date
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });

    lots = lots.slice(offset, offset + limit);
  }

  return {
    lots,
    totalCount: count || (data || []).length,
  };
}

export async function getSellingLotById(lotId) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase database is not configured.');
  }

  const { data: lot, error } = await supabase
    .from('selling_lots')
    .select('*')
    .eq('id', lotId)
    .single();

  if (error || !lot) {
    const err = new Error('Selling lot not found');
    err.statusCode = 404;
    throw err;
  }

  return lot;
}

export async function createSellingLot(lotData, user = null) {
  let userId = user?.id || null;
  if (!userId) {
    userId = await getOrCreateDefaultFarmerUser();
  }

  if (!isSupabaseConfigured() || !userId) {
    throw new Error('Supabase database is not configured or user is unauthenticated.');
  }

  // Input validation
  const totalQty = Number(lotData.totalQuantity || lotData.total_quantity);
  if (isNaN(totalQty) || totalQty <= 0) {
    const err = new Error('Total quantity must be a positive number.');
    err.statusCode = 400;
    throw err;
  }

  const cropName = (lotData.cropName || lotData.crop_name || '').trim();
  if (!cropName) {
    const err = new Error('Crop name is required.');
    err.statusCode = 400;
    throw err;
  }

  const approxLocation = (lotData.approxLocation || lotData.approx_location || 'Warangal').trim();
  const state = (lotData.state || 'Telangana').trim();
  const district = (lotData.district || 'Warangal').trim();
  const expDate = lotData.expectedAvailabilityDate || lotData.expected_availability_date || new Date().toISOString().split('T')[0];

  const askingPrice = lotData.askingPricePerUnit !== undefined && lotData.askingPricePerUnit !== null
    ? Number(lotData.askingPricePerUnit)
    : (lotData.asking_price_per_unit !== undefined && lotData.asking_price_per_unit !== null ? Number(lotData.asking_price_per_unit) : null);

  const isOpenToOffers = lotData.isOpenToOffers !== undefined ? Boolean(lotData.isOpenToOffers) : (askingPrice === null);

  const newLot = {
    farmer_id: userId,
    plot_id: lotData.plotId || lotData.plot_id || null,
    crop_name: cropName,
    variety: lotData.variety ? lotData.variety.trim() : null,
    total_quantity: totalQty,
    available_quantity: totalQty,
    unit: lotData.unit || 'quintal',
    asking_price_per_unit: askingPrice,
    price_unit: lotData.priceUnit || lotData.price_unit || 'INR/quintal',
    is_open_to_offers: isOpenToOffers,
    approx_location: approxLocation,
    state,
    district,
    expected_availability_date: expDate,
    quality_grade: lotData.qualityGrade || lotData.quality_grade || 'Grade A',
    quality_details: lotData.qualityDetails || lotData.quality_details || null,
    images: lotData.images || [],
    status: 'ACTIVE'
  };

  const { data, error } = await supabase
    .from('selling_lots')
    .insert(newLot)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to publish selling lot: ${error.message}`);
  }

  return data;
}

export async function getFarmerSellingLots(userId) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase database is not configured.');
  }

  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from('selling_lots')
    .select('*')
    .eq('farmer_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch farmer selling lots: ${error.message}`);
  }

  return data || [];
}

export async function updateSellingLotStatus(lotId, status, userId) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase database is not configured.');
  }

  if (!userId) {
    const err = new Error('Authentication required.');
    err.statusCode = 401;
    throw err;
  }

  const validStatuses = ['ACTIVE', 'RESERVED', 'SOLD', 'CANCELLED'];
  const upperStatus = (status || '').toUpperCase();
  if (!validStatuses.includes(upperStatus)) {
    const err = new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const { data, error } = await supabase
    .from('selling_lots')
    .update({ status: upperStatus, updated_at: new Date().toISOString() })
    .eq('id', lotId)
    .eq('farmer_id', userId)
    .select()
    .single();

  if (error || !data) {
    const err = new Error('Selling lot not found or unauthorized.');
    err.statusCode = 404;
    throw err;
  }

  return data;
}
