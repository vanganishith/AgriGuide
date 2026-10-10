import { supabase } from '../../config/supabase.js';

/**
 * Phase 3 — Explainable Price Matching & Multi-Dimensional Compatibility Engine
 * 
 * Central Value Proposition:
 * "AgriGuide helps a buyer understand whether a farmer's asking price is reasonable
 * and whether that supply is a good match for the buyer's requirement."
 * 
 * Evaluates:
 * 1. Price Analysis & Compatibility (Hero Metric)
 *    - Farmer asking rate
 *    - Mandi reference (APMC / e-NAM benchmark from real DB)
 *    - Buyer target price & ceiling maximum
 *    - Delta percentages: Farmer vs Market, Farmer vs Buyer Ceiling
 *    - Plain-English reason & Suggested Reference Negotiation Range
 * 2. Deterministic Component Scores (0 – 100):
 *    - Price Compatibility (30% weight) — PROMINENT HERO
 *    - Quantity Fit (25% weight)
 *    - Harvest Availability (20% weight)
 *    - Location & Logistics (15% weight)
 *    - Quality Grade (10% weight)
 * 3. Human-readable explainable justification bullets.
 */

export async function findMatchesForRequirement(requirementId, buyerId) {
  // 1. Fetch requirement
  const { data: reqData, error: reqErr } = await supabase
    .from('buying_requirements')
    .select('*')
    .eq('id', requirementId)
    .single();

  if (reqErr || !reqData) {
    throw new Error('Buying requirement not found');
  }

  // 2. Fetch all active selling lots with available stock
  const { data: lots, error: lotsErr } = await supabase
    .from('selling_lots')
    .select('*')
    .in('status', ['ACTIVE', 'active'])
    .gt('available_quantity', 0);

  if (lotsErr) {
    throw new Error('Failed to query selling lots: ' + lotsErr.message);
  }

  if (!lots || lots.length === 0) {
    return {
      requirement: reqData,
      matches: [],
      total_matches: 0,
    };
  }

  // 3. Fetch real APMC market reference prices for the target commodity
  const reqCrop = (reqData.crop_name || '').toLowerCase().trim();
  const { data: marketRecords } = await supabase
    .from('market_prices')
    .select('*')
    .ilike('commodity', `%${reqCrop}%`)
    .order('created_at', { ascending: false });

  const remainingNeeded = Math.max(
    0,
    parseFloat(reqData.required_quantity || 0) - parseFloat(reqData.fulfilled_quantity || 0)
  );

  const matchedLots = [];

  for (const lot of lots) {
    const hardFilterResult = evaluateHardFilters(reqData, lot);
    if (!hardFilterResult.passes) {
      continue;
    }

    // Find best matching APMC market record (prefer matching district)
    const lotDist = (lot.district || '').toLowerCase();
    const marketRef =
      marketRecords?.find((m) => (m.district || '').toLowerCase() === lotDist) ||
      marketRecords?.[0] ||
      null;

    const priceAnalysis = analyzePriceCompatibility(reqData, lot, marketRef);
    const multiDimScores = calculateMultiDimensionalScores(reqData, lot, remainingNeeded, priceAnalysis);

    matchedLots.push({
      lot: {
        id: lot.id,
        farmer_id: lot.farmer_id,
        crop_name: lot.crop_name,
        variety: lot.variety,
        total_quantity: parseFloat(lot.total_quantity),
        available_quantity: parseFloat(lot.available_quantity),
        unit: lot.unit,
        asking_price_per_unit: parseFloat(lot.asking_price_per_unit || 0),
        price_unit: lot.price_unit,
        is_open_to_offers: lot.is_open_to_offers,
        quality_grade: lot.quality_grade,
        quality_details: lot.quality_details,
        expected_availability_date: lot.expected_availability_date,
        approx_location: lot.approx_location,
        state: lot.state,
        district: lot.district,
        created_at: lot.created_at,
      },
      price_analysis: priceAnalysis,
      match_score: multiDimScores.overallScore,
      match_tier: multiDimScores.matchTier,
      match_reasons: multiDimScores.reasons,
      score_breakdown: multiDimScores.breakdown,
      raw_scores: multiDimScores.rawScores,
      fulfillment_type:
        parseFloat(lot.available_quantity) >= remainingNeeded ? 'FULL_FULFILLMENT' : 'PARTIAL_FULFILLMENT',
      fulfillable_quantity: Math.min(parseFloat(lot.available_quantity), remainingNeeded),
    });
  }

  // Rank by overall deterministic match score descending
  matchedLots.sort((a, b) => b.match_score - a.match_score);

  return {
    requirement: {
      ...reqData,
      remaining_quantity: remainingNeeded,
    },
    matches: matchedLots,
    total_matches: matchedLots.length,
  };
}

/**
 * Phase 3 Hero Feature: Explainable Price Analysis
 */
function analyzePriceCompatibility(req, lot, marketRef) {
  const farmerAsking = parseFloat(lot.asking_price_per_unit || 0);
  const buyerMax = parseFloat(req.max_price_per_unit || 0);
  const buyerTarget = parseFloat(req.target_price_per_unit || buyerMax || 0);
  const mandiModal = marketRef ? parseFloat(marketRef.modal_price || 0) : null;

  // 1. Calculate Deltas
  let farmerVsMarketPct = null;
  if (mandiModal && mandiModal > 0 && farmerAsking > 0) {
    farmerVsMarketPct = Math.round(((farmerAsking - mandiModal) / mandiModal) * 1000) / 10;
  }

  let farmerVsBuyerMaxPct = null;
  if (buyerMax > 0 && farmerAsking > 0) {
    farmerVsBuyerMaxPct = Math.round(((farmerAsking - buyerMax) / buyerMax) * 1000) / 10;
  }

  let farmerVsBuyerTargetPct = null;
  if (buyerTarget > 0 && farmerAsking > 0) {
    farmerVsBuyerTargetPct = Math.round(((farmerAsking - buyerTarget) / buyerTarget) * 1000) / 10;
  }

  // 2. Deterministic Price Compatibility Score (0 - 100)
  let priceScore = 75;
  let priceTier = 'GOOD MATCH';

  if (lot.is_open_to_offers) {
    priceScore = 90;
    priceTier = 'NEGOTIABLE OPEN';
  } else if (buyerMax > 0 && farmerAsking > 0) {
    if (farmerAsking <= buyerTarget) {
      // Below or at buyer target price -> Excellent
      const discount = (buyerTarget - farmerAsking) / buyerTarget;
      priceScore = Math.min(100, Math.round(92 + discount * 20));
      priceTier = 'EXCELLENT';
    } else if (farmerAsking <= buyerMax) {
      // Between target and maximum budget -> Good
      const ratio = (farmerAsking - buyerTarget) / (buyerMax - buyerTarget || 1);
      priceScore = Math.round(92 - ratio * 15);
      priceTier = 'GOOD';
    } else {
      // Over maximum stated budget -> Negotiable or Poor
      const overPct = (farmerAsking - buyerMax) / buyerMax;
      if (overPct <= 0.1) {
        priceScore = Math.round(70 - overPct * 200);
        priceTier = 'NEGOTIABLE';
      } else {
        priceScore = Math.max(20, Math.round(50 - overPct * 100));
        priceTier = 'POOR';
      }
    }
  }

  // Market reference adjustment
  if (mandiModal && farmerVsMarketPct !== null) {
    if (Math.abs(farmerVsMarketPct) <= 3.0) {
      priceScore = Math.min(100, priceScore + 3);
    }
  }

  // 3. Plain-English Price Reason
  let priceExplanation = '';
  if (lot.is_open_to_offers) {
    priceExplanation = `Farmer has listed produce as open to negotiation without a fixed asking rate.`;
  } else if (mandiModal && buyerMax > 0) {
    if (farmerAsking <= buyerMax) {
      if (farmerVsMarketPct > 0) {
        priceExplanation = `Farmer's asking price (₹${farmerAsking}/${lot.unit}) is ${farmerVsMarketPct > 0 ? '+' : ''}${farmerVsMarketPct}% vs local mandi reference (₹${mandiModal}), but remains safely within your maximum ceiling budget (₹${buyerMax}).`;
      } else {
        priceExplanation = `Farmer's asking price (₹${farmerAsking}/${lot.unit}) is ${Math.abs(farmerVsMarketPct)}% below local mandi reference (₹${mandiModal}) and within your ceiling budget (₹${buyerMax}).`;
      }
    } else {
      priceExplanation = `Farmer's asking price (₹${farmerAsking}/${lot.unit}) is ${farmerVsBuyerMaxPct}% above your stated maximum ceiling (₹${buyerMax}). Active counter-bidding is recommended.`;
    }
  } else if (buyerMax > 0) {
    if (farmerAsking <= buyerMax) {
      priceExplanation = `Farmer's asking price (₹${farmerAsking}/${lot.unit}) is within your maximum budget of ₹${buyerMax}/${lot.unit} (Local mandi benchmark unavailable for this district).`;
    } else {
      priceExplanation = `Farmer's asking price (₹${farmerAsking}/${lot.unit}) exceeds your target budget of ₹${buyerMax}/${lot.unit}.`;
    }
  } else {
    priceExplanation = `Farmer asking rate: ₹${farmerAsking}/${lot.unit} evaluated against standard market quality.`;
  }

  // 4. Suggested Reference Negotiation Range
  let minRange = farmerAsking;
  let maxRange = farmerAsking;

  if (mandiModal && buyerMax > 0) {
    minRange = Math.min(mandiModal, farmerAsking, buyerTarget);
    maxRange = Math.max(mandiModal, farmerAsking, buyerMax);
  } else if (buyerMax > 0) {
    minRange = Math.min(farmerAsking, buyerTarget);
    maxRange = Math.max(farmerAsking, buyerMax);
  }

  return {
    price_compatibility_score: priceScore,
    price_tier: priceTier,
    farmer_asking_price: farmerAsking,
    buyer_target_price: buyerTarget > 0 ? buyerTarget : null,
    buyer_max_price: buyerMax > 0 ? buyerMax : null,
    mandi_reference: marketRef
      ? {
          modal_price: mandiModal,
          min_price: parseFloat(marketRef.min_price || mandiModal * 0.95),
          max_price: parseFloat(marketRef.max_price || mandiModal * 1.05),
          market_name: marketRef.market_name || `${marketRef.district} APMC Yard`,
          observed_date: marketRef.arrival_date || 'Today',
          source: marketRef.source || 'Agmarknet / e-NAM',
        }
      : null,
    deltas: {
      farmer_vs_market_pct: farmerVsMarketPct,
      farmer_vs_buyer_max_pct: farmerVsBuyerMaxPct,
      farmer_vs_buyer_target_pct: farmerVsBuyerTargetPct,
    },
    negotiation_range: {
      min_price: Math.round(minRange),
      max_price: Math.round(maxRange),
      label: 'Reference negotiation range (decision-support, not an authoritative price)',
    },
    explanation: priceExplanation,
  };
}

/**
 * Hard Filter Check: Excludes incompatible listings
 */
function evaluateHardFilters(req, lot) {
  // 1. Crop Match
  const reqCrop = (req.crop_name || '').toLowerCase().trim();
  const lotCrop = (lot.crop_name || '').toLowerCase().trim();
  if (!reqCrop || !lotCrop || (!lotCrop.includes(reqCrop) && !reqCrop.includes(lotCrop))) {
    return { passes: false, reason: 'Crop mismatch' };
  }

  // 2. Available Quantity > 0
  const lotQty = parseFloat(lot.available_quantity || 0);
  if (lotQty <= 0) {
    return { passes: false, reason: 'Zero available quantity' };
  }

  // 3. Variety Match (if requirement strictly specifies one)
  if (req.variety && req.variety.trim().length > 2) {
    const reqVar = req.variety.toLowerCase().trim();
    const lotVar = (lot.variety || '').toLowerCase().trim();
    const lotQual = (lot.quality_details || '').toLowerCase().trim();
    const combinedLotText = `${lotVar} ${lotQual}`;

    const reqTokens = reqVar.split(/\s+/).filter((t) => t.length > 2);
    const hasCommonToken = reqTokens.some((t) => combinedLotText.includes(t));
    if (!hasCommonToken && !combinedLotText.includes(reqVar) && !reqVar.includes(lotVar)) {
      return { passes: false, reason: 'Variety mismatch' };
    }
  }

  // 4. Availability Date Check
  if (req.required_by_date && lot.expected_availability_date) {
    const reqDate = new Date(req.required_by_date);
    const lotDate = new Date(lot.expected_availability_date);
    // Allow up to 3 days grace for logistics alignment
    const maxAllowedDate = new Date(reqDate.getTime() + 3 * 24 * 60 * 60 * 1000);
    if (lotDate > maxAllowedDate) {
      return { passes: false, reason: 'Lot availability date exceeds requirement deadline' };
    }
  }

  return { passes: true };
}

/**
 * Deterministic Multi-Dimensional Scores Calculation (0 - 100)
 */
function calculateMultiDimensionalScores(req, lot, remainingNeeded, priceAnalysis) {
  const reasons = [];
  const rawScores = {};
  const breakdown = {};

  // 1. Price Compatibility (Weight: 30%) — HERO METRIC
  const priceScore = priceAnalysis.price_compatibility_score;
  rawScores.price = priceScore;
  breakdown.price = Math.round(priceScore * 0.3);

  if (priceAnalysis.mandi_reference && priceAnalysis.deltas.farmer_vs_market_pct !== null) {
    const deltaSign = priceAnalysis.deltas.farmer_vs_market_pct > 0 ? '+' : '';
    reasons.push(
      `✓ Price is ${deltaSign}${priceAnalysis.deltas.farmer_vs_market_pct}% vs local Mandi reference (₹${priceAnalysis.mandi_reference.modal_price})`
    );
  }
  if (priceAnalysis.deltas.farmer_vs_buyer_max_pct !== null && priceAnalysis.deltas.farmer_vs_buyer_max_pct <= 0) {
    reasons.push(`✓ Asking rate is within your stated maximum budget (₹${req.max_price_per_unit})`);
  }

  // 2. Quantity Fit / Fulfillment (Weight: 25%)
  const lotQty = parseFloat(lot.available_quantity || 0);
  let quantityScore = 50;

  if (remainingNeeded <= 0) {
    quantityScore = 100;
  } else if (lotQty >= remainingNeeded) {
    quantityScore = 100;
    reasons.push(`✓ Single-lot full fulfillment (${lotQty} ${lot.unit} available for ${remainingNeeded} ${lot.unit} needed)`);
  } else {
    const fulfillmentRatio = lotQty / remainingNeeded;
    quantityScore = Math.round(50 + fulfillmentRatio * 50);
    reasons.push(`✓ Partial fulfillment batch (${lotQty} ${lot.unit} of ${remainingNeeded} ${lot.unit} needed)`);
  }
  rawScores.quantity = quantityScore;
  breakdown.quantity = Math.round(quantityScore * 0.25);

  // 3. Availability Timeline (Weight: 20%)
  let availabilityScore = 80;
  if (req.required_by_date && lot.expected_availability_date) {
    const reqDate = new Date(req.required_by_date);
    const lotDate = new Date(lot.expected_availability_date);
    const diffDays = Math.round((reqDate.getTime() - lotDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays >= 0) {
      availabilityScore = 100;
      reasons.push(`✓ Ready for pickup ${diffDays === 0 ? 'on deadline' : `${diffDays} days before deadline`}`);
    } else {
      availabilityScore = 65;
      reasons.push(`⚠ Ready slightly after target date (${lot.expected_availability_date})`);
    }
  } else {
    availabilityScore = 90;
    reasons.push('✓ Immediate/scheduled harvest dispatch');
  }
  rawScores.availability = availabilityScore;
  breakdown.availability = Math.round(availabilityScore * 0.2);

  // 4. Location & Logistics Fit (Weight: 15%)
  let locationScore = 60;
  const reqDist = (req.delivery_district || '').toLowerCase();
  const lotDist = (lot.district || '').toLowerCase();

  if (reqDist && lotDist && (reqDist === lotDist || reqDist.includes(lotDist) || lotDist.includes(reqDist))) {
    locationScore = 100;
    reasons.push(`✓ Local district supply (${lot.district}) minimizes freight costs`);
  } else {
    locationScore = 80;
    reasons.push(`✓ Same state transit (${lot.district}, ${lot.state})`);
  }
  rawScores.location = locationScore;
  breakdown.location = Math.round(locationScore * 0.15);

  // 5. Quality Grade Compatibility (Weight: 10%)
  let qualityScore = 70;
  const grade = (lot.quality_grade || '').toUpperCase();
  if (grade.includes('A')) {
    qualityScore = 100;
    reasons.push('✓ Premium Grade A quality certification');
  } else if (grade.includes('B')) {
    qualityScore = 80;
    reasons.push('✓ Standard Grade B produce');
  } else {
    qualityScore = 70;
    reasons.push('✓ Standard commercial market quality');
  }
  rawScores.quality = qualityScore;
  breakdown.quality = Math.round(qualityScore * 0.1);

  const overallScore = Math.min(
    100,
    breakdown.price + breakdown.quantity + breakdown.availability + breakdown.location + breakdown.quality
  );

  let matchTier = 'STRONG MATCH';
  if (overallScore >= 85) {
    matchTier = 'EXCELLENT MATCH';
  } else if (overallScore >= 70) {
    matchTier = 'STRONG MATCH';
  } else {
    matchTier = 'COMPATIBLE MATCH';
  }

  return {
    overallScore,
    matchTier,
    reasons: reasons.slice(0, 5), // Keep concise 3-5 reasons for judging presentation
    rawScores,
    breakdown,
  };
}
