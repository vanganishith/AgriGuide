import { 
  getSellingLots, 
  getSellingLotById, 
  createSellingLot,
  getFarmerSellingLots,
  updateSellingLotStatus,
} from '../services/marketplace/sellingLotService.js';
import { getBuyerProfile, upsertBuyerProfile } from '../services/marketplace/buyerService.js';
import { 
  getBuyerRequirements, 
  getActivePublicBuyerRequirements,
  createBuyingRequirement, 
  updateBuyingRequirementStatus 
} from '../services/marketplace/buyingRequirementService.js';
import { findMatchesForRequirement } from '../services/marketplace/matchingService.js';
import {
  createOffer,
  getBuyerOffers,
  getOfferDetail,
  submitCounterOffer,
  acceptOffer,
  rejectOffer,
  withdrawOffer,
  createFarmerMatchRequest,
  getFarmerMatchRequests,
} from '../services/marketplace/offerService.js';
import { supabase, isSupabaseConfigured, getOrCreateDefaultFarmerUser } from '../config/supabase.js';

// ==================== SELLING LOTS ====================

export async function handleGetSellingLots(req, res, next) {
  try {
    const { crop, state, district, minQty, maxPrice, qualityGrade, sort, limit, offset, preferredCrops } = req.query;
    const buyerId = req.query.buyerId || req.user?.id || req.headers['x-buyer-id'];
    const result = await getSellingLots({
      crop,
      state,
      district,
      minQty,
      maxPrice,
      qualityGrade,
      sort,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
      buyerId,
      preferredCrops: preferredCrops ? (Array.isArray(preferredCrops) ? preferredCrops : [preferredCrops]) : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function handleGetSellingLotById(req, res, next) {
  try {
    const lot = await getSellingLotById(req.params.id);
    res.json({ lot });
  } catch (err) {
    next(err);
  }
}

export async function handleCreateSellingLot(req, res, next) {
  try {
    const newLot = await createSellingLot(req.body, req.user);
    res.status(201).json({ lot: newLot, message: 'Selling lot successfully published.' });
  } catch (err) {
    next(err);
  }
}

export async function handleGetMySellingLots(req, res, next) {
  try {
    const userId = req.user?.id;
    const lots = await getFarmerSellingLots(userId);
    res.json({ lots, success: true });
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateMySellingLotStatus(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const lot = await updateSellingLotStatus(req.params.id, req.body.status, userId);
    res.json({ lot, success: true, message: `Listing status updated to ${req.body.status}.` });
  } catch (err) {
    next(err);
  }
}

// ==================== BUYER DISCOVERY & OPPORTUNITIES FOR FARMERS ====================

export async function handleGetBuyerOpportunities(req, res, next) {
  try {
    const { crop, state, district, limit, offset } = req.query;
    const requirements = await getActivePublicBuyerRequirements({
      crop,
      state,
      district,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    });
    res.json({ requirements, success: true, count: requirements.length });
  } catch (err) {
    next(err);
  }
}

// ==================== BUYER PROFILE ====================

export async function handleGetBuyerProfile(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const profile = await getBuyerProfile(userId);
    res.json({ profile });
  } catch (err) {
    next(err);
  }
}

export async function handleUpsertBuyerProfile(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const profile = await upsertBuyerProfile(req.body, userId);
    res.json({ profile, message: 'Buyer profile updated successfully.' });
  } catch (err) {
    next(err);
  }
}

// ==================== BUYING REQUIREMENTS ====================

export async function handleGetBuyingRequirements(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const requirements = await getBuyerRequirements(userId);
    res.json({ requirements });
  } catch (err) {
    next(err);
  }
}

export async function handleCreateBuyingRequirement(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const requirement = await createBuyingRequirement(req.body, userId);
    res.status(201).json({ requirement, message: 'Buying requirement published.' });
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateBuyingRequirementStatus(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const requirement = await updateBuyingRequirementStatus(req.params.id, req.body.status, userId);
    res.json({ requirement, message: `Requirement status updated to ${req.body.status}.` });
  } catch (err) {
    next(err);
  }
}

// ==================== MATCHING ENGINE ====================

export async function handleGetMatchesForRequirement(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const result = await findMatchesForRequirement(req.params.id, userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// ==================== OFFERS & NEGOTIATION ====================

export async function handleCreateOffer(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const offer = await createOffer({
      buyerId: userId,
      sellingLotId: req.body.selling_lot_id,
      buyingRequirementId: req.body.buying_requirement_id,
      proposedQuantity: req.body.proposed_quantity,
      proposedPricePerUnit: req.body.proposed_price_per_unit,
      priceUnit: req.body.price_unit,
      pickupDeliveryPreference: req.body.pickup_delivery_preference,
      transportResponsibility: req.body.transport_responsibility,
      paymentTerms: req.body.payment_terms,
      message: req.body.message,
      expectedDate: req.body.expected_date,
    });
    res.status(201).json({ offer, message: 'Purchase offer successfully submitted to farmer.' });
  } catch (err) {
    next(err);
  }
}

export async function handleGetBuyerOffers(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const { status } = req.query;
    const offers = await getBuyerOffers(userId, status);
    res.json({ offers });
  } catch (err) {
    next(err);
  }
}

export async function handleGetOfferById(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const offer = await getOfferDetail(req.params.id, userId);
    res.json({ offer });
  } catch (err) {
    next(err);
  }
}

export async function handleCounterOffer(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const actor = req.body.actor || 'BUYER';
    const result = await submitCounterOffer({
      offerId: req.params.id,
      actor,
      counterPricePerUnit: req.body.counter_price_per_unit,
      counterQuantity: req.body.counter_quantity,
      transportResponsibility: req.body.transport_responsibility,
      paymentTerms: req.body.payment_terms,
      counterNotes: req.body.counter_notes,
      buyerId: userId,
    });
    res.json({ offer: result, message: 'Counteroffer submitted successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function handleAcceptOffer(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const actor = req.body.actor || 'BUYER';
    const result = await acceptOffer({
      offerId: req.params.id,
      buyerId: userId,
      actor,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function handleRejectOffer(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const actor = req.body.actor || 'BUYER';
    const result = await rejectOffer({
      offerId: req.params.id,
      buyerId: userId,
      actor,
      reason: req.body.reason,
    });
    res.json({ offer: result, message: 'Offer rejected.' });
  } catch (err) {
    next(err);
  }
}

export async function handleWithdrawOffer(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const result = await withdrawOffer({
      offerId: req.params.id,
      buyerId: userId,
      reason: req.body.reason,
    });
    res.json({ offer: result, message: 'Offer withdrawn.' });
  } catch (err) {
    next(err);
  }
}

// ==================== DASHBOARD STATS ====================

export async function handleGetMarketplaceStats(req, res, next) {
  try {
    if (!isSupabaseConfigured()) {
      return res.json({
        activeLotsCount: 0,
        totalAvailableQuantity: 0,
        activeBuyersCount: 0,
        activeRequirementsCount: 0,
        activeOffersCount: 0,
      });
    }

    const userId = req.user?.id;

    const [lotsRes, reqsRes, buyersRes, offersRes] = await Promise.all([
      supabase.from('selling_lots').select('available_quantity').eq('status', 'active'),
      supabase.from('buying_requirements').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('buyer_profiles').select('id', { count: 'exact', head: true }),
      userId
        ? supabase.from('offers').select('id', { count: 'exact', head: true }).eq('buyer_id', userId)
        : Promise.resolve({ count: 0 }),
    ]);

    const lots = lotsRes.data || [];
    const totalQty = lots.reduce((sum, l) => sum + (Number(l.available_quantity) || 0), 0);

    res.json({
      activeLotsCount: lots.length,
      totalAvailableQuantity: Math.round(totalQty * 10) / 10,
      activeRequirementsCount: reqsRes.count || 0,
      registeredBuyersCount: buyersRes.count || 0,
      activeOffersCount: offersRes.count || 0,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleCreateFarmerMatchRequest(req, res, next) {
  try {
    const result = await createFarmerMatchRequest({
      ...req.body,
      user: req.user
    });
    res.status(201).json({
      success: true,
      message: 'Match request and produce terms successfully transmitted to buyer',
      ...result
    });
  } catch (err) {
    next(err);
  }
}

export async function handleGetFarmerMatchRequests(req, res, next) {
  try {
    let userId = req.user?.id;
    if (!userId) {
      userId = await getOrCreateDefaultFarmerUser();
    }
    const requests = await getFarmerMatchRequests(userId);
    res.json({
      success: true,
      requests
    });
  } catch (err) {
    next(err);
  }
}

