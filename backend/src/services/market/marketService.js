import { env } from '../../config/env.js';
import { supabase, isSupabaseConfigured } from '../../config/supabase.js';
import { getTodayISTDateString } from '../../utils/istDateUtils.js';

// In-memory cache for market records with 15-minute TTL
const marketCache = new Map();
const MARKET_CACHE_TTL_MS = 15 * 60 * 1000;

/**
 * Standardize commodity search term to match APMC benchmark records
 */
export function normalizeCommodityQuery(commodity) {
  if (!commodity) return '';
  const c = commodity.trim().toLowerCase();
  if (c.includes('groundnut') || c.includes('peanut') || c.includes('ground nut') || c.includes('వేరుశనగ') || c.includes('వరి') && c.includes('శనగ') || c.includes('मूंगफली')) {
    return 'Groundnut';
  }
  if (c.includes('paddy') || c.includes('rice') || c.includes('వరి') || c.includes('धान')) {
    return 'Paddy';
  }
  if (c.includes('cotton') || c.includes('పత్తి') || c.includes('कपास')) {
    return 'Cotton';
  }
  if (c.includes('chilli') || c.includes('chili') || c.includes('మిరప') || c.includes('मिर्च')) {
    return 'Chilli';
  }
  if (c.includes('maize') || c.includes('corn') || c.includes('మొక్కజొన్న') || c.includes('मक्का')) {
    return 'Maize';
  }
  if (c.includes('tomato') || c.includes('టమాట') || c.includes('टमाटर')) {
    return 'Tomato';
  }
  if (c.includes('red gram') || c.includes('redgram') || c.includes('tur') || c.includes('arhar') || c.includes('pigeon pea') || c.includes('కంది') || c.includes('కందులు') || c.includes('अरहर') || c.includes('तुअर') || c.includes('तूर')) {
    return 'Red Gram';
  }
  return commodity.trim();
}

export function getMarketRecommendation(price) {
  const inputsUsed = ['modal_price', 'price_spread'];
  const spread = price.maxPrice - price.minPrice;
  const spreadRatio = price.modalPrice > 0 ? spread / price.modalPrice : 0;

  if (price.trendPercentage !== undefined && price.trendPercentage !== null && price.trendPercentage !== 0) {
    inputsUsed.push('trend_percentage');
    if (price.trendPercentage > 2.0) {
      return {
        decision: 'SELL',
        reason: `Strong upward momentum (+${price.trendPercentage}%). APMC auction bidding is active.`,
        inputsUsed,
      };
    } else if (price.trendPercentage < -2.0) {
      return {
        decision: 'HOLD',
        reason: `Recent arrival surge caused spot dips (${price.trendPercentage}%). Consider holding if storage permits.`,
        inputsUsed,
      };
    }
  }

  if (spreadRatio > 0.15) {
    inputsUsed.push('grade_spread_premium');
    return {
      decision: 'SELL',
      reason: 'Wide grade spread indicates premium bidding for well-dried, high-quality produce.',
      inputsUsed,
    };
  }

  return {
    decision: 'WAIT',
    reason: 'Spot rates are steady. Monitor upcoming mandi arrival volumes before liquidating.',
    inputsUsed,
  };
}

export async function getCurrentMarketPrices({ district = 'Warangal', state = 'Telangana', commodity }) {
  const normCommodity = normalizeCommodityQuery(commodity);
  const cacheKey = `${district.toLowerCase()}_${normCommodity ? normCommodity.toLowerCase() : 'all'}`;
  const cached = marketCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < MARKET_CACHE_TTL_MS) {
    return {
      records: cached.data.map(item => ({
        ...item,
        isCached: true,
      })),
    };
  }

  let rawRecords = [];
  let sourceName = 'Agmarknet / e-NAM Official Portal';

  // 1. Try Official External Agmarknet API (if API key is present)
  if (env.AGMARKNET_API_KEY) {
    try {
      const queryUrl = `${env.AGMARKNET_API_URL}?api-key=${env.AGMARKNET_API_KEY}&format=json&filters[district]=${encodeURIComponent(district)}`;
      const response = await fetch(queryUrl, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(6000),
      });

      if (response.ok) {
        const json = await response.json();
        rawRecords = json.records || [];
      }
    } catch (apiErr) {
      console.warn('[MarketService] External Agmarknet API unreachable, falling back to verified database:', apiErr.message);
    }
  }

  // 2. Query Supabase Verified APMC Records if external API returned no records
  if (rawRecords.length === 0 && isSupabaseConfigured()) {
    try {
      let query = supabase
        .from('market_prices')
        .select('*')
        .order('arrival_date', { ascending: false });

      if (normCommodity) {
        query = query.ilike('commodity', `%${normCommodity}%`);
      }

      const { data: dbRecords, error: dbErr } = await query;
      if (!dbErr && dbRecords && dbRecords.length > 0) {
        // Group by commodity and market to get latest arrival
        const latestByCommodity = new Map();
        
        // Match farmer district first, then statewide markets
        const sortedRecords = [...dbRecords].sort((a, b) => {
          const aMatch = a.district?.toLowerCase() === district.toLowerCase() ? 1 : 0;
          const bMatch = b.district?.toLowerCase() === district.toLowerCase() ? 1 : 0;
          if (aMatch !== bMatch) return bMatch - aMatch;
          return new Date(b.arrival_date).getTime() - new Date(a.arrival_date).getTime();
        });

        for (const rec of sortedRecords) {
          const key = `${rec.commodity.toLowerCase()}_${rec.market_name.toLowerCase()}`;
          if (!latestByCommodity.has(key)) {
            // Find historical previous day record for price delta calculation
            const prevRec = dbRecords.find(r => 
              r.commodity.toLowerCase() === rec.commodity.toLowerCase() &&
              r.market_name.toLowerCase() === rec.market_name.toLowerCase() &&
              r.arrival_date < rec.arrival_date
            );

            // Collect chronological price history for this market & commodity
            const history = dbRecords
              .filter(r => 
                r.commodity.toLowerCase() === rec.commodity.toLowerCase() &&
                r.market_name.toLowerCase() === rec.market_name.toLowerCase()
              )
              .sort((a, b) => new Date(a.arrival_date).getTime() - new Date(b.arrival_date).getTime())
              .map(r => ({
                date: r.arrival_date,
                modalPrice: Number(r.modal_price || 0),
                minPrice: Number(r.min_price || 0),
                maxPrice: Number(r.max_price || 0),
              }));

            // Find nearby markets for this commodity on latest date
            const nearby = dbRecords
              .filter(r => 
                r.commodity.toLowerCase() === rec.commodity.toLowerCase() &&
                r.market_name.toLowerCase() !== rec.market_name.toLowerCase() &&
                r.arrival_date === rec.arrival_date
              )
              .map(r => ({
                marketName: r.market_name,
                district: r.district,
                modalPrice: Number(r.modal_price || 0),
                minPrice: Number(r.min_price || 0),
                maxPrice: Number(r.max_price || 0),
                date: r.arrival_date,
                variety: r.variety,
                source: r.source,
              }));

            const modal = Number(rec.modal_price || 0);
            const prevModal = prevRec ? Number(prevRec.modal_price || 0) : null;
            let changeAmount = 0;
            let changePct = 0;

            if (prevModal && prevModal > 0) {
              changeAmount = modal - prevModal;
              changePct = Number(((changeAmount / prevModal) * 100).toFixed(1));
            } else if (rec.trend_percentage !== null && rec.trend_percentage !== undefined) {
              changePct = Number(rec.trend_percentage);
              changeAmount = Number((modal * (changePct / 100)).toFixed(0));
            }

            const recEngine = getMarketRecommendation({
              commodity: rec.commodity,
              modalPrice: modal,
              minPrice: Number(rec.min_price || modal),
              maxPrice: Number(rec.max_price || modal),
              trendPercentage: changePct,
            });

            const isToday = rec.arrival_date === getTodayISTDateString();

            latestByCommodity.set(key, {
              commodity: rec.commodity,
              variety: rec.variety || 'Standard',
              marketName: rec.market_name,
              district: rec.district || district,
              state: rec.state || state,
              modalPrice: modal,
              minPrice: Number(rec.min_price || modal),
              maxPrice: Number(rec.max_price || modal),
              unit: 'quintal',
              date: rec.arrival_date,
              freshness: isToday ? 'Updated today' : `Last available market reference: ${rec.arrival_date}`,
              isFresh: isToday,
              trendPercentage: changePct,
              trendDirection: changePct > 0 ? 'up' : changePct < 0 ? 'down' : 'steady',
              previousDayModal: prevModal,
              changeAmount,
              changePct,
              priceHistory: history,
              nearbyMarkets: nearby,
              actionRecommendation: rec.action_recommendation || recEngine.decision,
              actionReason: recEngine.reason,
              updatedAt: rec.created_at || new Date().toISOString(),
              source: rec.source || 'Agricultural Market Committee (e-NAM)',
              isCached: false,
            });
          }
        }

        // Return deduplicated list sorted so matching district crops come first
        rawRecords = Array.from(latestByCommodity.values());
      }
    } catch (dbError) {
      console.warn('[MarketService] Error querying Supabase market_prices:', dbError.message);
    }
  }

  // 3. If still no records, return honest empty result
  if (rawRecords.length === 0) {
    return {
      records: [],
      message: `Market reference unavailable for ${district}. Try selecting another commodity or market.`,
    };
  }

  marketCache.set(cacheKey, {
    timestamp: Date.now(),
    data: rawRecords,
  });

  return { records: rawRecords };
}
