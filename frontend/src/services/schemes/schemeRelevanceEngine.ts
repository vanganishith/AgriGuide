import type { 
  SchemeInfo, 
  SchemeEvaluationResult, 
  SchemeCategory, 
  Farm, 
  FarmerProfile, 
  FertilizerCropGuidance,
  ScaleOfFinanceItem
} from '../../types';
import { 
  VERIFIED_SCHEMES_CATALOGUE, 
  AGRONOMIC_FERTILIZER_GUIDELINES, 
  SCALE_OF_FINANCE_BENCHMARKS,
  STANDARD_FERTILIZER_PRICES 
} from './schemesData';

export interface FarmerContext {
  farmerProfile: FarmerProfile | null;
  farms: Farm[];
  primaryFarm?: Farm | null;
  activeCrops: string[];
  totalCultivatedAcres: number;
  totalFarmAcres: number;
  state: string;
  district: string;
  soilType: string;
  irrigationSource: string;
}

export class SchemeRelevanceEngine {
  /**
   * Derive consolidated farmer context from profile, farms, and plots
   */
  static extractFarmerContext(farmerProfile: FarmerProfile | null, farms: Farm[]): FarmerContext {
    const primaryFarm = farms.length > 0 ? farms[0] : null;
    const state = primaryFarm?.state || farmerProfile?.state || 'Telangana';
    const district = primaryFarm?.district || farmerProfile?.district || 'Warangal';
    const soilType = primaryFarm?.soilType || 'Red Loamy Soil';
    const irrigationSource = primaryFarm?.irrigationSource || 'Borewell & Drip';

    const activeCropsSet = new Set<string>();
    let totalCultivatedAcres = 0;
    let totalFarmAcres = 0;

    farms.forEach(farm => {
      totalFarmAcres += (Number(farm.totalAcres) || 0);
      farm.plots.forEach(plot => {
        if (plot.currentCrop && plot.currentCrop.trim()) {
          activeCropsSet.add(plot.currentCrop.trim());
          totalCultivatedAcres += (Number(plot.acres) || 0);
        }
      });
    });

    // If no plots yet recorded, active crops is empty
    const activeCrops = Array.from(activeCropsSet);

    return {
      farmerProfile,
      farms,
      primaryFarm,
      activeCrops,
      totalCultivatedAcres: totalCultivatedAcres > 0 ? totalCultivatedAcres : (primaryFarm ? Number(primaryFarm.allocatedAcres) || 0 : 0),
      totalFarmAcres: totalFarmAcres > 0 ? totalFarmAcres : (primaryFarm ? Number(primaryFarm.totalAcres) || 0 : 0),
      state,
      district,
      soilType,
      irrigationSource,
    };
  }

  /**
   * Evaluate all verified schemes against the farmer's real farm context
   */
  static evaluateAllSchemes(context: FarmerContext): SchemeEvaluationResult[] {
    const results: SchemeEvaluationResult[] = [];

    for (const scheme of VERIFIED_SCHEMES_CATALOGUE) {
      const evaluation = this.evaluateSingleScheme(scheme, context);
      results.push(evaluation);
    }

    // Sort: highly_relevant first, then likely_relevant, then more_info_needed, then general_support
    const rankOrder = {
      'highly_relevant': 0,
      'likely_relevant': 1,
      'more_info_needed': 2,
      'general_support': 3,
    };

    return results.sort((a, b) => rankOrder[a.matchLevel] - rankOrder[b.matchLevel]);
  }

  /**
   * Evaluate a single scheme for a specific farmer context
   */
  private static evaluateSingleScheme(scheme: SchemeInfo, context: FarmerContext): SchemeEvaluationResult {
    const { state, activeCrops, totalCultivatedAcres, irrigationSource, soilType } = context;

    const stateMatch = scheme.stateApplicability.includes('All') || scheme.stateApplicability.includes(state);

    // State mismatch (e.g. Telangana-only scheme for non-Telangana farmer)
    if (!stateMatch) {
      return {
        scheme,
        matchLevel: 'more_info_needed',
        relevanceReason: `Not currently applicable in ${state}. Official guidelines restrict this scheme to ${scheme.stateApplicability.join(', ')}.`,
        relevanceReasonTe: `${state} లో ప్రస్తుతం వర్తించదు. ఈ పథకం ${scheme.stateApplicability.join(', ')} రాష్ట్రాలకు మాత్రమే పరిమితం.`,
        relevanceReasonHi: `${state} में वर्तमान में लागू नहीं है। यह योजना केवल ${scheme.stateApplicability.join(', ')} के लिए है।`,
        actionRecommendation: `Explore Central schemes or state-specific alternatives for ${state}.`,
        actionRecommendationTe: `${state} కోసం కేంద్ర లేదా సంబంధిత రాష్ట్ర పథకాలను చూడండి.`,
        actionRecommendationHi: `${state} के लिए केंद्रीय या अन्य राज्य योजनाओं को देखें।`,
      };
    }

    // Specific Crop Schemes (Paddy Bonus, Cotton CCI, MIDH Horticulture)
    if (scheme.category === 'crop_specific' || scheme.category === 'horticulture') {
      const matchingCrops = activeCrops.filter(c => 
        scheme.cropApplicability.some(sc => sc.toLowerCase() === c.toLowerCase())
      );

      if (matchingCrops.length > 0) {
        const cropListStr = matchingCrops.join(', ');
        return {
          scheme,
          matchLevel: 'highly_relevant',
          relevanceReason: `Directly relevant because you cultivate ${cropListStr} on your farm in ${state}.`,
          relevanceReasonTe: `మీరు ${state} లోని మీ పొలంలో ${cropListStr} సాగు చేస్తున్నందున ఇది మీకు నేరుగా వర్తిస్తుంది.`,
          relevanceReasonHi: `यह सीधे आपके लिए प्रासंगिक है क्योंकि आप ${state} में अपने खेत पर ${cropListStr} की खेती करते हैं।`,
          missingInformation: ['Requires FAQ quality adherence (moisture within standard limits) and portal registration.'],
          missingInformationTe: ['FAQ నాణ్యతా ప్రమాణాలు (తేమ శాతం పరిమితిలో ఉండటం) మరియు పోర్టల్ నమోదు అవసరం.'],
          missingInformationHi: ['मानक गुणवत्ता (नमी सीमा) और पोर्टल पंजीकरण आवश्यक है।'],
          actionRecommendation: `Review procurement quality norms and register your active ${cropListStr} plot before harvest.`,
          actionRecommendationTe: `నాణ్యతా నిబంధనలను పరిశీలించి కోతకు ముందే మీ ${cropListStr} పంట వివరాలను నమోదు చేయండి.`,
          actionRecommendationHi: `गुणवत्ता दिशानिर्देश देखें और कटाई से पूर्व अपने ${cropListStr} खेत का विवरण दर्ज करें।`,
        };
      } else {
        return {
          scheme,
          matchLevel: 'more_info_needed',
          relevanceReason: `Specific to ${scheme.cropApplicability.filter(c => c !== 'All').join('/')} growers in ${state}. Add this crop to your farm if you plan to cultivate it.`,
          relevanceReasonTe: `ఇది ${state} లో ${scheme.cropApplicability.filter(c => c !== 'All').join('/')} సాగు చేసే రైతులకు వర్తిస్తుంది.`,
          relevanceReasonHi: `यह ${state} में ${scheme.cropApplicability.filter(c => c !== 'All').join('/')} उगाने वाले किसानों के लिए है।`,
          actionRecommendation: `View scheme terms if planning to plant ${scheme.cropApplicability.filter(c => c !== 'All').join(', ')}.`,
          actionRecommendationTe: `${scheme.cropApplicability.filter(c => c !== 'All').join(', ')} సాగు చేయాలనుకుంటే వివరాలు చూడండి.`,
          actionRecommendationHi: `यदि आप ${scheme.cropApplicability.filter(c => c !== 'All').join(', ')} लगाने की योजना बना रहे हैं तो विवरण देखें।`,
        };
      }
    }

    // Direct Benefit / Income Support (PM-KISAN, Rythu Bharosa)
    if (scheme.category === 'income_support') {
      const isStateScheme = scheme.authority === 'state';
      return {
        scheme,
        matchLevel: 'highly_relevant',
        relevanceReason: isStateScheme 
          ? `Top state investment support for agricultural landholders registered in ${state} Dharani/RoR database.`
          : `Core national income support for all verified operational agricultural landholders.`,
        relevanceReasonTe: isStateScheme
          ? `${state} లో వ్యవసాయ భూమి కలిగిన రైతులకు రాష్ట్ర ప్రభుత్వం అందించే ప్రధాన పెట్టుబడి సహాయం.`
          : `వ్యవసాయ భూమి ఉన్న రైతులందరికీ కేంద్ర ప్రభుత్వం అందించే ప్రత్యక్ష వార్షిక ఆదాయ సహాయం.`,
        relevanceReasonHi: isStateScheme
          ? `${state} में पंजीकृत कृषि भूमिधारक किसानों हेतु प्रमुख राज्य निवेश सहायता।`
          : `कृषि भूमि धारक सभी किसानों हेतु केंद्रीय प्रत्यक्ष आय सहायता योजना।`,
        missingInformation: [
          'Land record seeding in database',
          'Aadhaar eKYC completion',
          'NPCI DBT bank linkage',
        ],
        missingInformationTe: [
          'భూ రికార్డుల అనుసంధానం',
          'ఆధార్ eKYC పూర్తి చేయడం',
          'బ్యాంక్ ఖాతాలో NPCI DBT లింక్',
        ],
        missingInformationHi: [
          'भूमि अभिलेख का सत्यापन',
          'आधार ई-केवाईसी पूर्ण होना',
          'बैंक खाते में NPCI DBT सक्रिय होना',
        ],
        actionRecommendation: `Verify your Aadhaar eKYC status and ensure your land is seeded with your bank account.`,
        actionRecommendationTe: `మీ ఆధార్ eKYC స్థితిని తనిఖీ చేసి, బ్యాంక్ ఖాతాకు ఆధార్ లింక్ అయిందో లేదో సరిచూసుకోండి.`,
        actionRecommendationHi: `अपनी ई-केवाईसी स्थिति जांचें और सुनिश्चित करें कि बैंक खाता आधार से जुड़ा है।`,
      };
    }

    // Credit (KCC)
    if (scheme.category === 'credit') {
      return {
        scheme,
        matchLevel: 'highly_relevant',
        relevanceReason: `Essential crop cultivation credit at 4% effective interest for your ${totalCultivatedAcres > 0 ? `${totalCultivatedAcres} cultivated acres` : 'active farm'}.`,
        relevanceReasonTe: `మీ ${totalCultivatedAcres > 0 ? `${totalCultivatedAcres} ఎకరాల సాగు` : 'పొలం'} కోసం కేవలం 4% నికర వడ్డీతో పంట పెట్టుబడి రుణం.`,
        relevanceReasonHi: `आपके ${totalCultivatedAcres > 0 ? `${totalCultivatedAcres} एकड़ खेत` : 'खेत'} के लिए मात्र 4% प्रभावी ब्याज दर पर फसल उत्पादन ऋण।`,
        missingInformation: ['Scale of finance calculation based on your bank/PACS land verification.'],
        missingInformationTe: ['మీ బ్యాంక్ / సొసైటీ ద్వారా భూమి ధృవీకరణ మరియు స్కేల్ ఆఫ్ ఫైనాన్స్ లెక్క.'],
        missingInformationHi: ['बैंक द्वारा भूमि सत्यापन एवं स्केल ऑफ फाइनेंस की गणना।'],
        actionRecommendation: `Use our cultivation credit calculator below to estimate your borrowing need, then submit your Pattadar passbook copy to your local bank branch.`,
        actionRecommendationTe: `క్రింద ఉన్న క్యాలిక్యులేటర్ ద్వారా రుణ అంచనాను చూసి, పట్టాదారు పాస్‌బుక్ కాపీని మీ బ్యాంక్ లేదా పిఎసిఎస్‌లో సమర్పించండి.`,
        actionRecommendationHi: `क्रेडिट कैलकुलेटर का उपयोग कर अनुमानित ऋण आवश्यकता देखें, फिर बैंक में आवेदन करें।`,
      };
    }

    // Insurance (PMFBY, Rythu Bima)
    if (scheme.category === 'insurance') {
      if (scheme.id === 'rythu-bima') {
        return {
          scheme,
          matchLevel: 'highly_relevant',
          relevanceReason: `100% state-funded ₹5 Lakh life security for registered pattadars aged 18-59 in ${state}.`,
          relevanceReasonTe: `${state} లో 18-59 సం. వయస్సు గల పట్టాదారు రైతులకు ప్రభుత్వం పూర్తిగా చెల్లించే ₹5 లక్షల జీవిత బీమా రక్షణ.`,
          relevanceReasonHi: `${state} के 18-59 वर्ष आयु वर्ग के पंजीकृत किसानों हेतु ₹5 लाख का पूर्ण सरकारी बीमा सुरक्षा।`,
          missingInformation: ['Nominee details must be verified with your village Agricultural Extension Officer (AEO).'],
          missingInformationTe: ['మీ గ్రామ వ్యవసాయ విస్తరణ అధికారి (AEO) వద్ద నామినీ వివరాలు నమోదు చేసి ఉండాలి.'],
          missingInformationHi: ['कृषि विस्तार अधिकारी (AEO) के पास नॉमिनी विवरण दर्ज होना आवश्यक है।'],
          actionRecommendation: `Confirm with your village AEO that your nominee name is registered on the Rythu Bima portal.`,
          actionRecommendationTe: `రైతు బీమా పోర్టల్‌లో మీ నామినీ పేరు నమోదైందో లేదో మీ AEO వద్ద నిర్ధారించుకోండి.`,
          actionRecommendationHi: `अपने गांव के एईओ से पुष्टि करें कि आपका नॉमिनी विवरण दर्ज है।`,
        };
      }

      return {
        scheme,
        matchLevel: 'highly_relevant',
        relevanceReason: `Protects your active ${activeCrops.length > 0 ? activeCrops.join('/') : 'crops'} (${totalCultivatedAcres} acres) against adverse weather, localized storm, and yield losses.`,
        relevanceReasonTe: `ప్రతికూల వాతావరణం, వర్షాభావం మరియు పంట నష్టాల నుండి మీ ${activeCrops.length > 0 ? activeCrops.join('/') : 'పంటలు'} (${totalCultivatedAcres} ఎకరాలు) కు సమగ్ర రక్షణ.`,
        relevanceReasonHi: `प्रतिकूल मौसम एवं फसल नुकसान से आपके ${activeCrops.length > 0 ? activeCrops.join('/') : 'फसलों'} (${totalCultivatedAcres} एकड़) को संपूर्ण सुरक्षा।`,
        missingInformation: ['Seasonal cut-off deadline verification and notified village enrollment.'],
        missingInformationTe: ['సీజనల్ కటాఫ్ గడువు మరియు నోటిఫైడ్ గ్రామ జాబితా పరిశీలన.'],
        missingInformationHi: ['अंतिम तिथि सत्यापन एवं अधिसूचित ग्राम सूची।'],
        actionRecommendation: `Calculate your farmer premium share and pay before the seasonal cutoff date through bank or CSC.`,
        actionRecommendationTe: `మీ ప్రీమియం వాటాను లెక్కించి గడువు తేదీకి ముందే బ్యాంక్ లేదా మీ-సేవ/CSC ద్వారా చెల్లించండి.`,
        actionRecommendationHi: `प्रीमियम शेयर की गणना करें और अंतिम तिथि से पहले बैंक या सीएससी केंद्र से बीमा कराएं।`,
      };
    }

    // Irrigation & Solar (TSMIP, PM-KUSUM)
    if (scheme.category === 'irrigation') {
      const hasDrip = irrigationSource.toLowerCase().includes('drip');
      const hasBorewell = irrigationSource.toLowerCase().includes('bore');

      if (scheme.id === 'tsmip-micro-irrigation') {
        return {
          scheme,
          matchLevel: 'highly_relevant',
          relevanceReason: hasDrip 
            ? `Relevant for drip system maintenance, fertigation support, or expanding micro-irrigation to remaining unallocated acres in ${state}.`
            : `High subsidy (up to 80-100%) to install water-saving Drip or Sprinkler systems for your ${irrigationSource} farm.`,
          relevanceReasonTe: hasDrip
            ? `మీ డ్రిప్ సిస్టమ్ నిర్వహణ, ఫెర్టిగేషన్ లేదా మిగిలిన పొలానికి మైక్రో-ఇరిగేషన్ విస్తరించడానికి వర్తిస్తుంది.`
            : `మీ పొలంలో డ్రిప్ లేదా స్ప్రింక్లర్ ఏర్పాటుకు 80-100% వరకు భారీ ప్రభుత్వ రాయితీ.`,
          relevanceReasonHi: hasDrip
            ? `ड्रिप सिस्टम रखरखाव एवं शेष रकबे में सूक्ष्म सिंचाई विस्तार हेतु प्रासंगिक।`
            : `आपके खेत में ड्रिप/स्प्रिंकलर लगाने हेतु 80-100% तक की भारी सरकारी सब्सिडी।`,
          missingInformation: ['Caste certificate (for SC/ST/BC higher subsidy slabs) and water source electricity verification.'],
          missingInformationTe: ['కుల ధృవీకరణ పత్రం (అధిక రాయితీ కోసం) మరియు నీటి వనరు/కరెంట్ బిల్లు వివరాలు.'],
          missingInformationHi: ['जाति प्रमाण पत्र (उच्च सब्सिडी स्लैब हेतु) एवं जल स्रोत विवरण।'],
          actionRecommendation: `Apply through your District Horticulture Officer (DHO) / TSMIP portal with your Pattadar passbook.`,
          actionRecommendationTe: `పట్టాదారు పాస్‌బుక్‌తో మీ జిల్లా ఉద్యానవన అధికారి (DHO) లేదా TSMIP పోర్టల్‌లో దరఖాస్తు చేసుకోండి.`,
          actionRecommendationHi: `पट्टा पासबुक के साथ जिला उद्यानिकी अधिकारी अथवा टीएसएमआईपी पोर्टल पर आवेदन करें।`,
        };
      }

      return {
        scheme,
        matchLevel: 'likely_relevant',
        relevanceReason: hasBorewell 
          ? `Up to 60% subsidy for installing standalone solar agricultural pumps on your borewell, cutting grid power uncertainty.`
          : `Solar power subsidy for agricultural pumps to ensure reliable daytime irrigation.`,
        relevanceReasonTe: `మీ బోరుబావి వద్ద సోలార్ వ్యవసాయ పంపు ఏర్పాటుకు 60% రాయితీ. పగటిపూట నిరంతర నీటి సరఫరా.`,
        relevanceReasonHi: `बोरवेल पर सोलर कृषि पंप लगाने हेतु 60% सब्सिडी। दिन में निर्बाध सिंचाई सुविधा।`,
        missingInformation: ['Off-grid / agricultural power connection verification.'],
        missingInformationTe: ['వ్యవసాయ విద్యుత్ కనెక్షన్ / డీజిల్ పంపు వివరాల ధృవీకరణ.'],
        missingInformationHi: ['कृषि बिजली कनेक्शन/डीजल पंप का सत्यापन।'],
        actionRecommendation: `Check TSREDCO / MNRE portal notifications for current district pump allocation quotas.`,
        actionRecommendationTe: `జిల్లా సోలార్ పంపుల కోటా కోసం TSREDCO అధికారిక నోటిఫికేషన్లను పరిశీలించండి.`,
        actionRecommendationHi: `जिला सोलर पंप आवंटन हेतु टीएसरेडको अथवा एमएनआरई पोर्टल देखें।`,
      };
    }

    // Soil Health
    if (scheme.category === 'soil_health') {
      return {
        scheme,
        matchLevel: 'highly_relevant',
        relevanceReason: `Scientific 12-parameter nutrient and pH testing to optimize fertilizer dosage and lower input costs for your ${soilType}.`,
        relevanceReasonTe: `మీ ${soilType} లో ఎరువుల ఖర్చు తగ్గించి సరైన మోతాదును తెలుసుకోవడానికి 12 రకాల పోషకాల ఉచిత భూసార పరీక్ష.`,
        relevanceReasonHi: `आपकी ${soilType} में खाद का खर्च घटाने और उचित मात्रा जानने हेतु 12 घटकों की निःशुल्क मिट्टी जांच।`,
        missingInformation: ['Soil sample collection and submission to your local Rythu Vedika / District Soil Testing Lab.'],
        missingInformationTe: ['మట్టి నమూనా సేకరించి మీ గ్రామ రైతు వేదిక / జిల్లా భూసార పరీక్ష ల్యాబ్‌కు అందించడం.'],
        missingInformationHi: ['मिट्टी का नमूना लेकर स्थानीय किसान केंद्र (Rythu Vedika) अथवा जिला प्रयोगशाला में जमा करना।'],
        actionRecommendation: `Follow our 4-step soil sampling guide below and submit a sample to your local Agricultural Extension Officer (AEO).`,
        actionRecommendationTe: `క్రింద ఇచ్చిన 4 దశల మట్టి నమూనా సేకరణ మార్గదర్శకాలను పాటించి మీ AEO కు అందించండి.`,
        actionRecommendationHi: `दिए गए मृदा नमूना संग्रह दिशानिर्देशों का पालन कर कृषि विस्तार अधिकारी को नमूना सौंपें।`,
      };
    }

    // Mechanization (SMAM)
    if (scheme.category === 'mechanization') {
      return {
        scheme,
        matchLevel: 'likely_relevant',
        relevanceReason: `40-50% subsidy on modern farm machinery (tractors, power weeders, sprayers, transplanters) to reduce manual labour costs.`,
        relevanceReasonTe: `కూలీల కొరతను తగ్గించడానికి ఆధునిక యంత్రాలు (ట్రాక్టర్లు, పవర్ వీడర్లు, స్ప్రేయర్లు, నాటు యంత్రాలు) కొనుగోలుపై 40-50% రాయితీ.`,
        relevanceReasonHi: `मजदूरी खर्च घटाने हेतु आधुनिक कृषि यंत्रों (ट्रैक्टर, वीडर, स्प्रेयर, रोपाई मशीन) पर 40-50% सब्सिडी।`,
        missingInformation: ['Annual target allocation by District Agricultural Officer and authorized dealer quotation.'],
        missingInformationTe: ['జిల్లా వ్యవసాయ అధికారి వార్షిక లక్ష్యాలు మరియు డీలర్ కొటేషన్.'],
        missingInformationHi: ['जिला कृषि अधिकारी द्वारा लक्ष्य आवंटन एवं अधिकृत डीलर कोटेशन।'],
        actionRecommendation: `Register on the central Agri Machinery DBT portal and select your preferred authorized equipment dealer.`,
        actionRecommendationTe: `అగ్రి మెషినరీ డిబిటి పోర్టల్‌లో నమోదు చేసుకుని మీకు కావలసిన యంత్రాన్ని ఎంచుకోండి.`,
        actionRecommendationHi: `कृषि यंत्रीकरण डीबीटी पोर्टल पर पंजीकरण करें और उपकरण चुनें।`,
      };
    }

    // Default General Support
    return {
      scheme,
      matchLevel: 'general_support',
      relevanceReason: `Available to eligible farmers in ${state}.`,
      relevanceReasonTe: `${state} లో అర్హులైన రైతులకు అందుబాటులో ఉంది.`,
      relevanceReasonHi: `${state} के पात्र किसानों के लिए उपलब्ध।`,
      actionRecommendation: `Review official criteria and required documentation before applying.`,
      actionRecommendationTe: `దరఖాస్తు చేయడానికి ముందు అధికారిక మార్గదర్శకాలను పరిశీలించండి.`,
      actionRecommendationHi: `आवेदन करने से पूर्व आधिकारिक दिशानिर्देशों की जांच करें।`,
    };
  }

  /**
   * Filter scheme evaluations by category, search text, and authority
   */
  static filterEvaluations(
    evaluations: SchemeEvaluationResult[],
    filters: {
      category?: SchemeCategory;
      search?: string;
      authority?: 'all' | 'central' | 'state';
      onlySaved?: boolean;
      savedSchemeIds?: string[];
    }
  ): SchemeEvaluationResult[] {
    let filtered = [...evaluations];

    // Filter by Saved
    if (filters.onlySaved && filters.savedSchemeIds) {
      const savedSet = new Set(filters.savedSchemeIds);
      filtered = filtered.filter(item => savedSet.has(item.scheme.id));
    }

    // Filter by Authority
    if (filters.authority && filters.authority !== 'all') {
      filtered = filtered.filter(item => item.scheme.authority === filters.authority);
    }

    // Filter by Category
    if (filters.category && filters.category !== 'all') {
      if (filters.category === 'central') {
        filtered = filtered.filter(item => item.scheme.authority === 'central');
      } else if (filters.category === 'state') {
        filtered = filtered.filter(item => item.scheme.authority === 'state');
      } else {
        filtered = filtered.filter(item => item.scheme.category === filters.category);
      }
    }

    // Filter by Search
    if (filters.search && filters.search.trim()) {
      const query = filters.search.toLowerCase().trim();
      filtered = filtered.filter(item => {
        const s = item.scheme;
        return (
          s.officialName.toLowerCase().includes(query) ||
          (s.officialNameTe && s.officialNameTe.toLowerCase().includes(query)) ||
          (s.officialNameHi && s.officialNameHi.toLowerCase().includes(query)) ||
          s.shortName.toLowerCase().includes(query) ||
          s.benefitSummary.toLowerCase().includes(query) ||
          s.category.toLowerCase().includes(query) ||
          s.cropApplicability.some(c => c.toLowerCase().includes(query))
        );
      });
    }

    return filtered;
  }

  /**
   * Get Top 3 Recommended Schemes for the Hero Overview
   */
  static getTopRecommendations(evaluations: SchemeEvaluationResult[]): SchemeEvaluationResult[] {
    const highlyRelevant = evaluations.filter(e => e.matchLevel === 'highly_relevant');
    if (highlyRelevant.length >= 3) {
      return highlyRelevant.slice(0, 3);
    }
    return evaluations.slice(0, 3);
  }

  /**
   * Calculate Illustrative Cultivation Credit (KCC) requirement
   */
  static calculateKccCreditRequirement(cropName: string, acres: number): {
    cropName: string;
    acres: number;
    scalePerAcre: number;
    minScalePerAcre: number;
    maxScalePerAcre: number;
    estimatedBaseCredit: number;
    postHarvest10Pct: number;
    maintenance20Pct: number;
    totalIllustrativeKccLimit: number;
    effectiveInterestRate: string;
    standardInterestRate: string;
    source: string;
  } {
    const benchmark: ScaleOfFinanceItem = SCALE_OF_FINANCE_BENCHMARKS[cropName] || {
      cropName,
      minScalePerAcre: 35000,
      maxScalePerAcre: 45000,
      standardBenchmarkPerAcre: 40000,
      kharifInsPremiumPct: 2.0,
      rabiInsPremiumPct: 1.5,
      source: 'State Agricultural Scale of Finance Standard Norms',
    };

    const validAcres = Math.max(0.1, Number(acres) || 1.0);
    const baseCredit = benchmark.standardBenchmarkPerAcre * validAcres;
    const postHarvest = Math.round(baseCredit * 0.10); // 10% for post-harvest / household consumption
    const maintenance = Math.round(baseCredit * 0.20); // 20% for farm asset repair & maintenance
    const totalLimit = baseCredit + postHarvest + maintenance;

    return {
      cropName: benchmark.cropName,
      acres: validAcres,
      scalePerAcre: benchmark.standardBenchmarkPerAcre,
      minScalePerAcre: benchmark.minScalePerAcre,
      maxScalePerAcre: benchmark.maxScalePerAcre,
      estimatedBaseCredit: baseCredit,
      postHarvest10Pct: postHarvest,
      maintenance20Pct: maintenance,
      totalIllustrativeKccLimit: totalLimit,
      effectiveInterestRate: '4.0% p.a. (with 3% Prompt Repayment Incentive)',
      standardInterestRate: '7.0% p.a.',
      source: benchmark.source,
    };
  }

  /**
   * Calculate PMFBY Farmer Premium Share for given crop, acres, and sum insured
   */
  static calculatePmfbyPremiumEstimate(cropName: string, acres: number, season: 'kharif' | 'rabi' = 'kharif'): {
    cropName: string;
    acres: number;
    season: 'kharif' | 'rabi';
    sumInsuredPerAcre: number;
    totalSumInsured: number;
    farmerPremiumRatePct: number;
    farmerPremiumAmount: number;
    govtSubsidySharePct: number;
    isCommercialHorticultural: boolean;
  } {
    const benchmark = SCALE_OF_FINANCE_BENCHMARKS[cropName] || {
      cropName,
      minScalePerAcre: 35000,
      maxScalePerAcre: 45000,
      standardBenchmarkPerAcre: 40000,
      kharifInsPremiumPct: 2.0,
      rabiInsPremiumPct: 1.5,
      commercialPremiumPct: undefined,
      source: 'State Benchmark',
    };

    const isCommercial = ['Cotton', 'Chilli', 'Tomato'].includes(cropName) || Boolean(benchmark.commercialPremiumPct);
    const premiumRate = isCommercial ? 5.0 : (season === 'kharif' ? benchmark.kharifInsPremiumPct : benchmark.rabiInsPremiumPct);
    const validAcres = Math.max(0.1, Number(acres) || 1.0);
    const sumInsured = benchmark.standardBenchmarkPerAcre * validAcres;
    const farmerPremium = Math.round((sumInsured * premiumRate) / 100);

    return {
      cropName: benchmark.cropName,
      acres: validAcres,
      season,
      sumInsuredPerAcre: benchmark.standardBenchmarkPerAcre,
      totalSumInsured: sumInsured,
      farmerPremiumRatePct: premiumRate,
      farmerPremiumAmount: farmerPremium,
      govtSubsidySharePct: 100 - premiumRate,
      isCommercialHorticultural: isCommercial,
    };
  }

  /**
   * Get Crop-Specific Fertilizer Agronomic Guidance & calculate total quantities for farmer acreage
   */
  static getFertilizerGuidance(cropName: string, acres: number): {
    guidance: FertilizerCropGuidance;
    acres: number;
    totalNutrientsKg: { nitrogen: number; phosphorus: number; potassium: number };
    totalProductsKg: { ureaKg: number; dapKg: number; mopKg: number };
    totalBagsEstimated: { ureaBags: number; dapBags: number; mopBags: number };
    costEstimate: {
      ureaCost: number;
      dapCost: number;
      mopCost: number;
      totalCost: number;
      costPerAcre: number;
    };
  } {
    const guidance = AGRONOMIC_FERTILIZER_GUIDELINES[cropName] || AGRONOMIC_FERTILIZER_GUIDELINES['Paddy'];
    const validAcres = Math.max(0.1, Number(acres) || 1.0);

    const totalNutrients = {
      nitrogen: Math.round(guidance.npkRatioKgPerAcre.nitrogen * validAcres),
      phosphorus: Math.round(guidance.npkRatioKgPerAcre.phosphorus * validAcres),
      potassium: Math.round(guidance.npkRatioKgPerAcre.potassium * validAcres),
    };

    const totalProducts = {
      ureaKg: Math.round(guidance.productDosagePerAcre.ureaKg * validAcres),
      dapKg: Math.round(guidance.productDosagePerAcre.dapKg * validAcres),
      mopKg: Math.round(guidance.productDosagePerAcre.mopKg * validAcres),
    };

    const totalBags = {
      ureaBags: Math.ceil(totalProducts.ureaKg / STANDARD_FERTILIZER_PRICES.urea.bagWeightKg),
      dapBags: Math.ceil(totalProducts.dapKg / STANDARD_FERTILIZER_PRICES.dap.bagWeightKg),
      mopBags: Math.ceil(totalProducts.mopKg / STANDARD_FERTILIZER_PRICES.mop.bagWeightKg),
    };

    const ureaCost = totalBags.ureaBags * STANDARD_FERTILIZER_PRICES.urea.standardPricePerBag;
    const dapCost = totalBags.dapBags * STANDARD_FERTILIZER_PRICES.dap.standardPricePerBag;
    const mopCost = totalBags.mopBags * STANDARD_FERTILIZER_PRICES.mop.standardPricePerBag;
    const totalCost = ureaCost + dapCost + mopCost;

    return {
      guidance,
      acres: validAcres,
      totalNutrientsKg: totalNutrients,
      totalProductsKg: totalProducts,
      totalBagsEstimated: totalBags,
      costEstimate: {
        ureaCost,
        dapCost,
        mopCost,
        totalCost,
        costPerAcre: Math.round(totalCost / validAcres),
      },
    };
  }
}
