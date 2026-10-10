import {
  BuyerProfile,
  SellingLot,
  BuyingRequirement,
  MarketplaceStats,
  RequirementMatchesResponse,
  Offer,
} from '../types/marketplace';

const API_BASE = '/api/marketplace';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('agriguide_buyer_token');
  const buyerId = localStorage.getItem('agriguide_buyer_id') || '8de5c2e3-9052-462a-9e92-39b33983e8f1';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (buyerId) {
    headers['x-buyer-id'] = buyerId;
  }

  return headers;
}

export const api = {
  // ==================== DASHBOARD & STATS ====================
  async getMarketStats(): Promise<MarketplaceStats> {
    const res = await fetch(`${API_BASE}/stats`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch marketplace statistics');
    return res.json();
  },

  // ==================== SELLING LOTS ====================
  async getSellingLots(params: {
    crop?: string;
    state?: string;
    district?: string;
    minQty?: number | string;
    maxPrice?: number | string;
    qualityGrade?: string;
    sort?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ lots: SellingLot[]; total: number }> {
    const query = new URLSearchParams();
    if (params.crop) query.set('crop', params.crop);
    if (params.state) query.set('state', params.state);
    if (params.district) query.set('district', params.district);
    if (params.minQty) query.set('minQty', String(params.minQty));
    if (params.maxPrice) query.set('maxPrice', String(params.maxPrice));
    if (params.qualityGrade) query.set('qualityGrade', params.qualityGrade);
    if (params.sort) query.set('sort', params.sort);
    if (params.limit) query.set('limit', String(params.limit));
    if (params.offset) query.set('offset', String(params.offset));

    const res = await fetch(`${API_BASE}/lots?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch produce lots');
    return res.json();
  },

  async getSellingLotById(id: string): Promise<{ lot: SellingLot }> {
    const res = await fetch(`${API_BASE}/lots/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch lot details');
    return res.json();
  },

  // ==================== BUYER PROFILE ====================
  async getBuyerProfile(): Promise<{ profile: BuyerProfile }> {
    const res = await fetch(`${API_BASE}/buyer/profile`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch buyer profile');
    return res.json();
  },

  async upsertBuyerProfile(profileData: Partial<BuyerProfile>): Promise<{ profile: BuyerProfile; message: string }> {
    const res = await fetch(`${API_BASE}/buyer/profile`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || err.message || 'Failed to save buyer profile');
    }
    return res.json();
  },

  // ==================== BUYING REQUIREMENTS ====================
  async getBuyingRequirements(): Promise<{ requirements: BuyingRequirement[] }> {
    const res = await fetch(`${API_BASE}/requirements`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch buying requirements');
    return res.json();
  },

  async createBuyingRequirement(
    reqData: Record<string, any>
  ): Promise<{ requirement: BuyingRequirement; message: string }> {
    const res = await fetch(`${API_BASE}/requirements`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(reqData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || err.message || 'Failed to post buying requirement');
    }
    return res.json();
  },

  async updateRequirementStatus(
    id: string,
    status: 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'FULFILLED'
  ): Promise<{ requirement: BuyingRequirement; message: string }> {
    const res = await fetch(`${API_BASE}/requirements/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update requirement status');
    return res.json();
  },

  // ==================== MATCHING ENGINE ====================
  async getRequirementMatches(requirementId: string): Promise<RequirementMatchesResponse> {
    const res = await fetch(`${API_BASE}/requirements/${requirementId}/matches`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || err.message || 'Failed to find matching produce');
    }
    return res.json();
  },

  // ==================== OFFERS & NEGOTIATION ====================
  async createOffer(payload: {
    selling_lot_id: string;
    buying_requirement_id?: string | null;
    proposed_quantity: number;
    proposed_price_per_unit: number;
    price_unit?: string;
    pickup_delivery_preference?: string;
    transport_responsibility?: string;
    payment_terms: string;
    message?: string;
    expected_date?: string;
  }): Promise<{ offer: Offer; message: string }> {
    const res = await fetch(`${API_BASE}/offers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || err.message || 'Failed to submit offer');
    }
    return res.json();
  },

  async getBuyerOffers(statusFilter?: string): Promise<{ offers: Offer[] }> {
    const query = statusFilter && statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
    const res = await fetch(`${API_BASE}/offers${query}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch negotiation offers');
    return res.json();
  },

  async getOfferById(offerId: string): Promise<{ offer: Offer }> {
    const res = await fetch(`${API_BASE}/offers/${offerId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch offer details');
    return res.json();
  },

  async submitCounterOffer(
    offerId: string,
    payload: {
      counter_price_per_unit: number;
      counter_quantity?: number;
      transport_responsibility?: string;
      payment_terms?: string;
      counter_notes?: string;
      actor?: 'BUYER' | 'FARMER';
    }
  ): Promise<{ offer: Offer; message: string }> {
    const res = await fetch(`${API_BASE}/offers/${offerId}/counter`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || err.message || 'Failed to submit counteroffer');
    }
    return res.json();
  },

  async acceptOffer(offerId: string, actor: 'BUYER' | 'FARMER' = 'BUYER'): Promise<{
    success: boolean;
    message: string;
    offer: Offer;
    inventory: { lot_id: string; deducted_quantity: number; remaining_available: number };
  }> {
    const res = await fetch(`${API_BASE}/offers/${offerId}/accept`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ actor }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || err.message || 'Failed to accept offer');
    }
    return res.json();
  },

  async rejectOffer(
    offerId: string,
    reason?: string,
    actor: 'BUYER' | 'FARMER' = 'BUYER'
  ): Promise<{ offer: Offer; message: string }> {
    const res = await fetch(`${API_BASE}/offers/${offerId}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ actor, reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || err.message || 'Failed to reject offer');
    }
    return res.json();
  },

  async withdrawOffer(offerId: string, reason?: string): Promise<{ offer: Offer; message: string }> {
    const res = await fetch(`${API_BASE}/offers/${offerId}/withdraw`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || err.message || 'Failed to withdraw offer');
    }
    return res.json();
  },

  // Backward compatibility aliases
  async getProfile(): Promise<BuyerProfile> {
    const res = await api.getBuyerProfile();
    return res.profile;
  },
  async getStats(): Promise<MarketplaceStats> {
    return api.getMarketStats();
  },
  async getRequirements(): Promise<BuyingRequirement[]> {
    const res = await api.getBuyingRequirements();
    return res.requirements;
  },
  async createRequirement(reqData: any): Promise<{ requirement: BuyingRequirement; message: string }> {
    return api.createBuyingRequirement(reqData);
  },
  async updateProfile(profileData: Partial<BuyerProfile>): Promise<{ profile: BuyerProfile; message: string }> {
    return api.upsertBuyerProfile(profileData);
  },
};

export const BuyerAPI = api;
export default api;
