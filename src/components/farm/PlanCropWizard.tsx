import React, { useState, useEffect, useRef } from 'react';
import type { 
  Language, 
  LocationContext, 
  Farm, 
  CropPlanData, 
  CropComparisonItem, 
  CropComparisonResponse 
} from '../../types';
import { translations } from '../../i18n/translations';
import { FarmService } from '../../services/farm/farmService';
import { SpeechService } from '../../utils/speechSynthesis';
import { fetchApi } from '../../services/apiConfig';
import { 
  X, 
  Sprout, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  AlertTriangle, 
  AlertCircle,
  Mic, 
  Square, 
  Volume2,
  MapPin
} from 'lucide-react';
import { LocationPickerModal } from '../location/LocationPickerModal';
import { getTodayISTDateString } from '../../utils/istDateUtils';
import { 
  localizeCropName, 
  localizeSoil, 
  localizeIrrigation, 
  localizeLocation 
} from '../../i18n/agriLocalization';

const WIZARD_STRINGS = {
  step: { en: 'Step', te: 'స్టెప్', hi: 'चरण' },
  of: { en: 'of', te: '/', hi: 'का' },
  steps: {
    1: { en: 'Farm Context', te: 'పొలం వివరాలు', hi: 'खेत का विवरण' },
    2: { en: 'Field Parameters', te: 'చేను & నీటి వనరులు', hi: 'खेत और सिंचाई पैरामीटर' },
    3: { en: 'Crop Comparison', te: 'పంటల పోలిక', hi: 'फसल तुलना' },
    4: { en: 'Production Plan', te: 'ఉత్పత్తి ప్రణాళిక', hi: 'उत्पादක योजना' },
  },
  titles: {
    2: { en: 'Field & Irrigation Information', te: 'చేను & సాగునీటి వివరాలు', hi: 'खेत और सिंचाई की जानकारी' },
  },
  step1: {
    selectExistingOrNew: {
      en: 'Select Existing Farm or Describe New',
      te: 'ఉన్న పొలాన్ని ఎంచుకోండి లేదా కొత్తది వివరించండి',
      hi: 'मौजूदा खेत चुनें या नया विवरण दें',
    },
    describeNewFarm: {
      en: '+ Describe New Farm',
      te: '+ కొత్త పొలం నమోదు చేయండి',
      hi: '+ नया खेत जोड़ें',
    },
    farmName: { en: 'Farm Name', te: 'పొలం పేరు', hi: 'खेत का नाम' },
    totalFarmAcres: { en: 'Total Farm Acres', te: 'మొత్తం పొలం విస్తీర్ణం (ఎకరాలు)', hi: 'कुल खेत का रकबा (एकड़)' },
    location: { en: 'Location', te: 'ప్రాంతం', hi: 'स्थान' },
    pinOnMap: { en: '📍 Pin on Map / GPS', te: '📍 మ్యాప్‌లో గుర్తించండి / GPS', hi: '📍 मैप पर चुनें / GPS' },
    district: { en: 'District', te: 'జిల్లా', hi: 'जिला' },
    villageMandal: { en: 'Village / Mandal', te: 'గ్రామం / మండలం', hi: 'गांव / मंडल' },
    villagePlaceholder: { en: 'e.g. Geesugonda', te: 'ఉదా: గీసుకొండ', hi: 'उदा. गीसुगोंडा' },
    continueToField: { en: 'Continue to Field Info', te: 'చేను వివరాలకు కొనసాగండి', hi: 'खेत की जानकारी पर जाएं' },
    acresAvailable: { en: 'Available', te: 'అందుబాటులో ఉంది', hi: 'उपलब्ध' },
    acres: { en: 'Acres', te: 'ఎకరాలు', hi: 'एकड़' },
  },
  step2: {
    voicePrompt: {
      en: '🎙 "My field is red loamy soil, borewell drip irrigation, planning 2 acres."',
      te: '🎙 "నా చేను ఎర్ర నేల, బోరుబావి డ్రిప్ ఇరిగేషన్, 2 ఎకరాలు ప్లాన్ చేస్తున్నాను."',
      hi: '🎙 "मेरा खेत लाल दोमट मिट्टी है, बोरवेल ड्रिप सिंचाई, 2 एकड़ की योजना है। आदि बोलें"',
    },
    speakFieldDetails: { en: '🎙 Speak Field Details', te: '🎙 చేను వివరాలు మాట్లాడండి', hi: '🎙 खेत का विवरण बोलें' },
    listening: { en: 'Listening... Tap to stop', te: 'వింటున్నాము... ఆపడానికి నొక్కండి', hi: 'सुन रहे हैं... रोकने के लिए टैप करें' },
    youSaid: { en: 'YOU SAID:', te: 'మీరు చెప్పినది:', hi: 'आपने कहा:' },
    acresPlanned: { en: 'Acres Planned for this Crop', te: 'ఈ పంట కోసం ప్లాన్ చేసిన ఎకరాలు', hi: 'इस फसल के लिए नियोजित एकड़' },
    acresUnallocated: { en: 'acres unallocated on', te: 'ఎకరాలు కేటాయించలేదు:', hi: 'एकड़ असंबद्ध हैं:' },
    soilType: { en: 'Soil Type', te: 'నేల రకం', hi: 'मिट्टी का प्रकार' },
    irrigationSource: { en: 'Irrigation Source', te: 'సాగునీటి వనరు', hi: 'सिंचाई का साधन' },
    plantingSeason: { en: 'Planting Season / Window', te: 'విత్తే కాలం / సీజన్', hi: 'बुवाई का मौसम / समय' },
    listen: { en: 'Listen', te: 'వినండి', hi: 'सुनें' },
    back: { en: 'Back', te: 'వెనుకకు', hi: 'पीछे जाएं' },
    whatCanIGrow: { en: 'What Can I Grow Here?', te: 'నేను ఇక్కడ ఏ పంటను సాగు చేయగలను?', hi: 'मैं यहाँ क्या उगा सकता हूँ?' },
  },
  step3: {
    analyzingTitle: {
      en: 'Analyzing Verified Agronomic Data & Economics...',
      te: 'ధృవీకరించిన వ్యవసాయ సమాచారం & మార్కెట్ ధరలను విశ్లేషిస్తున్నాము...',
      hi: 'सत्यापित कृषि डेटा और बाजार अर्थशास्त्र का विश्लेषण किया जा रहा है...',
    },
    analyzingSubtitle: {
      en: 'Grounding comparison in live weather, APMC Mandi price baselines, and ICAR benchmarks.',
      te: 'తాజా స్థానిక వాతావరణం, APMC మార్కెట్ ధరలు మరియు ICAR కొలమానాలతో పోలుస్తున్నాము.',
      hi: 'स्थानीय मौसम, APMC मंडी भाव और ICAR मानकों के आधार पर तुलना की जा रही है।',
    },
    agronomicAssessment: { en: 'Agronomic Assessment', te: 'వ్యవసాయ నిపుణుల అంచనా', hi: 'कृषि विशेषज्ञ मूल्यांकन' },
    listen: { en: 'Listen', te: 'వినండి', hi: 'सुनें' },
    stop: { en: 'Stop', te: 'ఆపండి', hi: 'रोकें' },
    askAgriGuideTitle: { en: '🎙 Ask AgriGuide about these crops', te: '🎙 ఈ పంటల గురించి అగ్రిగైడ్‌ను అడగండి', hi: '🎙 इन फसलों के बारे में एग्रीगाइड से पूछें' },
    askQuestion: { en: '🎙 Ask Question', te: '🎙 ప్రశ్న అడగండి', hi: '🎙 सवाल पूछें' },
    tryQuestions: {
      en: 'Try: "Which crop needs less water?" or "Which crop is safer for my soil?"',
      te: 'ప్రయత్నించండి: "ఏ పంటకు తక్కువ నీరు అవసరం?" లేదా "నా నేలకు ఏ పంట సురక్షితం?"',
      hi: 'उदाहरण: "किस फसल को कम पानी चाहिए?" या "मेरी मिट्टी के लिए कौन सी फसल सुरक्षित है?"',
    },
    agriGuideAnswer: { en: 'AGRIGUIDE ANSWER:', te: 'అగ్రిగైడ్ సమాధానం:', hi: 'एग्रीगाइड उत्तर:' },
    suitability: { en: 'Suitability', te: 'అనుకూలత', hi: 'अनुकूलता' },
    selected: { en: 'Selected', te: 'ఎంచుకోబడింది', hi: 'चयनित' },
    chooseThisCrop: { en: 'Choose this crop', te: 'ఈ పంటను ఎంచుకోండి', hi: 'यह फसल चुनें' },
    daysDuration: { en: 'Days Duration', te: 'రోజుల పంట కాలం', hi: 'दिन की अवधि' },
    water: { en: 'Water', te: 'నీటి అవసరం', hi: 'पानी' },
    estInvestment: { en: 'Est. Investment', te: 'అంచనా పెట్టుబడి', hi: 'अनुमानित लागत' },
    expectedYield: { en: 'Expected Yield', te: 'ఆశించిన దిగుబడి', hi: 'अनुमानित उपज' },
    mandiPriceBaseline: { en: 'Mandi Price Baseline', te: 'మార్కెట్ ధర ఆధారం', hi: 'मंडी मूल्य आधार' },
    estMarginRange: { en: 'Est. Margin Range', te: 'అంచనా నికర లాభం', hi: 'अनुमानित शुद्ध लाभ' },
    perAcre: { en: '/ac', te: '/ఎకరం', hi: '/एकड़' },
    qPerAcreEst: { en: 'Q/ac (Est.)', te: 'క్విం./ఎకరం (అంచనా)', hi: 'क्विं./एकड़ (अनुमान)' },
    source: { en: 'Source', te: 'ఆధారం', hi: 'स्रोत' },
    disclaimer: { en: '*Estimates only · Profit not guaranteed', te: '*అంచనాలు మాత్రమే · లాభం హామీ లేదు', hi: '*केवल अनुमान · लाभ की गारंटी नहीं' },
    generateCropPlan: {
      en: (c: string) => `Generate ${c} Plan`,
      te: (c: string) => `${c} ప్రణాళికను సిద్ధం చేయండి`,
      hi: (c: string) => `${c} योजना तैयार करें`,
    },
  },
  step4: {
    productionPlan: { en: 'Production Plan', te: 'ఉత్పత్తి ప్రణాళిక', hi: 'उत्पादन योजना' },
    cropStrategySummary: { en: 'Crop Strategy Summary', te: 'పంట వ్యూహం సారాంశం', hi: 'फसल रणनीति सारांश' },
    estTotalInvestment: { en: 'Est. Total Investment', te: 'మొత్తం అంచనా పెట్టుబడి', hi: 'कुल अनुमानित लागत' },
    expectedTotalYield: { en: 'Expected Total Yield', te: 'మొత్తం ఆశించిన దిగుబడి', hi: 'कुल अनुमानित उपज' },
    quintals: { en: 'Quintals', te: 'క్వింటాళ్లు', hi: 'क्विंटल' },
    estNetMarginRange: { en: 'Est. Net Margin Range', te: 'అంచనా నికర లాభం పరిధి', hi: 'अनुमानित शुद्ध लाभ सीमा' },
    notGuaranteedBenchmark: { en: 'Not guaranteed · Benchmark grounded', te: 'హామీ లేదు · ప్రమాణాల ఆధారితం', hi: 'गारंटी नहीं · मानकों पर आधारित' },
    initialManagementActions: { en: 'Initial Management Actions (Schedule)', te: 'ప్రారంభ నిర్వహణ చర్యలు (షెడ్యూల్)', hi: 'प्रारंभिक प्रबंधन कार्य (शेड्यूल)' },
    listenToSchedule: { en: 'Listen to schedule', te: 'షెడ్యూల్ వినండి', hi: 'शेड्यूल सुनें' },
    guidanceBasis: { en: 'Guidance Basis:', te: 'మార్గదర్శక ఆధారం:', hi: 'मार्गदर्शन आधार:' },
    mandi: { en: 'Mandi:', te: 'మార్కెట్:', hi: 'मंडी:' },
    yieldBenchmark: { en: 'Yield Benchmark:', te: 'దిగుబడి కొలమానం:', hi: 'उपज मानक:' },
    startThisCrop: { en: '[ Start this crop ]', te: '[ ఈ పంటను ప్రారంభించండి ]', hi: '[ इस फसल को शुरू करें ]' },
    startingCrop: { en: 'Starting Crop...', te: 'పంటను ప్రారంభిస్తున్నాము...', hi: 'फसल शुरू की जा रही है...' },
  }
};

function localizeWaterReq(water: string, lang: Language): string {
  if (!water || lang === 'en') return water;
  const w = water.toLowerCase();
  if (lang === 'te') {
    if (w.includes('medium')) return 'మధ్యస్థం';
    if (w.includes('high')) return 'అధికం';
    if (w.includes('low')) return 'తక్కువ';
  }
  if (lang === 'hi') {
    if (w.includes('medium')) return 'मध्यम';
    if (w.includes('high')) return 'अधिक';
    if (w.includes('low')) return 'कम';
  }
  return water;
}

function localizeSuitabilityScore(score: string, lang: Language): string {
  if (lang === 'en') return `${score} Suitability`;
  if (lang === 'te') {
    if (score === 'High') return 'అధిక అనుకూలత';
    if (score === 'Medium') return 'మధ్యస్థ అనుకూలత';
    return 'తక్కువ అనుకూలత';
  }
  if (lang === 'hi') {
    if (score === 'High') return 'उच्च अनुकूलता';
    if (score === 'Medium') return 'मध्यम अनुकूलता';
    return 'कम अनुकूलता';
  }
  return `${score} Suitability`;
}

function localizeComparisonSummary(summary: string, lang: Language): string {
  if (!summary || lang === 'en') return summary;
  if (summary.includes('Verified crop options based on State Agricultural University')) {
    if (lang === 'te') return 'రాష్ట్ర వ్యవసాయ విశ్వవిద్యాలయ సమాచార నిల్వ ఆధారంగా ధృవీకరించిన పంట ఎంపికలు.';
    if (lang === 'hi') return 'राज्य कृषि विश्वविद्यालय संदर्भ डेटाबेस पर आधारित सत्यापित फसल विकल्प।';
  }
  return summary;
}

function localizeSuitabilityReason(
  reason: string, 
  cropName: string, 
  soil: string, 
  irr: string, 
  lang: Language
): string {
  if (!reason || lang === 'en') return reason;
  const lower = reason.toLowerCase();
  const locCrop = localizeCropName(cropName, lang);
  const locSoil = localizeSoil(soil, lang);
  const locIrr = localizeIrrigation(irr, lang);
  
  if (lower.includes('suitable for') || lower.includes('under')) {
    if (lang === 'te') {
      return `${locSoil} మరియు ${locIrr} కింద ${locCrop} పంటకు అత్యంత అనుకూలం.`;
    }
    if (lang === 'hi') {
      return `${locSoil} और ${locIrr} के तहत ${locCrop} फसल के लिए उपयुक्त है।`;
    }
  }
  return reason;
}

function localizePlanSummary(
  summary: string, 
  cropName: string, 
  acres: number, 
  farmName: string, 
  lang: Language
): string {
  if (!summary || lang === 'en') return summary;
  if (summary.includes('Comprehensive production plan for') || summary.includes('Grounded in verified weather')) {
    const localizedCrop = localizeCropName(cropName, lang);
    if (lang === 'te') {
      return `${farmName} వద్ద ${acres} ఎకరాల ${localizedCrop} కోసం సమగ్ర ఉత్పత్తి ప్రణాళిక. తాజా వాతావరణం మరియు మార్కెట్ ధరల ఆధారంగా రూపొందించబడింది.`;
    }
    if (lang === 'hi') {
      return `${farmName} में ${acres} एकड़ ${localizedCrop} के लिए व्यापक उत्पादन योजना। ताज़ा मौसम और मंडी अर्थशास्त्र पर आधारित।`;
    }
  }
  return summary;
}

function localizeMilestoneStep(
  step: { title: string; timing: string; actionDetails: string }, 
  lang: Language
) {
  if (lang === 'en') return step;
  const t = step.title.toLowerCase();
  if (lang === 'te') {
    if (t.includes('soil preparation') || t.includes('basal') || t.includes('భూమి')) {
      return {
        title: 'భూమి తయారీ & ప్రాథమిక ఎరువులు',
        timing: 'విత్తడానికి 0-7 రోజుల ముందు',
        actionDetails: 'మంచి పశువుల ఎరువు మరియు భూసార పరీక్ష సిఫార్సుల మేరకు ప్రాథమిక ఎన్‌పీకే ఎరువులు వేయండి.',
      };
    }
    if (t.includes('treated seed') || t.includes('planting') || t.includes('విత్తన')) {
      return {
        title: 'విత్తన శుద్ధి & నాటడం',
        timing: 'విత్తే సమయంలో',
        actionDetails: 'జీవ శిలీంద్రనాశిని/పురుగుమందుతో శుద్ధి చేసిన ధృవీకరించిన విత్తనాలను సిఫార్సు చేసిన దూరంలో నాటండి.',
      };
    }
    if (t.includes('drip') || t.includes('gap filling') || t.includes('డ్రిప్')) {
      return {
        title: 'డ్రిప్ షెడ్యూల్ & ఖాళీల పూడ్చివేత',
        timing: 'విత్తిన 15-20 రోజుల తర్వాత',
        actionDetails: 'మొలక రాని ఖాళీలను పూడ్చండి మరియు రోజు విడిచి రోజు 1.5-2 గంటలు డ్రిప్ ద్వారా నీటిని అందించండి.',
      };
    }
    if (t.includes('pheromone') || t.includes('top-dressing') || t.includes('బుట్టల') || t.includes('ట్రాప్')) {
      return {
        title: 'లింగాకర్షక బుట్టల ఏర్పాటు & పైపాటు ఎరువులు',
        timing: 'విత్తిన 40-45 రోజుల తర్వాత',
        actionDetails: 'ఎకరానికి 5 లింగాకర్షక బుట్టలను అమర్చండి మరియు మొదటి విడత నత్రజని ఎరువును పైపాటుగా వేయండి.',
      };
    }
  } else if (lang === 'hi') {
    if (t.includes('soil preparation') || t.includes('basal')) {
      return {
        title: 'खेत की तैयारी और बुनियादी उर्वरक',
        timing: 'बुवाई से 0-7 दिन पहले',
        actionDetails: 'अच्छी सड़ी गोबर की खाद और मिट्टी परीक्षण के अनुसार बुनियादी एनपीके उर्वरक डालें।',
      };
    }
    if (t.includes('treated seed') || t.includes('planting')) {
      return {
        title: 'उपचारित बीज बुवाई',
        timing: 'बुवाई के समय',
        actionDetails: 'जैव-कवकनाशी/कीटनाशक से उपचारित प्रमाणित हाइब्रिड बीज को उचित दूरी पर बोएं।',
      };
    }
    if (t.includes('drip') || t.includes('gap filling')) {
      return {
        title: 'ड्रिप शेड्यूलिंग और गैप फिलिंग',
        timing: 'बुवाई के 15-20 दिन बाद',
        actionDetails: 'अंकुरण अंतराल को भरें और एक दिन छोड़कर 1.5 - 2 घंटे ड्रिप चलाएं।',
      };
    }
    if (t.includes('pheromone') || t.includes('top-dressing')) {
      return {
        title: 'फेरोमोन ट्रैप और टॉप-ड्रेसिंग',
        timing: 'बुवाई के 40-45 दिन बाद',
        actionDetails: 'प्रति एकड़ 5 फेरोमोन ट्रैप लगाएं और पहली बार नाइट्रोजन उर्वरक का छिड़काव/टॉप ड्रेसिंग करें।',
      };
    }
  }
  return step;
}

function localizeMarginNote(note: string, lang: Language): string {
  if (!note || lang === 'en') return note;
  if (note.includes('ESTIMATE ONLY') || note.includes('Profit is NOT guaranteed')) {
    if (lang === 'te') {
      return 'కేవలం అంచనా మాత్రమే. లాభం హామీ లేదు. నికర రాబడి వర్షపాతం, తెగుళ్ల తీవ్రత మరియు మార్కెట్ ధరలపై ఆధారపడి ఉంటుంది.';
    }
    if (lang === 'hi') {
      return 'केवल अनुमान। लाभ की गारंटी नहीं है। शुद्ध आय वर्षा वितरण, कीट प्रकोप और बाजार भाव पर निर्भर करती है।';
    }
  }
  return note;
}

function localizeBenchmarkSource(source: string, lang: Language): string {
  if (!source || lang === 'en') return source;
  if (source.includes('State Agricultural University') || source.includes('ICAR')) {
    if (lang === 'te') return 'రాష్ట్ర వ్యవసాయ విశ్వవిద్యాలయం / ICAR మార్గదర్శకాలు';
    if (lang === 'hi') return 'राज्य कृषि विश्वविद्यालय / ICAR दिशानिर्देश';
  }
  return source;
}

interface PlanCropWizardProps {
  isOpen: boolean;
  onClose: () => void;
  farms: Farm[];
  location: LocationContext;
  currentLang: Language;
  onCropStarted: () => void;
}

export const PlanCropWizard: React.FC<PlanCropWizardProps> = ({
  isOpen,
  onClose,
  farms,
  location,
  currentLang,
  onCropStarted,
}) => {
  const t = translations[currentLang];

  // Steps: 1: Farm Info, 2: Field Info, 3: Crop Comparison ("What can I grow here?"), 4: Plan Review
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Farm Info State
  const [selectedFarmId, setSelectedFarmId] = useState<string>(farms.length > 0 ? farms[0].id : 'new_farm');
  const [farmName, setFarmName] = useState<string>(farms.length > 0 ? farms[0].farmName : 'My Farm');
  const [totalFarmAcres, setTotalFarmAcres] = useState<number>(farms.length > 0 ? farms[0].totalAcres : 4.0);
  const [farmDistrict, setFarmDistrict] = useState<string>(location.district || 'Warangal');
  const [farmState, setFarmState] = useState<string>(location.state || 'Telangana');
  const [farmVillage, setFarmVillage] = useState<string>(location.village || '');
  const [showLocationMapModal, setShowLocationMapModal] = useState<boolean>(false);

  // Step 2: Field Info State
  const [plannedAcres, setPlannedAcres] = useState<number>(2.0);
  const [soilType, setSoilType] = useState<string>('Red Loamy Soil');
  const [irrigationSource, setIrrigationSource] = useState<string>('Borewell & Drip');
  const [sowingWindow, setSowingWindow] = useState<string>('Kharif (June - July)');

  // Step 3: Crop Comparison State
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [comparisonResult, setComparisonResult] = useState<CropComparisonResponse | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<CropComparisonItem | null>(null);
  const [selectedVariety] = useState<string>('');

  // Voice Assistant / QA on Step 3
  const [voiceQAAnswer, setVoiceQAAnswer] = useState<string>('');
  const [isAnsweringQA, setIsAnsweringQA] = useState<boolean>(false);

  // Step 4: AI Plan State
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);
  const [planResult, setPlanResult] = useState<CropPlanData | null>(null);
  const [isStartingCrop, setIsStartingCrop] = useState<boolean>(false);

  // Global Error & Audio State
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [activeSpeechSection, setActiveSpeechSection] = useState<string>('');

  // Voice Input (Whisper) State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [lastVoiceTranscript, setLastVoiceTranscript] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Update selected farm details on farm selection
  useEffect(() => {
    if (selectedFarmId && selectedFarmId !== 'new_farm') {
      const f = farms.find(farm => farm.id === selectedFarmId);
      if (f) {
        setFarmName(f.farmName);
        setTotalFarmAcres(f.totalAcres);
        setFarmDistrict(f.district);
        setFarmState(f.state);
        setFarmVillage(f.village || '');
        setSoilType(f.soilType || 'Red Loamy Soil');
        setIrrigationSource(f.irrigationSource || 'Borewell & Drip');
        
        // Default planned acres to remaining available acres if possible
        const available = f.availableAcres !== undefined ? f.availableAcres : f.totalAcres;
        if (available > 0) {
          setPlannedAcres(Math.min(2.0, available));
        }
      }
    }
  }, [selectedFarmId, farms]);

  // Clean up speech on unmount or close
  useEffect(() => {
    return () => {
      SpeechService.stop();
    };
  }, []);

  if (!isOpen) return null;

  // Compute remaining acres on current farm
  const currentFarmObj = farms.find(f => f.id === selectedFarmId);
  const allocatedOnFarm = currentFarmObj?.allocatedAcres || 0;
  const availableOnFarm = currentFarmObj ? Math.max(0, currentFarmObj.totalAcres - allocatedOnFarm) : totalFarmAcres;
  const isAcreageExceeded = selectedFarmId !== 'new_farm' && currentFarmObj && plannedAcres > availableOnFarm;

  // ---------------------------------------------------------------------------
  // Voice Recording & Whisper Transcription
  // ---------------------------------------------------------------------------
  const startRecording = async (target: 'step1' | 'step2' | 'step3_qa') => {
    setErrorMessage('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await processVoiceAudio(audioBlob, target);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('[PlanCrop] Mic error:', err);
      setErrorMessage('Microphone access denied or unavailable.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processVoiceAudio = async (blob: Blob, target: 'step1' | 'step2' | 'step3_qa') => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');
      formData.append('language', currentLang);

      const res = await fetchApi<{ text: string }>('/voice/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (res.success && res.data?.text) {
        const transcript = res.data.text.trim();
        setLastVoiceTranscript(transcript);

        if (target === 'step1' || target === 'step2') {
          // Extract structured field info
          const extracted = await FarmService.extractFieldInfo(transcript, currentLang);
          
          if (target === 'step1') {
            if (extracted.acres) setTotalFarmAcres(extracted.acres);
            if (extracted.district) setFarmDistrict(extracted.district);
            if (extracted.location && !extracted.district) setFarmDistrict(extracted.location);
            if (extracted.village) setFarmVillage(extracted.village);
            
            // Read-back confirmation
            const readText = currentLang === 'te'
              ? `మీరు ${extracted.acres || totalFarmAcres} ఎకరాలు ${extracted.district || farmDistrict} లో ఉన్నట్లు చెప్పారు.`
              : currentLang === 'hi'
              ? `आपने ${extracted.acres || totalFarmAcres} एकड़ ${extracted.district || farmDistrict} में बताया है।`
              : `You said you have ${extracted.acres || totalFarmAcres} acres near ${extracted.district || farmDistrict}.`;
            SpeechService.speak(readText, currentLang);
          } else if (target === 'step2') {
            if (extracted.acres) setPlannedAcres(extracted.acres);
            if (extracted.soilType) setSoilType(extracted.soilType);
            if (extracted.irrigationSource) setIrrigationSource(extracted.irrigationSource);
            if (extracted.sowingWindow) setSowingWindow(extracted.sowingWindow);

            // Read-back confirmation
            const readText = currentLang === 'te'
              ? `మీ నేల ${extracted.soilType || soilType} మరియు నీటి వనరు ${extracted.irrigationSource || irrigationSource} అని నిర్ధారించబడింది.`
              : currentLang === 'hi'
              ? `आपकी मिट्टी ${extracted.soilType || soilType} और सिंचाई ${extracted.irrigationSource || irrigationSource} दर्ज की गई है।`
              : `You told me your soil is ${extracted.soilType || soilType} and irrigation is ${extracted.irrigationSource || irrigationSource}.`;
            SpeechService.speak(readText, currentLang);
          }
        } else if (target === 'step3_qa') {
          // Process crop comparison question
          await handleCropVoiceQA(transcript);
        }
      }
    } catch (err: any) {
      console.warn('[PlanCrop] Voice parsing notice:', err.message);
      setErrorMessage('Voice processing temporarily unavailable.');
    } finally {
      setIsTranscribing(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Step Navigation & Logic
  // ---------------------------------------------------------------------------
  const handleProceedToStep2 = () => {
    setErrorMessage('');
    if (totalFarmAcres <= 0) {
      setErrorMessage(
        currentLang === 'te'
          ? 'దయచేసి సరైన పొలం విస్తీర్ణాన్ని నమోదు చేయండి.'
          : currentLang === 'hi'
          ? 'कृपया खेत का सही रकबा दर्ज करें।'
          : 'Please specify valid farm acreage.'
      );
      return;
    }
    setCurrentStep(2);
  };

  const handleProceedToStep3 = async () => {
    setErrorMessage('');
    if (plannedAcres <= 0) {
      setErrorMessage(
        currentLang === 'te'
          ? 'ప్లాన్ చేసిన విస్తీర్ణం సున్నా కంటే ఎక్కువగా ఉండాలి.'
          : currentLang === 'hi'
          ? 'नियोजित रकबा शून्य से अधिक होना चाहिए।'
          : 'Planned acreage must be greater than zero.'
      );
      return;
    }

    if (isAcreageExceeded) {
      setErrorMessage(
        currentLang === 'te'
          ? `${plannedAcres} ఎకరాలు కేటాయించలేము. ${farmName} లో ${availableOnFarm.toFixed(1)} ఎకరాలు మాత్రమే అందుబాటులో ఉన్నాయి.`
          : currentLang === 'hi'
          ? `${plannedAcres} एकड़ आवंटित नहीं किया जा सकता। ${farmName} में केवल ${availableOnFarm.toFixed(1)} एकड़ उपलब्ध है।`
          : `Cannot allocate ${plannedAcres} acres. Only ${availableOnFarm.toFixed(1)} acres unallocated on ${farmName}.`
      );
      return;
    }

    setCurrentStep(3);
    await loadCropComparison();
  };

  const loadCropComparison = async () => {
    setIsComparing(true);
    setErrorMessage('');
    try {
      const res = await FarmService.compareCrops({
        farmId: selectedFarmId !== 'new_farm' ? selectedFarmId : undefined,
        farmName,
        acres: plannedAcres,
        soilType,
        irrigationSource,
        sowingWindow,
        district: farmDistrict,
        state: farmState,
        language: currentLang,
      });

      setComparisonResult(res);

      // Auto-select top-suitable crop if none selected
      if (res.crops && res.crops.length > 0 && !selectedCrop) {
        setSelectedCrop(res.crops[0]);
      }

      // Read summary aloud
      if (res.summary) {
        SpeechService.speak(res.summary, currentLang);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to compare crops.');
    } finally {
      setIsComparing(false);
    }
  };

  const handleCropVoiceQA = async (queryText: string) => {
    if (!comparisonResult || !queryText.trim()) return;
    setIsAnsweringQA(true);
    try {
      const answer = await FarmService.cropVoiceQA({
        question: queryText,
        comparedCrops: comparisonResult.crops,
        fieldInfo: { farmName, acres: plannedAcres, soilType, irrigationSource, district: farmDistrict },
        language: currentLang,
      });
      setVoiceQAAnswer(answer);
      if (answer) {
        SpeechService.speak(answer, currentLang);
      }
    } catch (err: any) {
      console.warn('[PlanCrop] QA error:', err.message);
    } finally {
      setIsAnsweringQA(false);
    }
  };

  const handleSelectCropAndGeneratePlan = async (crop: CropComparisonItem) => {
    setSelectedCrop(crop);
    setCurrentStep(4);
    setIsGeneratingPlan(true);
    setErrorMessage('');
    try {
      const plan = await FarmService.planCropWithAI({
        farmId: selectedFarmId !== 'new_farm' ? selectedFarmId : undefined,
        farmName,
        acres: plannedAcres,
        soilType,
        irrigationSource,
        cropName: crop.cropName,
        variety: selectedVariety || 'Standard Recommended Hybrid',
        sowingWindow,
        district: farmDistrict,
        state: farmState,
        language: currentLang,
      });

      setPlanResult(plan);

      // Read summary aloud
      if (plan.summary) {
        SpeechService.speak(plan.summary, currentLang);
      }
    } catch (err: any) {
      console.warn('[PlanCrop] Plan generation error:', err.message);
      setErrorMessage(
        currentLang === 'te' 
          ? 'ప్రస్తుతం ఉత్పత్తి ప్రణాళికను సిద్ధం చేయలేకపోయాము. దయచేసి మళ్లీ ప్రయత్నించండి.' 
          : (currentLang === 'hi' 
              ? 'हम अभी आपकी उत्पादन योजना तैयार नहीं कर सके। कृपया पुनः प्रयास करें।' 
              : "We couldn't prepare your production plan right now. Please try again.")
      );
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleStartCropAcceptance = async () => {
    if (!selectedCrop || !planResult) return;

    if (isAcreageExceeded) {
      setErrorMessage(
        currentLang === 'te'
          ? `ఈ పొలంలో కేటాయించని విస్తీర్ణం అందుబాటులో లేదు (అందుబాటులో ఉంది: ${availableOnFarm} ఎకరాలు, కోరినది: ${plannedAcres} ఎకరాలు).`
          : currentLang === 'hi'
          ? `इस खेत पर कोई असंबद्ध रकबा उपलब्ध नहीं है (उपलब्ध: ${availableOnFarm} एकड़, अनुरोधित: ${plannedAcres} एकड़)।`
          : `No unallocated acreage available on this farm (Available: ${availableOnFarm} acres, Requested: ${plannedAcres} acres).`
      );
      return;
    }

    setIsStartingCrop(true);
    setErrorMessage('');
    try {
      await FarmService.acceptCropPlan({
        farmId: selectedFarmId !== 'new_farm' ? selectedFarmId : undefined,
        farmName,
        totalFarmAcres: selectedFarmId === 'new_farm' ? totalFarmAcres : undefined,
        acres: plannedAcres,
        soilType,
        irrigationSource,
        district: farmDistrict,
        state: farmState,
        village: farmVillage,
        plotName: `${selectedCrop.cropName} Plot (${plannedAcres} Acres)`,
        currentCrop: selectedCrop.cropName,
        variety: planResult.variety || 'Recommended Hybrid',
        sowingDate: getTodayISTDateString(),
        stage: 'Planned / Sowing Stage',
        initialManagementPlan: planResult.initialCropManagementPlan,
      });

      // Announce success
      const successSpeech = currentLang === 'te'
        ? `${localizeCropName(selectedCrop.cropName, currentLang)} పంట విజయవంతంగా ప్రారంభించబడింది!`
        : currentLang === 'hi'
        ? `${localizeCropName(selectedCrop.cropName, currentLang)} फसल सफलतापूर्वक शुरू हो गई!`
        : `Successfully started ${selectedCrop.cropName} crop on ${plannedAcres} acres!`;
      SpeechService.speak(successSpeech, currentLang);

      onCropStarted();
      onClose();
    } catch (err: any) {
      console.error('[PlanCrop] Start crop error:', err);
      setErrorMessage(
        err.message || 
        (currentLang === 'te'
          ? 'పంటను ప్రారంభించడంలో లోపం ఏర్పడింది. దయచేసి మళ్లీ ప్రయత్నించండి.'
          : currentLang === 'hi'
          ? 'फसल शुरू करने में त्रुटि हुई। कृपया पुनः प्रयास करें।'
          : 'Database error starting crop. Please try again.')
      );
    } finally {
      setIsStartingCrop(false);
    }
  };

  const toggleSpeakSection = (sectionKey: string, text: string) => {
    if (isSpeaking && activeSpeechSection === sectionKey) {
      SpeechService.stop();
      setIsSpeaking(false);
      setActiveSpeechSection('');
    } else {
      SpeechService.speak(text, currentLang, () => {
        setIsSpeaking(false);
        setActiveSpeechSection('');
      });
      setIsSpeaking(true);
      setActiveSpeechSection(sectionKey);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(25, 53, 42, 0.7)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9990,
      padding: '16px',
    }}>
      <div style={{
        backgroundColor: 'var(--ag-color-surface-base)',
        borderRadius: 'var(--ag-radius-card)',
        width: '100%',
        maxWidth: '780px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--ag-shadow-elevated)',
        border: '1px solid var(--ag-border-default)',
        overflow: 'hidden',
      }}>
        {/* Header with Step Progress */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--ag-border-default)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#FAFBF7',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ag-color-primary-base)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {WIZARD_STRINGS.step[currentLang]} {currentStep} {WIZARD_STRINGS.of[currentLang]} 4
              </span>
              <span style={{ color: 'var(--ag-color-text-secondary)', fontSize: '11px' }}>·</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ag-color-text-secondary)' }}>
                {WIZARD_STRINGS.steps[currentStep as 1 | 2 | 3 | 4]?.[currentLang] || WIZARD_STRINGS.steps[1][currentLang]}
              </span>
            </div>
            <h3 style={{ margin: '2px 0 0 0', fontSize: '18px', fontWeight: 800, color: 'var(--ag-color-text-primary)' }}>
              {currentStep === 1 && t.tellAgriGuideAboutFarm}
              {currentStep === 2 && WIZARD_STRINGS.titles[2][currentLang]}
              {currentStep === 3 && t.whatCanIGrowHere}
              {currentStep === 4 && (selectedCrop?.cropName ? `${localizeCropName(selectedCrop.cropName, currentLang)} ${WIZARD_STRINGS.step4.productionPlan[currentLang]}` : WIZARD_STRINGS.step4.productionPlan[currentLang])}
            </h3>
          </div>

          <button
            onClick={() => {
              SpeechService.stop();
              onClose();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ag-color-text-secondary)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {errorMessage && (
            <div style={{
              backgroundColor: '#FDF0F0',
              border: '1px solid #F7B5B3',
              borderRadius: '12px',
              padding: '12px 16px',
              color: 'var(--ag-color-danger-base)',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}>
              <AlertTriangle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 1: FARM INFORMATION (VOICE-FIRST)                            */}
          {/* ================================================================= */}
          {currentStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Voice Input Banner */}
              <div style={{
                backgroundColor: 'var(--ag-color-harvest-light)',
                border: '1px solid #FAD48C',
                borderRadius: '16px',
                padding: '18px',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ag-color-text-primary)', margin: '0 0 12px 0' }}>
                  🎙 {t.tellAgriGuideHelper}
                </p>
                
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : () => startRecording('step1')}
                  disabled={isTranscribing}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: isRecording ? '#DC2626' : 'var(--ag-color-warning-base)',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: 'var(--ag-radius-full)',
                    fontSize: '15px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    minHeight: '48px',
                    boxShadow: 'var(--ag-shadow-button)',
                  }}
                >
                  {isRecording ? <Square size={16} fill="#FFFFFF" /> : <Mic size={18} />}
                  <span>
                    {isTranscribing 
                      ? t.voiceProcessing 
                      : isRecording 
                      ? t.voiceListening 
                      : `🎙 ${t.tellAgriGuideAboutFarm}`}
                  </span>
                </button>

                {lastVoiceTranscript && (
                  <div style={{ marginTop: '14px', textAlign: 'left', backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '10px', border: '1px solid #FAD48C' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--ag-color-text-secondary)', textTransform: 'uppercase' }}>
                      YOU SAID:
                    </span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--ag-color-text-primary)', fontWeight: 600 }}>
                      "{lastVoiceTranscript}"
                    </p>
                  </div>
                )}
              </div>

              {/* Existing Farm Selector (if farmer has multiple farms) */}
              {farms.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ag-color-text-primary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    {WIZARD_STRINGS.step1.selectExistingOrNew[currentLang]}
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {farms.map((f) => {
                      const isSel = f.id === selectedFarmId;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setSelectedFarmId(f.id)}
                          style={{
                            padding: '10px 16px',
                            borderRadius: '12px',
                            border: isSel ? '2px solid var(--ag-color-primary-base)' : '1px solid var(--ag-border-default)',
                            backgroundColor: isSel ? 'var(--ag-color-primary-light)' : 'var(--ag-color-surface-base)',
                            color: isSel ? 'var(--ag-color-primary-dark)' : 'var(--ag-color-text-primary)',
                            fontWeight: isSel ? 800 : 600,
                            fontSize: '13px',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <div style={{ fontWeight: 800 }}>{f.farmName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--ag-color-text-secondary)', marginTop: '2px' }}>
                            {f.totalAcres} {WIZARD_STRINGS.step1.acres[currentLang]} ({f.availableAcres !== undefined ? f.availableAcres.toFixed(1) : f.totalAcres} {WIZARD_STRINGS.step1.acresAvailable[currentLang]})
                          </div>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFarmId('new_farm');
                        setFarmName('New Farm');
                      }}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '12px',
                        border: selectedFarmId === 'new_farm' ? '2px solid var(--ag-color-primary-base)' : '1px dashed var(--ag-border-default)',
                        backgroundColor: selectedFarmId === 'new_farm' ? 'var(--ag-color-primary-light)' : '#FFFFFF',
                        color: selectedFarmId === 'new_farm' ? 'var(--ag-color-primary-dark)' : 'var(--ag-color-text-primary)',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      {WIZARD_STRINGS.step1.describeNewFarm[currentLang]}
                    </button>
                  </div>
                </div>
              )}

              {/* Editable Structured Fields */}
              <div style={{
                backgroundColor: '#FAFAF7',
                border: '1px solid var(--ag-border-default)',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ag-color-text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      {WIZARD_STRINGS.step1.farmName[currentLang]}
                    </label>
                    <input
                      type="text"
                      value={farmName}
                      onChange={(e) => setFarmName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--ag-border-default)',
                        fontSize: '14px',
                        fontWeight: 700,
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ag-color-text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      {WIZARD_STRINGS.step1.totalFarmAcres[currentLang]}
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={totalFarmAcres}
                      onChange={(e) => setTotalFarmAcres(parseFloat(e.target.value) || 0)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--ag-border-default)',
                        fontSize: '14px',
                        fontWeight: 700,
                      }}
                    />
                  </div>
                </div>

                {/* Location Map Pinning Quick Action */}
                <div style={{
                  padding: '10px 14px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid var(--ag-border-default)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={16} color="var(--ag-color-primary-base)" />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ag-color-text-primary)' }}>
                      {WIZARD_STRINGS.step1.location[currentLang]}: {localizeLocation(farmDistrict, farmState, currentLang, farmVillage)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowLocationMapModal(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: 'var(--ag-color-primary-light)',
                      color: 'var(--ag-color-primary-dark)',
                      border: '1px solid #A3D9A5',
                      padding: '6px 12px',
                      borderRadius: 'var(--ag-radius-full)',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    <MapPin size={13} />
                    <span>{WIZARD_STRINGS.step1.pinOnMap[currentLang]}</span>
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ag-color-text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      {WIZARD_STRINGS.step1.district[currentLang]}
                    </label>
                    <input
                      type="text"
                      value={farmDistrict}
                      onChange={(e) => setFarmDistrict(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--ag-border-default)',
                        fontSize: '14px',
                        fontWeight: 700,
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ag-color-text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      {WIZARD_STRINGS.step1.villageMandal[currentLang]}
                    </label>
                    <input
                      type="text"
                      value={farmVillage}
                      onChange={(e) => setFarmVillage(e.target.value)}
                      placeholder={WIZARD_STRINGS.step1.villagePlaceholder[currentLang]}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--ag-border-default)',
                        fontSize: '14px',
                        fontWeight: 700,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 2: FIELD & IRRIGATION PARAMETERS (VOICE-FIRST)               */}
          {/* ================================================================= */}
          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Voice Field Input Banner */}
              <div style={{
                backgroundColor: 'var(--ag-color-primary-light)',
                border: '1px solid #A3D9A5',
                borderRadius: '16px',
                padding: '16px',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ag-color-primary-dark)', margin: '0 0 10px 0' }}>
                  {WIZARD_STRINGS.step2.voicePrompt[currentLang]}
                </p>
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : () => startRecording('step2')}
                  disabled={isTranscribing}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: isRecording ? '#DC2626' : 'var(--ag-color-primary-base)',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: 'var(--ag-radius-full)',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    minHeight: '44px',
                  }}
                >
                  {isRecording ? <Square size={16} fill="#FFFFFF" /> : <Mic size={16} />}
                  <span>{isRecording ? WIZARD_STRINGS.step2.listening[currentLang] : WIZARD_STRINGS.step2.speakFieldDetails[currentLang]}</span>
                </button>

                {lastVoiceTranscript && (
                  <div style={{ marginTop: '12px', textAlign: 'left', backgroundColor: '#FFFFFF', padding: '10px', borderRadius: '8px', border: '1px solid #A3D9A5' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--ag-color-primary-dark)', textTransform: 'uppercase' }}>
                      {WIZARD_STRINGS.step2.youSaid[currentLang]}
                    </span>
                    <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--ag-color-text-primary)', fontWeight: 600 }}>
                      "{lastVoiceTranscript}"
                    </p>
                  </div>
                )}
              </div>

              {/* Structured Field Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ag-color-text-primary)', marginBottom: '6px' }}>
                    {WIZARD_STRINGS.step2.acresPlanned[currentLang]}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max={totalFarmAcres}
                    value={plannedAcres}
                    onChange={(e) => setPlannedAcres(parseFloat(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: isAcreageExceeded ? '2px solid var(--ag-color-danger-base)' : '1px solid var(--ag-border-default)',
                      fontSize: '15px',
                      fontWeight: 700,
                    }}
                  />
                  {selectedFarmId !== 'new_farm' && currentFarmObj && (
                    <div style={{ fontSize: '11px', color: isAcreageExceeded ? 'var(--ag-color-danger-base)' : 'var(--ag-color-text-secondary)', marginTop: '4px', fontWeight: 600 }}>
                      {currentLang === 'te' 
                        ? `${farmName} లో ${availableOnFarm.toFixed(1)} ఎకరాలు కేటాయించలేదు` 
                        : currentLang === 'hi' 
                        ? `${farmName} में ${availableOnFarm.toFixed(1)} एकड़ असंबद्ध हैं` 
                        : `${availableOnFarm.toFixed(1)} acres unallocated on ${farmName}`}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ag-color-text-primary)', marginBottom: '6px' }}>
                    {WIZARD_STRINGS.step2.soilType[currentLang]}
                  </label>
                  <select
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--ag-border-default)',
                      fontSize: '14px',
                      fontWeight: 700,
                    }}
                  >
                    <option value="Red Loamy Soil">
                      {currentLang === 'te' ? 'ఎర్ర నేల (చల్కా నేల)' : currentLang === 'hi' ? 'लाल दोमट मिट्टी (Red Loam)' : 'Red Loamy Soil (చల్కా / ఎర్ర నేల)'}
                    </option>
                    <option value="Black Cotton Soil">
                      {currentLang === 'te' ? 'నల్ల రేగడి నేల' : currentLang === 'hi' ? 'काली मिट्टी (Black Cotton)' : 'Black Cotton Soil (నల్ల రేగడి)'}
                    </option>
                    <option value="Sandy Loam">
                      {currentLang === 'te' ? 'ఇసుక నేల' : currentLang === 'hi' ? 'बलुई दोमट मिट्टी (Sandy Loam)' : 'Sandy Loam (ఇసుక నేల)'}
                    </option>
                    <option value="Clayey Loam">
                      {currentLang === 'te' ? 'జిగురు / బంక మట్టి నేల' : currentLang === 'hi' ? 'चिकनी दोमट मिट्टी (Clayey Loam)' : 'Clayey / Heavy Loam (జిగురు నేల)'}
                    </option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ag-color-text-primary)', marginBottom: '6px' }}>
                    {WIZARD_STRINGS.step2.irrigationSource[currentLang]}
                  </label>
                  <select
                    value={irrigationSource}
                    onChange={(e) => setIrrigationSource(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--ag-border-default)',
                      fontSize: '14px',
                      fontWeight: 700,
                    }}
                  >
                    <option value="Borewell & Drip">
                      {currentLang === 'te' ? 'బోరుబావి & బిందు సేద్యం (డ్రిప్)' : currentLang === 'hi' ? 'बोरवेल और ड्रिप सिंचाई' : 'Borewell & Drip (డ్రిప్ ఇరిగేషన్)'}
                    </option>
                    <option value="Borewell Flood">
                      {currentLang === 'te' ? 'బోరుబావి (కాలువ / పారక)' : currentLang === 'hi' ? 'बोरवेल (खुली सिंचाई)' : 'Borewell (కాలువ / వరద)'}
                    </option>
                    <option value="Canal Irrigation">
                      {currentLang === 'te' ? 'సాగునీటి కాలువ' : currentLang === 'hi' ? 'नहर सिंचाई (Canal)' : 'Canal Irrigation (సాగునీటి కాలువ)'}
                    </option>
                    <option value="Rainfed (Monsoon)">
                      {currentLang === 'te' ? 'వర్షాధారం (వానకాలం)' : currentLang === 'hi' ? 'वर्षा आधारित (मानसून)' : 'Rainfed (వర్షాధార)'}
                    </option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ag-color-text-primary)', marginBottom: '6px' }}>
                    {WIZARD_STRINGS.step2.plantingSeason[currentLang]}
                  </label>
                  <select
                    value={sowingWindow}
                    onChange={(e) => setSowingWindow(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--ag-border-default)',
                      fontSize: '14px',
                      fontWeight: 700,
                    }}
                  >
                    <option value="Kharif (June - July)">
                      {currentLang === 'te' ? 'ఖరీఫ్ (జూన్ - జూలై ప్రారంభం)' : currentLang === 'hi' ? 'खरीफ (जून - जुलाई)' : 'Kharif (June - July Onset)'}
                    </option>
                    <option value="Rabi (Oct - Nov)">
                      {currentLang === 'te' ? 'రబీ (అక్టోబర్ - నవంబర్)' : currentLang === 'hi' ? 'रबी (अक्टूबर - नवंबर)' : 'Rabi (October - November)'}
                    </option>
                    <option value="Summer (Jan - Feb)">
                      {currentLang === 'te' ? 'వేసవి / జాయెద్ (జనవరి - ఫిబ్రవరి)' : currentLang === 'hi' ? 'जायद / ग्रीष्म (जनवरी - फरवरी)' : 'Summer / Zaid (Jan - Feb)'}
                    </option>
                  </select>
                </div>
              </div>

              {/* Confirmation Readback pill */}
              <div style={{
                backgroundColor: '#FAFBF7',
                border: '1px solid var(--ag-border-default)',
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div style={{ fontSize: '13px', color: 'var(--ag-color-text-primary)', fontWeight: 600 }}>
                  🌾 <strong>{plannedAcres} {WIZARD_STRINGS.step1.acres[currentLang]}</strong> · {localizeSoil(soilType, currentLang)} · {localizeIrrigation(irrigationSource, currentLang)} · {sowingWindow}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    let text = '';
                    if (currentLang === 'te') {
                      text = `మీ చేను ${plannedAcres} ఎకరాలు, ${localizeSoil(soilType, 'te')}, ${localizeIrrigation(irrigationSource, 'te')}, మరియు ${sowingWindow} అని చెప్పారు.`;
                    } else if (currentLang === 'hi') {
                      text = `आपने बताया कि आपका खेत ${plannedAcres} एकड़, ${localizeSoil(soilType, 'hi')}, ${localizeIrrigation(irrigationSource, 'hi')}, और ${sowingWindow} के लिए है।`;
                    } else {
                      text = `You told me your field is ${plannedAcres} acres on ${soilType} with ${irrigationSource} for ${sowingWindow}.`;
                    }
                    SpeechService.speak(text, currentLang);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--ag-color-primary-base)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  <Volume2 size={15} />
                  <span>{WIZARD_STRINGS.step2.listen[currentLang]}</span>
                </button>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 3: "WHAT CAN I GROW HERE?" DATA-DRIVEN CROP COMPARISON       */}
          {/* ================================================================= */}
          {currentStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {isComparing && (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <Sparkles size={32} color="var(--ag-color-primary-base)" style={{ animation: 'spin 2s linear infinite', margin: '0 auto 12px auto' }} />
                  <h4 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--ag-color-text-primary)' }}>
                    {WIZARD_STRINGS.step3.analyzingTitle[currentLang]}
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)', margin: 0 }}>
                    {WIZARD_STRINGS.step3.analyzingSubtitle[currentLang]}
                  </p>
                </div>
              )}

              {!isComparing && comparisonResult && (
                <div>
                  {/* Executive Summary & Audio */}
                  <div style={{
                    backgroundColor: 'var(--ag-color-primary-light)',
                    border: '1px solid #A3D9A5',
                    borderRadius: '16px',
                    padding: '16px',
                    marginBottom: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ag-color-primary-dark)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {WIZARD_STRINGS.step3.agronomicAssessment[currentLang]}
                      </span>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 700, color: 'var(--ag-color-text-primary)', lineHeight: 1.4 }}>
                        {localizeComparisonSummary(comparisonResult.summary, currentLang)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSpeakSection('comparison_summary', localizeComparisonSummary(comparisonResult.summary, currentLang))}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #A3D9A5',
                        borderRadius: 'var(--ag-radius-full)',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--ag-color-primary-dark)',
                        fontSize: '12px',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Volume2 size={15} />
                      <span>{activeSpeechSection === 'comparison_summary' ? WIZARD_STRINGS.step3.stop[currentLang] : WIZARD_STRINGS.step3.listen[currentLang]}</span>
                    </button>
                  </div>

                  {/* Voice QA Assistant on Crop Comparison */}
                  <div style={{
                    backgroundColor: '#FAFBF7',
                    border: '1px solid var(--ag-border-default)',
                    borderRadius: '14px',
                    padding: '14px',
                    marginBottom: '18px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ag-color-text-primary)' }}>
                        {WIZARD_STRINGS.step3.askAgriGuideTitle[currentLang]}
                      </span>
                      <button
                        type="button"
                        onClick={isRecording ? stopRecording : () => startRecording('step3_qa')}
                        disabled={isAnsweringQA || isTranscribing}
                        style={{
                          backgroundColor: isRecording ? '#DC2626' : 'var(--ag-color-harvest-light)',
                          color: isRecording ? '#FFFFFF' : 'var(--ag-color-warning-base)',
                          border: '1px solid #FAD48C',
                          borderRadius: 'var(--ag-radius-full)',
                          padding: '6px 14px',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {isRecording ? <Square size={13} fill="currentColor" /> : <Mic size={14} />}
                        <span>{isRecording ? WIZARD_STRINGS.step3.stop[currentLang] : WIZARD_STRINGS.step3.askQuestion[currentLang]}</span>
                      </button>
                    </div>

                    <p style={{ fontSize: '11px', color: 'var(--ag-color-text-secondary)', margin: '0 0 8px 0' }}>
                      {WIZARD_STRINGS.step3.tryQuestions[currentLang]}
                    </p>

                    {voiceQAAnswer && (
                      <div style={{ backgroundColor: '#FFFFFF', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--ag-border-default)' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--ag-color-primary-base)', textTransform: 'uppercase' }}>
                          {WIZARD_STRINGS.step3.agriGuideAnswer[currentLang]}
                        </span>
                        <p style={{ margin: '2px 0 0 0', fontSize: '13px', fontWeight: 600, color: 'var(--ag-color-text-primary)' }}>
                          {voiceQAAnswer}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Crop Comparison Cards Grid */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {comparisonResult.crops.map((crop, idx) => {
                      const isSelected = selectedCrop?.cropName === crop.cropName;
                      return (
                        <div
                          key={crop.cropName || idx}
                          style={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: '16px',
                            border: isSelected ? '2px solid var(--ag-color-primary-base)' : '1px solid var(--ag-border-default)',
                            padding: '16px',
                            boxShadow: isSelected ? '0 4px 12px rgba(47, 125, 50, 0.12)' : 'var(--ag-shadow-card)',
                            position: 'relative',
                          }}
                        >
                          {/* Card Top */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h4 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--ag-color-text-primary)' }}>
                                  {localizeCropName(crop.cropName, currentLang)} {crop.localName ? `(${crop.localName})` : ''}
                                </h4>
                                <span style={{
                                  backgroundColor: crop.suitabilityScore === 'High' ? 'var(--ag-color-primary-light)' : 'var(--ag-color-harvest-light)',
                                  color: crop.suitabilityScore === 'High' ? 'var(--ag-color-primary-dark)' : 'var(--ag-color-warning-base)',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: 'var(--ag-radius-full)',
                                }}>
                                  {localizeSuitabilityScore(crop.suitabilityScore, currentLang)}
                                </span>
                              </div>
                              <p style={{ fontSize: '12px', color: 'var(--ag-color-text-secondary)', margin: '4px 0 0 0' }}>
                                {crop.scientificName} · {crop.durationDays} {WIZARD_STRINGS.step3.daysDuration[currentLang]} · {WIZARD_STRINGS.step3.water[currentLang]}: {localizeWaterReq(crop.waterRequirement, currentLang)}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSelectCropAndGeneratePlan(crop)}
                              style={{
                                backgroundColor: isSelected ? 'var(--ag-color-primary-base)' : '#FAFBF7',
                                color: isSelected ? '#FFFFFF' : 'var(--ag-color-text-primary)',
                                border: isSelected ? 'none' : '1px solid var(--ag-border-default)',
                                padding: '8px 16px',
                                borderRadius: 'var(--ag-radius-full)',
                                fontSize: '13px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <Check size={14} />
                              <span>{isSelected ? WIZARD_STRINGS.step3.selected[currentLang] : WIZARD_STRINGS.step3.chooseThisCrop[currentLang]}</span>
                            </button>
                          </div>

                          {/* Suitability reason */}
                          <p style={{ fontSize: '13px', color: 'var(--ag-color-text-primary)', margin: '10px 0', fontWeight: 600 }}>
                            {localizeSuitabilityReason(crop.suitabilityReason, crop.cropName, soilType, irrigationSource, currentLang)}
                          </p>

                          {/* Data-Driven Economic Metrics Grid */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                            gap: '8px',
                            backgroundColor: '#FAFAF7',
                            padding: '10px 12px',
                            borderRadius: '10px',
                            fontSize: '12px',
                          }}>
                            <div>
                              <span style={{ color: 'var(--ag-color-text-secondary)', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>
                                {WIZARD_STRINGS.step3.estInvestment[currentLang]}
                              </span>
                              <strong style={{ color: 'var(--ag-color-text-primary)' }}>
                                ₹{crop.estimatedInvestmentPerAcre.min.toLocaleString('en-IN')} - ₹{crop.estimatedInvestmentPerAcre.max.toLocaleString('en-IN')}{WIZARD_STRINGS.step3.perAcre[currentLang]}
                              </strong>
                            </div>

                            <div>
                              <span style={{ color: 'var(--ag-color-text-secondary)', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>
                                {WIZARD_STRINGS.step3.expectedYield[currentLang]}
                              </span>
                              <strong style={{ color: 'var(--ag-color-text-primary)' }}>
                                {crop.expectedYieldPerAcre.minQ} - {crop.expectedYieldPerAcre.maxQ} {WIZARD_STRINGS.step3.qPerAcreEst[currentLang]}
                              </strong>
                            </div>

                            <div>
                              <span style={{ color: 'var(--ag-color-text-secondary)', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>
                                {WIZARD_STRINGS.step3.mandiPriceBaseline[currentLang]}
                              </span>
                              <strong style={{ color: crop.mandiPrice.includes('unavailable') ? 'var(--ag-color-text-secondary)' : 'var(--ag-color-primary-base)' }}>
                                {crop.mandiPrice}
                              </strong>
                            </div>

                            <div>
                              <span style={{ color: 'var(--ag-color-text-secondary)', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>
                                {WIZARD_STRINGS.step3.estMarginRange[currentLang]}
                              </span>
                              <strong style={{ color: 'var(--ag-color-primary-dark)' }}>
                                ₹{crop.estimatedMarginPerAcre.min.toLocaleString('en-IN')} - ₹{crop.estimatedMarginPerAcre.max.toLocaleString('en-IN')}{WIZARD_STRINGS.step3.perAcre[currentLang]}*
                              </strong>
                            </div>
                          </div>

                          {/* Provenance Footer */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '11px', color: 'var(--ag-color-text-secondary)' }}>
                            <span>🏛 {WIZARD_STRINGS.step3.source[currentLang]}: {crop.dataSource}</span>
                            <span style={{ fontStyle: 'italic' }}>{WIZARD_STRINGS.step3.disclaimer[currentLang]}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 4: PRODUCTION PLAN REVIEW & START CROP                       */}
          {/* ================================================================= */}
          {currentStep === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {isGeneratingPlan && (
                <div style={{ textAlign: 'center', padding: '50px 20px' }}>
                  <Sparkles size={36} color="var(--ag-color-primary-base)" style={{ animation: 'spin 2s linear infinite', margin: '0 auto 16px auto' }} />
                  <h4 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--ag-color-text-primary)' }}>
                    {currentLang === 'te' 
                      ? 'మీ ఉత్పత్తి ప్రణాళికను సిద్ధం చేస్తున్నాము...' 
                      : (currentLang === 'hi' ? 'आपकी उत्पादन योजना तैयार की जा रही है...' : 'Preparing your production plan...')}
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)', margin: 0, maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
                    {currentLang === 'te'
                      ? `మీ ${selectedCrop?.cropName ? localizeCropName(selectedCrop.cropName, currentLang) : 'పంట'}, ${plannedAcres} ఎకరాల పొలం, వాతావరణం మరియు ధృవీకరించిన వ్యవసాయ మార్గదర్శకాల ఆధారంగా రూపొందిస్తున్నాము.`
                      : (currentLang === 'hi'
                          ? `आपकी ${selectedCrop?.cropName ? localizeCropName(selectedCrop.cropName, currentLang) : 'फसल'}, ${plannedAcres} एकड़ खेत, मौसम और प्रमाणित कृषि मार्गदर्शन का उपयोग करके तैयार कर रहे हैं।`
                          : `Using your ${selectedCrop?.cropName || 'crop'}, ${plannedAcres} acres in ${farmDistrict}, live weather, and verified agricultural guidance.`)}
                  </p>
                </div>
              )}

              {!isGeneratingPlan && errorMessage && !planResult && (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <AlertCircle size={36} color="#DC2626" style={{ margin: '0 auto 14px auto' }} />
                  <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ag-color-text-primary)', margin: '0 0 8px 0' }}>
                    {currentLang === 'te' ? 'ఉత్పత్తి ప్రణాళికను సిద్ధం చేయలేకపోయాము' : (currentLang === 'hi' ? 'उत्पादन योजना तैयार नहीं हो सकी' : "We couldn't prepare your production plan right now.")}
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)', margin: '0 0 16px 0' }}>
                    {currentLang === 'te' ? 'దయచేసి కాసేపటి తర్వాత మళ్లీ ప్రయత్నించండి.' : (currentLang === 'hi' ? 'कृपया कुछ समय बाद पुनः प्रयास करें।' : 'Please try again.')}
                  </p>
                  {selectedCrop && (
                    <button
                      type="button"
                      onClick={() => handleSelectCropAndGeneratePlan(selectedCrop)}
                      style={{
                        backgroundColor: 'var(--ag-color-primary-base)',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: 'var(--ag-radius-full)',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      {currentLang === 'te' ? 'మళ్లీ ప్రయత్నించండి' : (currentLang === 'hi' ? 'पुनः प्रयास करें' : 'Try Again')}
                    </button>
                  )}
                </div>
              )}

              {!isGeneratingPlan && planResult && (
                <div>
                  {/* Summary & Audio Banner */}
                  <div style={{
                    backgroundColor: 'var(--ag-color-primary-light)',
                    border: '1px solid #A3D9A5',
                    borderRadius: '16px',
                    padding: '16px',
                    marginBottom: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ag-color-primary-dark)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {WIZARD_STRINGS.step4.cropStrategySummary[currentLang]}
                      </span>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 700, color: 'var(--ag-color-text-primary)', lineHeight: 1.4 }}>
                        {localizePlanSummary(planResult.summary, selectedCrop?.cropName || '', plannedAcres, farmName, currentLang)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSpeakSection('plan_summary', localizePlanSummary(planResult.summary, selectedCrop?.cropName || '', plannedAcres, farmName, currentLang))}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #A3D9A5',
                        borderRadius: 'var(--ag-radius-full)',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--ag-color-primary-dark)',
                        fontSize: '12px',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Volume2 size={15} />
                      <span>{activeSpeechSection === 'plan_summary' ? WIZARD_STRINGS.step3.stop[currentLang] : WIZARD_STRINGS.step3.listen[currentLang]}</span>
                    </button>
                  </div>

                  {/* Economic Overview Cards */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '12px',
                    marginBottom: '18px',
                  }}>
                    <div style={{ backgroundColor: '#FAFBF7', border: '1px solid var(--ag-border-default)', borderRadius: '12px', padding: '14px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ag-color-text-secondary)', textTransform: 'uppercase' }}>
                        {WIZARD_STRINGS.step4.estTotalInvestment[currentLang]}
                      </span>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--ag-color-text-primary)', margin: '4px 0 2px 0' }}>
                        ₹{planResult.estimatedInvestment.totalMin.toLocaleString('en-IN')} - ₹{planResult.estimatedInvestment.totalMax.toLocaleString('en-IN')}
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--ag-color-text-secondary)' }}>
                        ₹{planResult.estimatedInvestment.minPerAcre.toLocaleString('en-IN')} - ₹{planResult.estimatedInvestment.maxPerAcre.toLocaleString('en-IN')}{WIZARD_STRINGS.step3.perAcre[currentLang]}
                      </span>
                    </div>

                    <div style={{ backgroundColor: '#FAFBF7', border: '1px solid var(--ag-border-default)', borderRadius: '12px', padding: '14px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ag-color-text-secondary)', textTransform: 'uppercase' }}>
                        {WIZARD_STRINGS.step4.expectedTotalYield[currentLang]}
                      </span>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--ag-color-text-primary)', margin: '4px 0 2px 0' }}>
                        {planResult.expectedYield.expectedTotalQuintalsMin} - {planResult.expectedYield.expectedTotalQuintalsMax} {WIZARD_STRINGS.step4.quintals[currentLang]}
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--ag-color-text-secondary)' }}>
                        {planResult.expectedYield.minQuintalsPerAcre} - {planResult.expectedYield.maxQuintalsPerAcre} {WIZARD_STRINGS.step3.qPerAcreEst[currentLang]}
                      </span>
                    </div>

                    <div style={{ backgroundColor: '#FAFBF7', border: '1px solid var(--ag-border-default)', borderRadius: '12px', padding: '14px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ag-color-text-secondary)', textTransform: 'uppercase' }}>
                        {WIZARD_STRINGS.step4.estNetMarginRange[currentLang]}
                      </span>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--ag-color-primary-base)', margin: '4px 0 2px 0' }}>
                        ₹{planResult.estimatedRevenueAndMargin.estimatedNetMarginMin.toLocaleString('en-IN')} - ₹{planResult.estimatedRevenueAndMargin.estimatedNetMarginMax.toLocaleString('en-IN')}
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--ag-color-text-secondary)' }}>
                        {WIZARD_STRINGS.step4.notGuaranteedBenchmark[currentLang]}
                      </span>
                    </div>
                  </div>

                  {/* Initial 4-Step Crop Management Schedule */}
                  <div style={{ marginBottom: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--ag-color-text-primary)' }}>
                        {WIZARD_STRINGS.step4.initialManagementActions[currentLang]}
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          const stepsText = planResult.initialCropManagementPlan.map(s => {
                            const loc = localizeMilestoneStep(s, currentLang);
                            return `${loc.timing}: ${loc.title}. ${loc.actionDetails}`;
                          }).join('. ');
                          toggleSpeakSection('schedule', stepsText);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--ag-color-primary-base)',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Volume2 size={14} />
                        <span>{WIZARD_STRINGS.step4.listenToSchedule[currentLang]}</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {planResult.initialCropManagementPlan.map((rawStep, sIdx) => {
                        const step = localizeMilestoneStep(rawStep, currentLang);
                        return (
                          <div
                            key={sIdx}
                            style={{
                              backgroundColor: '#FFFFFF',
                              border: '1px solid var(--ag-border-default)',
                              borderRadius: '12px',
                              padding: '12px 14px',
                              display: 'flex',
                              gap: '12px',
                              alignItems: 'flex-start',
                            }}
                          >
                            <div style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--ag-color-primary-light)',
                              color: 'var(--ag-color-primary-dark)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 800,
                              flexShrink: 0,
                            }}>
                              {rawStep.stepNumber || sIdx + 1}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <strong style={{ fontSize: '13px', color: 'var(--ag-color-text-primary)' }}>
                                  {step.title}
                                </strong>
                                <span style={{ fontSize: '11px', color: 'var(--ag-color-text-secondary)', backgroundColor: '#F3F4F6', padding: '1px 6px', borderRadius: '4px' }}>
                                  {step.timing}
                                </span>
                              </div>
                              <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: 'var(--ag-color-text-secondary)', lineHeight: 1.4 }}>
                                {step.actionDetails}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Guidance Basis & Agronomic Notes */}
                  <div style={{ backgroundColor: '#FAFBF7', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--ag-border-default)', fontSize: '11px', color: 'var(--ag-color-text-secondary)', lineHeight: 1.5 }}>
                    <p style={{ margin: '0 0 4px 0', color: 'var(--ag-color-text-primary)' }}>
                      <strong>{WIZARD_STRINGS.step4.guidanceBasis[currentLang]}</strong> {planResult.estimatedRevenueAndMargin.mandiPriceSource ? `${WIZARD_STRINGS.step4.mandi[currentLang]} ${planResult.estimatedRevenueAndMargin.mandiPriceSource} · ` : ''}{WIZARD_STRINGS.step4.yieldBenchmark[currentLang]} {localizeBenchmarkSource(planResult.expectedYield.benchmarkSource || '', currentLang)}
                    </p>
                    <p style={{ margin: 0, fontStyle: 'italic' }}>
                      {localizeMarginNote(planResult.estimatedRevenueAndMargin.marginNote, currentLang)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Footer Actions */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--ag-border-default)',
          backgroundColor: '#FAFBF7',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
        }}>
          {currentStep > 1 && (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev - 1)}
              disabled={isGeneratingPlan || isStartingCrop}
              style={{
                backgroundColor: '#FFFFFF',
                color: 'var(--ag-color-text-primary)',
                border: '1px solid var(--ag-border-default)',
                padding: '10px 18px',
                borderRadius: 'var(--ag-radius-full)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                minHeight: '44px',
              }}
            >
              <ArrowLeft size={16} />
              <span>{WIZARD_STRINGS.step2.back[currentLang]}</span>
            </button>
          )}

          {currentStep === 1 && <div />}

          <div>
            {currentStep === 1 && (
              <button
                type="button"
                onClick={handleProceedToStep2}
                style={{
                  backgroundColor: 'var(--ag-color-primary-base)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: 'var(--ag-radius-full)',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  minHeight: '44px',
                  boxShadow: 'var(--ag-shadow-button)',
                }}
              >
                <span>{WIZARD_STRINGS.step1.continueToField[currentLang]}</span>
                <ArrowRight size={16} />
              </button>
            )}

            {currentStep === 2 && (
              <button
                type="button"
                onClick={handleProceedToStep3}
                style={{
                  backgroundColor: 'var(--ag-color-primary-base)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: 'var(--ag-radius-full)',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  minHeight: '44px',
                  boxShadow: 'var(--ag-shadow-button)',
                }}
              >
                <Sparkles size={16} />
                <span>{WIZARD_STRINGS.step2.whatCanIGrow[currentLang]}</span>
              </button>
            )}

            {currentStep === 3 && selectedCrop && (
              <button
                type="button"
                onClick={() => handleSelectCropAndGeneratePlan(selectedCrop)}
                disabled={isComparing}
                style={{
                  backgroundColor: 'var(--ag-color-primary-base)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: 'var(--ag-radius-full)',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  minHeight: '44px',
                  boxShadow: 'var(--ag-shadow-button)',
                }}
              >
                <span>{WIZARD_STRINGS.step3.generateCropPlan[currentLang](localizeCropName(selectedCrop.cropName, currentLang))}</span>
                <ArrowRight size={16} />
              </button>
            )}

            {currentStep === 4 && planResult && (
              <button
                type="button"
                onClick={handleStartCropAcceptance}
                disabled={isStartingCrop || isAcreageExceeded}
                style={{
                  backgroundColor: isAcreageExceeded ? '#9CA3AF' : 'var(--ag-color-primary-base)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '12px 28px',
                  borderRadius: 'var(--ag-radius-full)',
                  fontSize: '15px',
                  fontWeight: 900,
                  cursor: isAcreageExceeded ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  minHeight: '48px',
                  boxShadow: isAcreageExceeded ? 'none' : 'var(--ag-shadow-button)',
                }}
              >
                <Sprout size={18} />
                <span>{isStartingCrop ? WIZARD_STRINGS.step4.startingCrop[currentLang] : WIZARD_STRINGS.step4.startThisCrop[currentLang]}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive OpenStreetMap + Leaflet Map Location Picker */}
      <LocationPickerModal
        isOpen={showLocationMapModal}
        onClose={() => setShowLocationMapModal(false)}
        currentLocation={{
          district: farmDistrict,
          state: farmState,
          village: farmVillage,
          latitude: location.latitude || 17.9689,
          longitude: location.longitude || 79.5941,
          source: 'manual',
        }}
        onLocationSelected={(newLoc) => {
          setFarmDistrict(newLoc.district);
          setFarmState(newLoc.state);
          setFarmVillage(newLoc.village || newLoc.mandal || '');
        }}
        currentLang={currentLang}
      />
    </div>
  );
};
