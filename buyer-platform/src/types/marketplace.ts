export interface BuyerProfile {
  id: string;
  business_name: string;
  contact_person: string;
  mobile_number: string;
  buyer_type: string;
  state: string;
  district: string;
  city_town?: string;
  business_location?: string;
  business_address?: string;
  gstin?: string;
  preferred_crops?: string[];
  typical_quantity_range?: string;
  preferred_payment_terms?: string;
  preferred_procurement_radius_km?: number;
  quality_requirements?: string;
  is_profile_complete?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SellingLot {
  id: string;
  farmer_id: string;
  plot_id?: string | null;
  crop_name: string;
  variety?: string;
  total_quantity: number;
  available_quantity: number;
  unit: string;
  asking_price_per_unit: number;
  price_unit: string;
  is_open_to_offers: boolean;
  approx_location: string;
  state: string;
  district: string;
  expected_availability_date: string;
  quality_grade?: string;
  quality_details?: string;
  images?: string[];
  status: string;
  created_at: string;
  updated_at?: string;
  is_preferred?: boolean;
  preference_rank?: number;
  matched_preferred_crop?: string;
}

export interface BuyingRequirement {
  id: string;
  buyer_id: string;
  crop_name: string;
  variety?: string;
  required_quantity: number;
  fulfilled_quantity?: number;
  remaining_quantity?: number;
  unit: string;
  max_price_per_unit?: number;
  price_type?: string;
  price_unit?: string;
  required_by_date?: string;
  delivery_location?: string;
  delivery_state?: string;
  delivery_district?: string;
  preferred_radius_km?: number;
  quality_requirements?: string;
  packaging_requirements?: string;
  transport_preference?: string;
  payment_preferences?: string;
  notes?: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface MandiReference {
  modal_price: number;
  min_price: number;
  max_price: number;
  market_name: string;
  observed_date: string;
  source: string;
}

export interface PriceAnalysis {
  price_compatibility_score: number;
  price_tier: 'EXCELLENT' | 'GOOD' | 'NEGOTIABLE' | 'POOR' | 'NEGOTIABLE OPEN';
  farmer_asking_price: number;
  buyer_target_price?: number | null;
  buyer_max_price?: number | null;
  mandi_reference?: MandiReference | null;
  deltas: {
    farmer_vs_market_pct?: number | null;
    farmer_vs_buyer_max_pct?: number | null;
    farmer_vs_buyer_target_pct?: number | null;
  };
  negotiation_range: {
    min_price: number;
    max_price: number;
    label: string;
  };
  explanation: string;
}

export interface MatchScoreBreakdown {
  price?: number;
  quantity?: number;
  availability?: number;
  location?: number;
  quality?: number;
}

export interface RawSubScores {
  price: number;
  quantity: number;
  availability: number;
  location: number;
  quality: number;
}

export interface MatchItem {
  lot: SellingLot;
  price_analysis: PriceAnalysis;
  match_score: number;
  match_tier: 'EXCELLENT MATCH' | 'STRONG MATCH' | 'COMPATIBLE MATCH';
  match_reasons: string[];
  score_breakdown: MatchScoreBreakdown;
  raw_scores?: RawSubScores;
  fulfillment_type: 'FULL_FULFILLMENT' | 'PARTIAL_FULFILLMENT';
  fulfillable_quantity: number;
}

export interface RequirementMatchesResponse {
  requirement: BuyingRequirement;
  matches: MatchItem[];
  total_matches: number;
}

export interface NegotiationEvent {
  event_id?: string;
  actor: 'BUYER' | 'FARMER';
  action: 'OFFER' | 'COUNTER' | 'ACCEPT' | 'REJECT' | 'WITHDRAW';
  quantity?: number;
  price_per_unit?: number;
  unit?: string;
  transport_responsibility?: string;
  pickup_delivery_preference?: string;
  payment_terms?: string;
  message?: string;
  timestamp: string;
}

export interface Offer {
  id: string;
  selling_lot_id: string;
  buying_requirement_id?: string | null;
  buyer_id: string;
  farmer_id: string;
  initiated_by: 'BUYER' | 'FARMER';
  proposed_quantity: number;
  proposed_price_per_unit: number;
  price_unit: string;
  pickup_delivery_preference: string;
  expected_date?: string | null;
  transport_responsibility: string;
  payment_terms: string;
  message?: string;
  offer_expiry_date?: string | null;
  counter_price_per_unit?: number | null;
  counter_quantity?: number | null;
  counter_notes?: string | null;
  status: 'PENDING' | 'COUNTERED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED';
  created_at: string;
  updated_at: string;
  timeline?: NegotiationEvent[];
  current_price_per_unit?: number;
  current_quantity?: number;
  selling_lots?: SellingLot;
  buying_requirements?: BuyingRequirement;
  buyer_profiles?: BuyerProfile;
  farmer_profile?: {
    id: string;
    full_name: string;
    phone: string;
    district?: string;
    state?: string;
    village?: string;
  };
}

export interface MarketplaceStats {
  activeLotsCount: number;
  totalAvailableQuantity: number;
  registeredBuyersCount: number;
  activeRequirementsCount: number;
  activeOffersCount?: number;
}
