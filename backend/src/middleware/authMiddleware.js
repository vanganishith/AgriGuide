import { supabase, isSupabaseConfigured } from '../config/supabase.js';

/**
 * Optional authentication middleware: extracts user identity from x-farmer-id, x-farmer-phone, or Bearer token.
 */
export async function optionalAuth(req, res, next) {
  try {
    if (!isSupabaseConfigured()) {
      req.user = null;
      return next();
    }

    // 1. Direct Farmer ID header
    const farmerId = req.headers['x-farmer-id'];
    if (farmerId && typeof farmerId === 'string' && farmerId.trim().length > 0) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', farmerId.trim())
        .limit(1);

      if (!error && profile && profile.length > 0) {
        req.user = {
          id: profile[0].id,
          phone: profile[0].phone,
          fullName: profile[0].full_name,
          state: profile[0].state,
          district: profile[0].district,
          village: profile[0].village,
          preferredLanguage: profile[0].preferred_language,
        };
        return next();
      }
    }

    // 2. Direct Farmer Phone header
    const farmerPhone = req.headers['x-farmer-phone'];
    if (farmerPhone && typeof farmerPhone === 'string' && farmerPhone.trim().length > 0) {
      const cleanDigits = farmerPhone.replace(/\D/g, '');
      const normalizedPhone = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', normalizedPhone)
        .limit(1);

      if (!error && profile && profile.length > 0) {
        req.user = {
          id: profile[0].id,
          phone: profile[0].phone,
          fullName: profile[0].full_name,
          state: profile[0].state,
          district: profile[0].district,
          village: profile[0].village,
          preferredLanguage: profile[0].preferred_language,
        };
        return next();
      }
    }

    // 3. Supabase Auth Bearer token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        const { data, error } = await supabase.auth.getUser(token);
        if (!error && data?.user) {
          req.user = data.user;
          return next();
        }
      }
    }

    // 4. Direct Buyer ID header
    const buyerId = req.headers['x-buyer-id'];
    if (buyerId && typeof buyerId === 'string' && buyerId.trim().length > 0) {
      req.user = { id: buyerId.trim(), isBuyer: true };
      return next();
    }

    req.user = null;
    next();
  } catch (err) {
    req.user = null;
    next();
  }
}

/**
 * Strict authentication middleware: requires valid Bearer token and authenticated Supabase user.
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.getUser(token);
        if (!error && data?.user) {
          req.user = data.user;
          return next();
        }
      } catch (err) {
        // fall through
      }
    }
  }

  // Fallback dev headers: x-buyer-id or x-farmer-id
  const buyerId = req.headers['x-buyer-id'];
  if (buyerId && typeof buyerId === 'string' && buyerId.trim().length > 0) {
    req.user = { id: buyerId.trim() };
    return next();
  }

  const farmerId = req.headers['x-farmer-id'];
  if (farmerId && typeof farmerId === 'string' && farmerId.trim().length > 0) {
    req.user = { id: farmerId.trim() };
    return next();
  }

  return res.status(401).json({
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message: 'Authentication token is required for this operation.',
    },
  });
}
