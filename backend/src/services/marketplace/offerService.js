import { supabase, isSupabaseConfigured, getOrCreateDefaultFarmerUser } from '../../config/supabase.js';

/**
 * Offer & Negotiation Service
 * 
 * Manages:
 * - Direct buyer-to-farmer offers
 * - Counteroffers with preserved append-only audit trail
 * - Strict offer state transitions: PENDING -> COUNTERED -> ACCEPTED / REJECTED / WITHDRAWN
 * - Server-side atomic overselling protection
 */

export async function createOffer({
  buyerId,
  sellingLotId,
  buyingRequirementId,
  proposedQuantity,
  proposedPricePerUnit,
  priceUnit = 'quintal',
  pickupDeliveryPreference = 'pickup_at_farm',
  transportResponsibility = 'buyer',
  paymentTerms,
  message,
  expectedDate,
}) {
  // 1. Validation
  const quantity = parseFloat(proposedQuantity);
  const price = parseFloat(proposedPricePerUnit);

  if (!quantity || quantity <= 0) {
    throw new Error('Proposed quantity must be greater than zero');
  }
  if (!price || price <= 0) {
    throw new Error('Proposed price per unit must be greater than zero');
  }
  if (!paymentTerms || !paymentTerms.trim()) {
    throw new Error('Payment terms must be specified');
  }

  // 2. Fetch and validate selling lot
  const { data: lot, error: lotErr } = await supabase
    .from('selling_lots')
    .select('*')
    .eq('id', sellingLotId)
    .single();

  if (lotErr || !lot) {
    throw new Error('Selling lot not found');
  }
  if (lot.status?.toLowerCase() !== 'active') {
    throw new Error(`Selling lot is not active (current status: ${lot.status})`);
  }
  if (parseFloat(lot.available_quantity) < quantity) {
    throw new Error(
      `Requested quantity (${quantity} ${lot.unit}) exceeds available stock (${lot.available_quantity} ${lot.unit})`
    );
  }

  // 3. If tied to a requirement, validate requirement ownership and capacity
  let validatedReqId = null;
  if (buyingRequirementId) {
    const { data: req, error: reqErr } = await supabase
      .from('buying_requirements')
      .select('*')
      .eq('id', buyingRequirementId)
      .single();

    if (!reqErr && req) {
      if (req.buyer_id !== buyerId) {
        throw new Error('Buying requirement does not belong to the current authenticated buyer');
      }
      const remainingNeeded = parseFloat(req.required_quantity || 0) - parseFloat(req.fulfilled_quantity || 0);
      if (remainingNeeded < quantity) {
        throw new Error(
          `Offer quantity (${quantity}) exceeds remaining required quantity (${remainingNeeded}) on this requirement`
        );
      }
      validatedReqId = req.id;
    }
  }

  // 4. Build initial negotiation timeline event
  const initialEvent = {
    event_id: 'evt_' + Date.now(),
    actor: 'BUYER',
    action: 'OFFER',
    quantity: quantity,
    price_per_unit: price,
    unit: priceUnit,
    transport_responsibility: transportResponsibility,
    pickup_delivery_preference: pickupDeliveryPreference,
    payment_terms: paymentTerms,
    message: message || 'Direct purchase offer submitted',
    timestamp: new Date().toISOString(),
  };

  const offerPayload = {
    selling_lot_id: lot.id,
    buying_requirement_id: validatedReqId,
    buyer_id: buyerId,
    farmer_id: lot.farmer_id,
    initiated_by: 'BUYER',
    proposed_quantity: quantity,
    proposed_price_per_unit: price,
    price_unit: priceUnit,
    pickup_delivery_preference: pickupDeliveryPreference,
    transport_responsibility: transportResponsibility,
    payment_terms: paymentTerms,
    expected_date: expectedDate || lot.expected_availability_date || null,
    message: JSON.stringify([initialEvent]),
    status: 'PENDING',
  };

  const { data: createdOffer, error: insertErr } = await supabase
    .from('offers')
    .insert(offerPayload)
    .select()
    .single();

  if (insertErr) {
    throw new Error('Failed to create offer: ' + insertErr.message);
  }

  return {
    ...createdOffer,
    timeline: [initialEvent],
  };
}

/**
 * Get all offers for a verified buyer
 */
export async function getBuyerOffers(buyerId, statusFilter) {
  let query = supabase
    .from('offers')
    .select(`
      *,
      selling_lots (
        id,
        crop_name,
        variety,
        unit,
        asking_price_per_unit,
        available_quantity,
        total_quantity,
        approx_location,
        state,
        district,
        quality_grade,
        status
      ),
      buying_requirements (
        id,
        crop_name,
        required_quantity,
        fulfilled_quantity,
        unit,
        max_price_per_unit,
        required_by_date,
        delivery_district
      ),
      farmer_profile:farmer_id (
        id,
        full_name,
        phone,
        district,
        state,
        village
      )
    `)
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false });

  if (statusFilter && statusFilter !== 'ALL') {
    query = query.eq('status', statusFilter.toUpperCase());
  }

  const { data, error } = await query;
  if (error) {
    throw new Error('Failed to fetch offers: ' + error.message);
  }

  return (data || []).map((row) => {
    let timeline = [];
    try {
      if (row.message && row.message.startsWith('[')) {
        timeline = JSON.parse(row.message);
      }
    } catch {
      timeline = [];
    }

    return {
      ...row,
      timeline,
      current_price_per_unit:
        row.status === 'COUNTERED' && row.counter_price_per_unit
          ? row.counter_price_per_unit
          : row.proposed_price_per_unit,
      current_quantity:
        row.status === 'COUNTERED' && row.counter_quantity
          ? row.counter_quantity
          : row.proposed_quantity,
    };
  });
}

/**
 * Get single offer detail with full negotiation history
 */
export async function getOfferDetail(offerId, buyerId) {
  const { data: offer, error } = await supabase
    .from('offers')
    .select(`
      *,
      selling_lots (
        id,
        farmer_id,
        crop_name,
        variety,
        unit,
        asking_price_per_unit,
        available_quantity,
        total_quantity,
        approx_location,
        state,
        district,
        quality_grade,
        quality_details,
        expected_availability_date,
        status
      ),
      buying_requirements (
        id,
        crop_name,
        variety,
        required_quantity,
        fulfilled_quantity,
        unit,
        max_price_per_unit,
        required_by_date,
        delivery_location,
        delivery_district,
        status
      ),
      buyer_profiles (
        id,
        business_name,
        contact_person,
        district,
        state
      ),
      farmer_profile:farmer_id (
        id,
        full_name,
        phone,
        district,
        state,
        village
      )
    `)
    .eq('id', offerId)
    .single();

  if (error || !offer) {
    throw new Error('Offer not found');
  }

  // Verify buyer ownership
  if (offer.buyer_id !== buyerId) {
    throw new Error('Unauthorized: You do not have access to this offer');
  }

  let timeline = [];
  try {
    if (offer.message && offer.message.startsWith('[')) {
      timeline = JSON.parse(offer.message);
    }
  } catch {
    timeline = [];
  }

  return {
    ...offer,
    timeline,
    current_price_per_unit:
      offer.status === 'COUNTERED' && offer.counter_price_per_unit
        ? offer.counter_price_per_unit
        : offer.proposed_price_per_unit,
    current_quantity:
      offer.status === 'COUNTERED' && offer.counter_quantity
        ? offer.counter_quantity
        : offer.proposed_quantity,
  };
}

/**
 * Submit a counteroffer
 */
export async function submitCounterOffer({
  offerId,
  actor = 'BUYER',
  counterPricePerUnit,
  counterQuantity,
  transportResponsibility,
  paymentTerms,
  counterNotes,
  buyerId,
}) {
  const { data: offer, error: fetchErr } = await supabase
    .from('offers')
    .select('*')
    .eq('id', offerId)
    .single();

  if (fetchErr || !offer) {
    throw new Error('Offer not found');
  }

  if (actor === 'BUYER' && offer.buyer_id !== buyerId) {
    throw new Error('Unauthorized: You do not own this offer');
  }

  // Validate state machine: only PENDING or COUNTERED offers can be countered
  if (offer.status !== 'PENDING' && offer.status !== 'COUNTERED') {
    throw new Error(`Cannot counter an offer with status '${offer.status}'`);
  }

  const price = parseFloat(counterPricePerUnit);
  const qty = parseFloat(counterQuantity || offer.proposed_quantity);

  if (!price || price <= 0) {
    throw new Error('Counter price per unit must be greater than zero');
  }
  if (!qty || qty <= 0) {
    throw new Error('Counter quantity must be greater than zero');
  }

  // Fetch lot to verify availability
  const { data: lot } = await supabase
    .from('selling_lots')
    .select('available_quantity, unit, status')
    .eq('id', offer.selling_lot_id)
    .single();

  if (!lot || lot.status?.toLowerCase() !== 'active') {
    throw new Error('Produce lot is no longer active');
  }
  if (parseFloat(lot.available_quantity) < qty) {
    throw new Error(
      `Counter quantity (${qty} ${lot.unit}) exceeds currently available stock (${lot.available_quantity} ${lot.unit})`
    );
  }

  // Parse existing timeline
  let timeline = [];
  try {
    if (offer.message && offer.message.startsWith('[')) {
      timeline = JSON.parse(offer.message);
    }
  } catch {
    timeline = [];
  }

  const newEvent = {
    event_id: 'evt_' + Date.now(),
    actor: actor,
    action: 'COUNTER',
    quantity: qty,
    price_per_unit: price,
    unit: offer.price_unit || 'quintal',
    transport_responsibility: transportResponsibility || offer.transport_responsibility,
    payment_terms: paymentTerms || offer.payment_terms,
    message: counterNotes || `${actor} countered with ₹${price}/${offer.price_unit || 'quintal'}`,
    timestamp: new Date().toISOString(),
  };

  timeline.push(newEvent);

  const updatePayload = {
    counter_price_per_unit: price,
    counter_quantity: qty,
    counter_notes: counterNotes || null,
    transport_responsibility: transportResponsibility || offer.transport_responsibility,
    payment_terms: paymentTerms || offer.payment_terms,
    message: JSON.stringify(timeline),
    status: 'COUNTERED',
    updated_at: new Date().toISOString(),
  };

  const { data: updatedOffer, error: updateErr } = await supabase
    .from('offers')
    .update(updatePayload)
    .eq('id', offerId)
    .select()
    .single();

  if (updateErr) {
    throw new Error('Failed to update counteroffer: ' + updateErr.message);
  }

  return {
    ...updatedOffer,
    timeline,
  };
}

/**
 * ATOMIC OFFER ACCEPTANCE & OVERSELLING PROTECTION
 * 
 * Re-reads current inventory and requirements with row validation.
 * Atomically deducts quantity from selling_lots and updates buying_requirements.
 */
export async function acceptOffer({ offerId, buyerId, actor = 'BUYER' }) {
  // 1. Fetch offer
  const { data: offer, error: fetchErr } = await supabase
    .from('offers')
    .select('*')
    .eq('id', offerId)
    .single();

  if (fetchErr || !offer) {
    throw new Error('Offer not found');
  }

  if (actor === 'BUYER' && offer.buyer_id !== buyerId) {
    throw new Error('Unauthorized: You do not own this offer');
  }

  // Validate state machine
  if (offer.status !== 'PENDING' && offer.status !== 'COUNTERED') {
    throw new Error(`Cannot accept an offer with status '${offer.status}'`);
  }

  // Effective agreed terms
  const agreedQuantity = parseFloat(
    offer.status === 'COUNTERED' && offer.counter_quantity
      ? offer.counter_quantity
      : offer.proposed_quantity
  );
  const agreedPrice = parseFloat(
    offer.status === 'COUNTERED' && offer.counter_price_per_unit
      ? offer.counter_price_per_unit
      : offer.proposed_price_per_unit
  );

  // 2. SERVER-SIDE OVERSELLING VERIFICATION
  const { data: lot, error: lotErr } = await supabase
    .from('selling_lots')
    .select('id, available_quantity, unit, status')
    .eq('id', offer.selling_lot_id)
    .single();

  if (lotErr || !lot) {
    throw new Error('Associated selling lot no longer exists');
  }

  const currentAvailable = parseFloat(lot.available_quantity || 0);
  if (currentAvailable < agreedQuantity) {
    throw new Error(
      `OVERSELLING REJECTED: Only ${currentAvailable} ${lot.unit} available, but offer requires ${agreedQuantity} ${lot.unit}.`
    );
  }

  // 3. Atomically deduct inventory from selling_lot
  const newLotQuantity = Math.max(0, currentAvailable - agreedQuantity);
  const newLotStatus = newLotQuantity === 0 ? 'RESERVED' : lot.status;

  const { error: lotUpdateErr } = await supabase
    .from('selling_lots')
    .update({
      available_quantity: newLotQuantity,
      status: newLotStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', lot.id);

  if (lotUpdateErr) {
    throw new Error('Failed to deduct selling lot quantity: ' + lotUpdateErr.message);
  }

  // 4. Update Buying Requirement fulfilled quantity if linked
  if (offer.buying_requirement_id) {
    const { data: req } = await supabase
      .from('buying_requirements')
      .select('id, required_quantity, fulfilled_quantity, status')
      .eq('id', offer.buying_requirement_id)
      .single();

    if (req) {
      const currentFulfilled = parseFloat(req.fulfilled_quantity || 0);
      const totalNeeded = parseFloat(req.required_quantity || 0);
      const newFulfilled = currentFulfilled + agreedQuantity;
      const newReqStatus = newFulfilled >= totalNeeded ? 'FULFILLED' : req.status;

      await supabase
        .from('buying_requirements')
        .update({
          fulfilled_quantity: newFulfilled,
          status: newReqStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', req.id);
    }
  }

  // 5. Append ACCEPT event to timeline
  let timeline = [];
  try {
    if (offer.message && offer.message.startsWith('[')) {
      timeline = JSON.parse(offer.message);
    }
  } catch {
    timeline = [];
  }

  const acceptEvent = {
    event_id: 'evt_' + Date.now(),
    actor: actor,
    action: 'ACCEPT',
    quantity: agreedQuantity,
    price_per_unit: agreedPrice,
    unit: offer.price_unit || 'quintal',
    message: `Offer accepted by ${actor}. Total agreed volume: ${agreedQuantity} ${offer.price_unit} @ ₹${agreedPrice}/${offer.price_unit}`,
    timestamp: new Date().toISOString(),
  };

  timeline.push(acceptEvent);

  // 6. Update Offer status to ACCEPTED
  const { data: acceptedOffer, error: offerUpdateErr } = await supabase
    .from('offers')
    .update({
      status: 'ACCEPTED',
      message: JSON.stringify(timeline),
      updated_at: new Date().toISOString(),
    })
    .eq('id', offerId)
    .select()
    .single();

  if (offerUpdateErr) {
    throw new Error('Failed to finalize offer acceptance: ' + offerUpdateErr.message);
  }

  return {
    success: true,
    message: 'Offer accepted successfully. Inventory reserved.',
    offer: {
      ...acceptedOffer,
      timeline,
    },
    inventory: {
      lot_id: lot.id,
      deducted_quantity: agreedQuantity,
      remaining_available: newLotQuantity,
    },
  };
}

/**
 * Reject an offer
 */
export async function rejectOffer({ offerId, buyerId, actor = 'BUYER', reason }) {
  const { data: offer, error: fetchErr } = await supabase
    .from('offers')
    .select('*')
    .eq('id', offerId)
    .single();

  if (fetchErr || !offer) {
    throw new Error('Offer not found');
  }

  if (actor === 'BUYER' && offer.buyer_id !== buyerId) {
    throw new Error('Unauthorized: You do not own this offer');
  }

  if (offer.status !== 'PENDING' && offer.status !== 'COUNTERED') {
    throw new Error(`Cannot reject an offer with status '${offer.status}'`);
  }

  let timeline = [];
  try {
    if (offer.message && offer.message.startsWith('[')) {
      timeline = JSON.parse(offer.message);
    }
  } catch {
    timeline = [];
  }

  const rejectEvent = {
    event_id: 'evt_' + Date.now(),
    actor: actor,
    action: 'REJECT',
    message: reason || `Offer rejected by ${actor}`,
    timestamp: new Date().toISOString(),
  };

  timeline.push(rejectEvent);

  const { data: updatedOffer, error: updateErr } = await supabase
    .from('offers')
    .update({
      status: 'REJECTED',
      message: JSON.stringify(timeline),
      updated_at: new Date().toISOString(),
    })
    .eq('id', offerId)
    .select()
    .single();

  if (updateErr) {
    throw new Error('Failed to reject offer: ' + updateErr.message);
  }

  return {
    ...updatedOffer,
    timeline,
  };
}

/**
 * Withdraw an offer (Buyer only before acceptance)
 */
export async function withdrawOffer({ offerId, buyerId, reason }) {
  const { data: offer, error: fetchErr } = await supabase
    .from('offers')
    .select('*')
    .eq('id', offerId)
    .single();

  if (fetchErr || !offer) {
    throw new Error('Offer not found');
  }

  if (offer.buyer_id !== buyerId) {
    throw new Error('Unauthorized: You do not own this offer');
  }

  if (offer.status !== 'PENDING' && offer.status !== 'COUNTERED') {
    throw new Error(`Cannot withdraw an offer with status '${offer.status}'`);
  }

  let timeline = [];
  try {
    if (offer.message && offer.message.startsWith('[')) {
      timeline = JSON.parse(offer.message);
    }
  } catch {
    timeline = [];
  }

  const withdrawEvent = {
    event_id: 'evt_' + Date.now(),
    actor: 'BUYER',
    action: 'WITHDRAW',
    message: reason || 'Offer withdrawn by buyer',
    timestamp: new Date().toISOString(),
  };

  timeline.push(withdrawEvent);

  const { data: updatedOffer, error: updateErr } = await supabase
    .from('offers')
    .update({
      status: 'WITHDRAWN',
      message: JSON.stringify(timeline),
      updated_at: new Date().toISOString(),
    })
    .eq('id', offerId)
    .select()
    .single();

  if (updateErr) {
    throw new Error('Failed to withdraw offer: ' + updateErr.message);
  }

  return {
    ...updatedOffer,
    timeline,
  };
}

/**
 * Direct Farmer Match Request / Offer to a Buyer Requirement
 */
export async function createFarmerMatchRequest({
  buyingRequirementId,
  cropName,
  variety,
  quantity,
  unit = 'quintal',
  askingPricePerUnit,
  farmerPhone,
  farmerName,
  qualityGrade = 'Grade A',
  qualityNotes = '',
  approxLocation = 'Warangal',
  state = 'Telangana',
  district = 'Warangal',
  expectedDate = null,
  user = null,
}) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase database is not configured.');
  }

  let userId = user?.id || null;
  if (!userId) {
    userId = await getOrCreateDefaultFarmerUser();
  }

  const reqQty = parseFloat(quantity);
  const reqPrice = parseFloat(askingPricePerUnit);

  if (!reqQty || reqQty <= 0) {
    throw new Error('Quantity must be greater than zero');
  }
  if (!reqPrice || reqPrice <= 0) {
    throw new Error('Price willing to charge must be greater than zero');
  }
  if (!cropName || !cropName.trim()) {
    throw new Error('Crop name is required');
  }

  // Update farmer's profile phone/name if provided
  if (farmerPhone) {
    const profileUpdate = { phone: farmerPhone.trim() };
    if (farmerName && farmerName.trim()) profileUpdate.full_name = farmerName.trim();
    await supabase.from('profiles').update(profileUpdate).eq('id', userId);
  }

  // Fetch the buying requirement
  const { data: req, error: reqErr } = await supabase
    .from('buying_requirements')
    .select('*, buyer_profiles (*)')
    .eq('id', buyingRequirementId)
    .single();

  if (reqErr || !req) {
    throw new Error('Buying requirement not found');
  }

  // Check if farmer already has an active selling lot for this crop
  let { data: existingLots } = await supabase
    .from('selling_lots')
    .select('*')
    .eq('farmer_id', userId)
    .ilike('crop_name', cropName.trim())
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false })
    .limit(1);

  let lot = existingLots && existingLots.length > 0 ? existingLots[0] : null;

  // If no existing lot, create one using explicit farmer inputs
  if (!lot) {
    const { data: newLot, error: lotCreateErr } = await supabase
      .from('selling_lots')
      .insert({
        farmer_id: userId,
        crop_name: cropName.trim(),
        variety: variety ? variety.trim() : null,
        total_quantity: reqQty,
        available_quantity: reqQty,
        unit: unit,
        asking_price_per_unit: reqPrice,
        price_unit: unit,
        is_open_to_offers: true,
        approx_location: approxLocation,
        state: state,
        district: district,
        quality_grade: qualityGrade,
        quality_details: qualityNotes,
        expected_availability_date: expectedDate || new Date().toISOString().split('T')[0],
        status: 'ACTIVE'
      })
      .select()
      .single();

    if (lotCreateErr) {
      throw new Error('Failed to create selling lot for produce: ' + lotCreateErr.message);
    }
    lot = newLot;
  }

  // Build match request timeline event
  const initialEvent = {
    event_id: 'evt_' + Date.now(),
    actor: 'FARMER',
    action: 'OFFER',
    quantity: reqQty,
    price_per_unit: reqPrice,
    unit: unit,
    farmer_name: farmerName || 'Producer',
    farmer_phone: farmerPhone || '',
    message: `Farmer direct match request. Willing to supply ${reqQty} ${unit} at ₹${reqPrice}/${unit}. Farmer phone: ${farmerPhone || 'Available on request'}.`,
    timestamp: new Date().toISOString(),
  };

  const offerPayload = {
    selling_lot_id: lot.id,
    buying_requirement_id: req.id,
    buyer_id: req.buyer_id,
    farmer_id: userId,
    initiated_by: 'FARMER',
    proposed_quantity: reqQty,
    proposed_price_per_unit: reqPrice,
    price_unit: unit,
    pickup_delivery_preference: 'pickup_at_farm',
    transport_responsibility: req.transport_responsibility || 'buyer',
    payment_terms: req.payment_terms || 'Payment upon delivery and weighing',
    expected_date: expectedDate || lot.expected_availability_date || null,
    message: JSON.stringify([initialEvent]),
    status: 'PENDING',
  };

  const { data: createdOffer, error: insertErr } = await supabase
    .from('offers')
    .insert(offerPayload)
    .select()
    .single();

  if (insertErr) {
    throw new Error('Failed to send match request: ' + insertErr.message);
  }

  return {
    success: true,
    offer: createdOffer,
    lot: lot,
    timeline: [initialEvent],
  };
}

export async function getFarmerMatchRequests(userId) {
  if (!isSupabaseConfigured() || !userId) {
    return [];
  }

  const { data, error } = await supabase
    .from('offers')
    .select(`
      *,
      selling_lots (
        id,
        crop_name,
        variety,
        unit,
        asking_price_per_unit,
        available_quantity,
        total_quantity,
        approx_location,
        quality_grade,
        status
      ),
      buying_requirements (
        id,
        crop_name,
        required_quantity,
        unit,
        max_price_per_unit,
        delivery_location,
        delivery_district,
        buyer_profiles (
          id,
          business_name,
          buyer_type,
          district,
          state
        )
      )
    `)
    .eq('farmer_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Failed to fetch farmer match requests: ' + error.message);
  }

  return (data || []).map(row => {
    let timeline = [];
    try {
      if (row.message && row.message.startsWith('[')) {
        timeline = JSON.parse(row.message);
      }
    } catch {
      timeline = [];
    }
    return {
      ...row,
      timeline,
    };
  });
}

