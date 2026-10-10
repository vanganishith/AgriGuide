import { fetchApi } from '../apiConfig';

export interface BuyerRequirementOpportunity {
  id: string;
  cropName: string;
  variety?: string | null;
  requiredQuantity: number;
  fulfilledQuantity: number;
  remainingQuantity: number;
  unit: string;
  maxPricePerUnit?: number | null;
  priceType?: string | null;
  priceUnit?: string | null;
  requiredByDate?: string | null;
  deliveryLocation?: string | null;
  deliveryState?: string | null;
  deliveryDistrict?: string | null;
  preferredRadiusKm?: number | null;
  qualityRequirements?: string | null;
  packagingRequirements?: string | null;
  transportPreference?: string | null;
  paymentPreferences?: string | null;
  notes?: string | null;
  status: string;
  createdAt: string;
  buyer?: {
    businessName: string;
    buyerType: string;
    state: string;
    district: string;
    cityTown?: string;
  } | null;
}

export interface FarmerPublishedLot {
  id: string;
  farmer_id: string;
  plot_id?: string | null;
  crop_name: string;
  variety?: string | null;
  total_quantity: number;
  available_quantity: number;
  unit: string;
  asking_price_per_unit?: number | null;
  price_unit: string;
  is_open_to_offers: boolean;
  approx_location: string;
  state: string;
  district: string;
  expected_availability_date: string;
  quality_grade?: string;
  quality_details?: string | null;
  images?: string[];
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface PublishProducePayload {
  cropName: string;
  variety?: string;
  totalQuantity: number;
  unit?: string;
  askingPricePerUnit?: number | null;
  priceUnit?: string;
  isOpenToOffers?: boolean;
  approxLocation?: string;
  state?: string;
  district?: string;
  expectedAvailabilityDate?: string;
  qualityGrade?: string;
  qualityDetails?: string;
  plotId?: string;
}

export interface FarmerMatchRequestPayload {
  buyingRequirementId: string;
  cropName: string;
  variety?: string;
  quantity: number;
  unit?: string;
  askingPricePerUnit: number;
  farmerPhone: string;
  farmerName?: string;
  qualityGrade?: string;
  qualityNotes?: string;
  approxLocation?: string;
  state?: string;
  district?: string;
  expectedDate?: string;
}

export interface FarmerSentMatchRequest {
  id: string;
  selling_lot_id: string;
  buying_requirement_id?: string;
  buyer_id: string;
  farmer_id: string;
  initiated_by: string;
  proposed_quantity: number;
  proposed_price_per_unit: number;
  price_unit: string;
  payment_terms?: string;
  status: string;
  created_at: string;
  message?: string;
  timeline?: any[];
  selling_lots?: {
    id: string;
    crop_name: string;
    variety?: string;
    unit: string;
  };
  buying_requirements?: {
    id: string;
    crop_name: string;
    required_quantity: number;
    unit: string;
    max_price_per_unit?: number;
    delivery_location?: string;
    delivery_district?: string;
    buyer_profiles?: {
      id: string;
      business_name: string;
      buyer_type: string;
      district?: string;
      state?: string;
    };
  };
}

export const FarmerMarketplaceService = {
  /**
   * Fetch active buyer requirements with verified buyer profile info
   */
  async getBuyerOpportunities(filter?: { crop?: string; district?: string; state?: string }): Promise<BuyerRequirementOpportunity[]> {
    try {
      const params = new URLSearchParams();
      if (filter?.crop) params.append('crop', filter.crop);
      if (filter?.district) params.append('district', filter.district);
      if (filter?.state) params.append('state', filter.state);

      const qs = params.toString();
      const endpoint = `/marketplace/opportunities${qs ? `?${qs}` : ''}`;
      const res = await fetchApi<any>(endpoint);

      if (res) {
        const anyRes = res as any;
        const list = anyRes.data?.requirements || anyRes.requirements || (Array.isArray(anyRes.data) ? anyRes.data : (Array.isArray(anyRes) ? anyRes : []));
        if (Array.isArray(list)) {
          return list;
        }
      }
      return [];
    } catch (err) {
      console.warn('[FarmerMarketplace] Failed to fetch buyer opportunities:', err);
      return [];
    }
  },

  /**
   * Fetch farmer's own published selling lots
   */
  async getMySellingLots(): Promise<FarmerPublishedLot[]> {
    try {
      const res = await fetchApi<any>('/marketplace/my-lots');
      if (res) {
        const anyRes = res as any;
        const list = anyRes.data?.lots || anyRes.lots || (Array.isArray(anyRes.data) ? anyRes.data : (Array.isArray(anyRes) ? anyRes : []));
        if (Array.isArray(list)) {
          return list;
        }
      }
      return [];
    } catch (err) {
      console.warn('[FarmerMarketplace] Failed to fetch farmer selling lots:', err);
      return [];
    }
  },

  /**
   * Publish farmer produce to selling_lots
   */
  async publishProduce(payload: PublishProducePayload): Promise<{ success: boolean; lot?: FarmerPublishedLot; error?: string }> {
    try {
      const res = await fetchApi<any>('/marketplace/lots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const anyRes = res as any;
      const lot = anyRes.data?.lot || anyRes.lot;
      if (lot) {
        return { success: true, lot };
      }
      return { success: false, error: anyRes.message || anyRes.error?.message || 'Failed to publish produce' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error publishing produce' };
    }
  },

  /**
   * Update or deactivate/cancel a published selling lot
   */
  async updateLotStatus(lotId: string, status: 'ACTIVE' | 'CANCELLED' | 'SOLD'): Promise<boolean> {
    try {
      const res = await fetchApi(`/marketplace/my-lots/${lotId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      return res.success;
    } catch (err) {
      console.warn('[FarmerMarketplace] Failed to update lot status:', err);
      return false;
    }
  },

  /**
   * Send a direct matchup / offer request to a buyer requirement
   */
  async sendMatchRequest(payload: FarmerMatchRequestPayload): Promise<{ success: boolean; message?: string; offer?: any; error?: string }> {
    try {
      const res = await fetchApi<any>('/marketplace/match-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const anyRes = res as any;
      if (anyRes && (anyRes.success || anyRes.offer || anyRes.data?.offer)) {
        return { success: true, offer: anyRes.offer || anyRes.data?.offer, message: anyRes.message };
      }
      return { success: false, error: anyRes.message || anyRes.error?.message || 'Failed to send match request' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error sending match request' };
    }
  },

  /**
   * Fetch farmer's sent match requests
   */
  async getMyMatchRequests(): Promise<FarmerSentMatchRequest[]> {
    try {
      const res = await fetchApi<any>('/marketplace/my-match-requests');
      const anyRes = res as any;
      const list = anyRes?.data?.requests || anyRes?.requests || [];
      return Array.isArray(list) ? list : [];
    } catch (err) {
      console.warn('[FarmerMarketplace] Failed to fetch match requests:', err);
      return [];
    }
  }
};

