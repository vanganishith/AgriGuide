// =============================================================================
// AGRIGUIDE DATA CONTRACTS & TYPE DEFINITIONS
// =============================================================================

export type Language = 'en' | 'te' | 'hi';

export type DesktopNavTab = 'home' | 'doctor' | 'farm' | 'mandi' | 'money' | 'alerts';
export type NavTab = 'home' | 'doctor' | 'farm' | 'mandi' | 'money' | 'alerts';

export interface FarmerProfile {
  id?: string;
  phone?: string;
  fullName?: string;
  name?: string;
  acres?: number;
  crops?: string[];
  village?: string;
  district?: string;
  state?: string;
  preferredLanguage?: Language;
  isNewUser?: boolean;
}

export interface VerifiedCrop {
  id: string;
  name: string;
  local_name_te?: string;
  local_name_hi?: string;
  scientific_name?: string;
  standard_duration_days?: number;
  optimal_temp_min?: number;
  optimal_temp_max?: number;
}

export interface ExtractedFieldInfo {
  acres: number | null;
  location: string | null;
  district: string | null;
  village: string | null;
  soilType: string | null;
  irrigationSource: string | null;
  sowingWindow: string | null;
  mentionedCrop: string | null;
}

export interface CropComparisonItem {
  id?: string;
  cropName: string;
  localName?: string;
  scientificName?: string;
  suitabilityScore: 'High' | 'Moderate' | 'Low';
  suitabilityReason: string;
  durationDays: number;
  waterRequirement: 'Low' | 'Medium' | 'High';
  estimatedInvestmentPerAcre: {
    min: number;
    max: number;
    isEstimate: boolean;
  };
  expectedYieldPerAcre: {
    minQ: number;
    maxQ: number;
    isEstimate: boolean;
  };
  mandiPrice: string;
  estimatedMarginPerAcre: {
    min: number;
    max: number;
    isEstimate: boolean;
    isGuaranteed: boolean;
  };
  keyRisks: string[];
  weatherSuitability: string;
  applicableSchemes: string[];
  dataSource: string;
  lastUpdated: string;
}

export interface CropComparisonResponse {
  status: 'success' | 'no_data';
  summary: string;
  crops: CropComparisonItem[];
  weatherContext?: WeatherData | null;
}

export interface FarmPlot {
  id: string;
  farmId?: string;
  plotName: string;
  acres: number;
  currentCrop: string;
  variety?: string;
  sowingDate?: string;
  stage: string;
  daysSincePlanting?: number;
  status: 'healthy' | 'under_watch' | 'attention' | 'unassessed';
  todayAction?: string;
  nextAction?: string;
  recommendationsCount?: number;
}

export interface FarmerActivity {
  id: string;
  userId?: string;
  title: string;
  actionTitle?: string;
  cropTarget?: string;
  reason?: string;
  deadline?: string;
  urgency: 'high' | 'medium' | 'low';
  category: string;
  weatherContext?: string;
  source?: string;
  isCompleted: boolean;
  createdAt?: string;
}

export interface Farm {
  id: string;
  farmName: string;
  totalAcres: number;
  allocatedAcres?: number;
  availableAcres?: number;
  district: string;
  state: string;
  village?: string;
  soilType: string;
  irrigationSource: string;
  plotsCount?: number;
  cropsCount?: number;
  cropsList?: string[];
  plots: FarmPlot[];
}

export interface CropPlanMilestone {
  phase: string;
  daysRange: string;
  keyAction: string;
}

export interface CropPlanCostItem {
  item: string;
  costRangePerAcre: string;
  basis: string;
}

export interface CropPlanRisk {
  risk: string;
  severity: 'low' | 'medium' | 'high';
  preventiveAction: string;
}

export interface CropPlanScheme {
  schemeName: string;
  benefitSummary: string;
  howToApply: string;
}

export interface CropPlanStep {
  stepNumber: number;
  timing: string;
  title: string;
  category: 'pest' | 'irrigation' | 'fertilizer' | 'harvest';
  actionDetails: string;
  urgency: 'high' | 'medium' | 'low';
}

export interface CropPlanData {
  cropName: string;
  variety: string;
  acres: number;
  farmContextSummary: string;
  recommendedPlantingWindow: string;
  expectedDurationDays: number;
  expectedDurationText: string;
  durationMilestones: CropPlanMilestone[];
  estimatedInvestment: {
    minPerAcre: number;
    maxPerAcre: number;
    totalMin: number;
    totalMax: number;
    currency: string;
    costBreakdown: CropPlanCostItem[];
    disclaimer: string;
  };
  expectedYield: {
    minQuintalsPerAcre: number;
    maxQuintalsPerAcre: number;
    expectedTotalQuintalsMin: number;
    expectedTotalQuintalsMax: number;
    benchmarkSource: string;
  };
  estimatedRevenueAndMargin: {
    mandiPriceUsedPerQuintal: number;
    mandiPriceSource: string;
    estimatedGrossRevenueMin: number;
    estimatedGrossRevenueMax: number;
    estimatedNetMarginMin: number;
    estimatedNetMarginMax: number;
    isProfitGuaranteed: boolean;
    marginNote: string;
  };
  weatherConsiderations: string[];
  criticalAgronomicRisks: CropPlanRisk[];
  relevantGovernmentSchemes: CropPlanScheme[];
  initialCropManagementPlan: CropPlanStep[];
  summary: string;
}

export interface LocationContext {
  district: string;
  state: string;
  village?: string;
  mandal?: string;
  displayName?: string;
  latitude: number;
  longitude: number;
  source: 'gps' | 'manual' | 'default';
}

export interface WeatherData {
  location: string;
  temperature: number;
  feelsLike: number;
  rainfallProbability: number;
  humidity: number;
  windSpeedKmH: number;
  conditionText: string;
  isRainExpectedToday: boolean;
  advisoryText: string;
  sprayCondition: 'safe' | 'caution' | 'unsafe';
  sprayWindowText: string;
  updatedAt: string;
  source: string;
  isCached: boolean;
}

export interface MarketPriceHistoryPoint {
  date: string;
  modalPrice: number;
  minPrice: number;
  maxPrice: number;
}

export interface NearbyMarketComparison {
  marketName: string;
  district: string;
  modalPrice: number;
  minPrice?: number;
  maxPrice?: number;
  date: string;
  variety?: string;
  source?: string;
}

export interface MarketPrice {
  commodity: string;
  variety: string;
  marketName: string;
  district: string;
  state: string;
  modalPrice: number;
  minPrice: number;
  maxPrice: number;
  unit: string;
  date: string;
  freshness?: string;
  isFresh?: boolean;
  trendPercentage: number;
  trendDirection: 'up' | 'down' | 'steady';
  previousDayModal?: number | null;
  changeAmount?: number;
  changePct?: number;
  nearbyMarkets?: NearbyMarketComparison[];
  priceHistory?: MarketPriceHistoryPoint[];
  actionRecommendation: 'SELL' | 'HOLD' | 'WAIT';
  actionReason: string;
  updatedAt: string;
  source: string;
  isCached: boolean;
}

export interface CropHealth {
  id: string;
  cropName: string;
  variety: string;
  acres: number;
  status: 'healthy' | 'under_watch' | 'attention';
  lastInspectionDate: string;
  diseaseIdentified?: string;
  confidenceScore?: number;
  recommendedAction: string;
  urgency: 'high' | 'medium' | 'low';
  updatedAt: string;
  source: string;
}

export interface CropDoctorEvidenceAssessment {
  selectedCrop: string;
  photoCropAssessment: {
    cropIdentified: string | null;
    identityConfidence: 'high' | 'medium' | 'low' | 'unknown';
    isAgriculturalImage: boolean;
    reason: string;
  };
  voiceAssessment: {
    cropMentioned: string | null;
    cropMentionedExplicitly: boolean;
    reportedSymptoms: string[];
    reportedContext: string[];
  };
  crossModalConsistency: 'consistent' | 'conflict' | 'insufficient';
  conflictReason: string | null;
  evidenceQuality: 'sufficient' | 'insufficient';
}

export interface CropInvestigatorQuestion {
  text: string;
  reason: string;
  answerMode: 'voice_or_dont_know';
}

export interface CropInvestigationTurn {
  questionText: string;
  questionReason?: string;
  answerText: string;
  answerType: 'voice' | 'text' | 'unknown';
  language?: string;
}

export interface CropDoctorDiagnosis {
  status: 'no_issue' | 'problem_detected' | 'uncertain';
  evidenceAssessment?: CropDoctorEvidenceAssessment;
  combinedAssessment?: string;
  cropMismatchDetected?: boolean;
  selectedCrop?: string;
  visualCropIdentified?: string;
  voiceCropMentioned?: string | null;
  mismatchNotice?: string | null;
  diagnosisTitle: string;
  summary: string;
  severity: 'none' | 'low' | 'moderate' | 'high' | 'unknown';
  symptomsObserved: string[];
  farmerReportedSymptoms: string[];
  visualFindings: string[];
  likelyCause: string | null;
  recommendation: string[];
  immediateAction: string | null;
  whatToAvoid: string[];
  monitoringAdvice: string | null;
  needsExpertReview: boolean;
  additionalPhotosNeeded: string[];
  voiceContextUsed: boolean;
  imageCount: number;
  visualAnnotations?: Array<{
    imageIndex: number;
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  consultationQnA?: CropInvestigationTurn[];
  questionsAskedCount?: number;
  model?: string;
  aiLatencyMs?: number;
}

export interface TodayDecision {
  id: string;
  actionTitle: string;
  cropTarget: string;
  reason: string;
  deadline: string;
  urgency: 'high' | 'medium' | 'low';
  category: 'pest' | 'irrigation' | 'fertilizer' | 'harvest' | 'market';
  weatherContext: string;
  source: string;
  confidence?: number;
  isCompleted: boolean;
}

export interface AlertNotification {
  id: string;
  title: string;
  description: string;
  severity: 'warning' | 'danger' | 'info';
  issuedAt: string;
  source: string;
  affectedDistricts?: string[];
  isRead?: boolean;
  cropId?: string;
  activityId?: string;
  createdAt?: string;
  category?: 'skipped_activity' | 'scheme_deadline' | 'mandi_fluctuation' | 'weather' | 'general';
  actionLabel?: string;
  actionTab?: DesktopNavTab;
  metadata?: {
    cropName?: string;
    plotName?: string;
    deadline?: string;
    subsidyAmount?: string;
    modalPrice?: number;
    priceChange?: number;
    priceChangePercentage?: number;
    commodity?: string;
    mandiName?: string;
    recommendation?: 'SELL' | 'HOLD' | 'WAIT';
  };
}

export interface CropDailyActivity {
  id: string;
  cropId: string;
  farmId: string;
  farmerId?: string;
  activityDate: string;
  cropDay: number;
  title: string;
  conciseDescription: string;
  category: 'crop_scouting' | 'irrigation' | 'fertilizer' | 'weather_protection' | 'pest_control' | 'field_preparation' | 'harvest' | string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed' | 'missed' | 'skipped';
  isCompleted: boolean;
  sourceContext: string;
  weatherContext?: string;
  stage?: string;
  stageTe?: string;
  stageHi?: string;
  createdAt?: string;
  completedAt?: string | null;
  missedAt?: string | null;
}

export interface CropDayTimelineItem {
  cropDay: number;
  date: string;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  activitiesCount: number;
  completedCount: number;
  missedCount: number;
  pendingCount: number;
  status: 'completed' | 'missed' | 'in_progress' | 'pending';
  stage?: string;
  stageTe?: string;
  stageHi?: string;
}

export interface CropHeaderInfo {
  cropId: string;
  farmId: string;
  farmName: string;
  cropName: string;
  variety?: string;
  cropDay: number;
  sowingDate: string;
  acres: number;
  stage: string;
  stageTe?: string;
  stageHi?: string;
  status: 'healthy' | 'under_watch' | 'attention' | 'unassessed';
  createdAt?: string;
}

export interface CropConditionsInfo {
  soilType: string;
  irrigationType: string;
  district: string;
  state: string;
  location: string;
  weather: {
    temperature: number;
    rainfallProbability: number;
    windSpeedKmH: number;
    conditionText: string;
    sprayCondition?: 'safe' | 'caution' | 'unsafe';
    source: string;
  };
}

export interface CropDailyActivitiesResponse {
  cropHeader: CropHeaderInfo;
  conditions: CropConditionsInfo;
  todayActivities: CropDailyActivity[];
  timeline15Days: CropDayTimelineItem[];
  allActivities: CropDailyActivity[];
  recentHistoryAnalysis?: {
    summary: string;
    summaryTe?: string;
    summaryHi?: string;
    missedCount: number;
    completedCount: number;
    evaluatedDaysCount: number;
  };
}

export type SchemeCategory = 
  | 'all'
  | 'income_support'
  | 'credit'
  | 'insurance'
  | 'irrigation'
  | 'mechanization'
  | 'soil_health'
  | 'crop_specific'
  | 'horticulture'
  | 'central'
  | 'state';

export type SchemeAuthority = 'central' | 'state';

export interface SchemeDocumentRequirement {
  id: string;
  name: string;
  nameTe?: string;
  nameHi?: string;
  description?: string;
  isMandatory: boolean;
}

export interface SchemeInfo {
  id: string;
  officialName: string;
  officialNameTe?: string;
  officialNameHi?: string;
  shortName: string;
  ministry: string;
  ministryTe?: string;
  ministryHi?: string;
  authority: SchemeAuthority;
  stateApplicability: string[];
  cropApplicability: string[];
  category: SchemeCategory;
  benefitSummary: string;
  benefitSummaryTe?: string;
  benefitSummaryHi?: string;
  benefitAmountDetails: string;
  benefitAmountDetailsTe?: string;
  benefitAmountDetailsHi?: string;
  eligibilityCriteria: string[];
  eligibilityCriteriaTe?: string[];
  eligibilityCriteriaHi?: string[];
  exclusions?: string[];
  exclusionsTe?: string[];
  exclusionsHi?: string[];
  requiredDocuments: SchemeDocumentRequirement[];
  officialPortalUrl: string;
  portalActionText: string;
  portalActionTextTe?: string;
  portalActionTextHi?: string;
  lastVerifiedDate: string;
  sourceAuthority: string;
  applicationStatusText: string;
  applicationStatusTextTe?: string;
  applicationStatusTextHi?: string;
  isApplicationOpen: boolean;
}

export interface SchemeEvaluationResult {
  scheme: SchemeInfo;
  matchLevel: 'highly_relevant' | 'likely_relevant' | 'more_info_needed' | 'general_support';
  relevanceReason: string;
  relevanceReasonTe?: string;
  relevanceReasonHi?: string;
  missingInformation?: string[];
  missingInformationTe?: string[];
  missingInformationHi?: string[];
  actionRecommendation: string;
  actionRecommendationTe?: string;
  actionRecommendationHi?: string;
}

export interface FertilizerCropGuidance {
  cropName: string;
  recommendedHybrid?: string;
  standardDurationDays: number;
  npkRatioKgPerAcre: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
  };
  productDosagePerAcre: {
    ureaKg: number;
    dapKg: number;
    mopKg: number;
    sspKg?: number;
    complexKg?: number;
  };
  splitSchedule: {
    stageName: string;
    stageNameTe?: string;
    stageNameHi?: string;
    timingDayRange: string;
    description: string;
    descriptionTe?: string;
    descriptionHi?: string;
    ureaPct: number;
    dapPct: number;
    mopPct: number;
  }[];
  precautions: string[];
  precautionsTe?: string[];
  precautionsHi?: string[];
  sourceBenchmark: string;
}

export interface ScaleOfFinanceItem {
  cropName: string;
  cropNameTe?: string;
  cropNameHi?: string;
  minScalePerAcre: number;
  maxScalePerAcre: number;
  standardBenchmarkPerAcre: number;
  kharifInsPremiumPct: number;
  rabiInsPremiumPct: number;
  commercialPremiumPct?: number;
  source: string;
}

export interface SavedSchemeRecord {
  schemeId: string;
  savedAt: string;
  status: 'bookmarked' | 'planning_to_apply' | 'applied';
  completedDocuments: string[];
  notes?: string;
}

