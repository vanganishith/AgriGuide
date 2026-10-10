import React from 'react';
import type { Language, DesktopNavTab } from '../../types';
import { 
  Sprout, 
  Stethoscope, 
  Store, 
  Landmark, 
  ArrowRight, 
  Mic, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  ShieldCheck
} from 'lucide-react';

interface LandingPageExplainerProps {
  currentLang: Language;
  onNavigateTab: (tab: DesktopNavTab) => void;
  onScrollToDashboard?: () => void;
}

const LANDING_TEXT = {
  en: {
    heroPill: 'Standing with farmers, at every step',
    heroTitle: 'AgriGuide',
    heroTagline: 'Smart AI Companion & Decision Engine for Your Farm',
    heroDesc: 'Powered by multimodal agricultural AI to diagnose crop diseases via voice & photos, deliver verified university remedies, provide hyper-local weather decisions, track live mandi prices, and connect directly with verified buyers.',
    diagnoseProblemBtn: 'Got a Problem? Diagnose Crop Now',
    planMyCropBtn: 'Plan My Crop',
    mandiMarketBtn: 'Mandi Marketplace',
    govtSchemesBtn: 'Govt Schemes',
    voiceBadge: '🎙 Easy assistance via Voice, Video & Photos in Telugu, Hindi & English',
    jumpToDashboard: 'View Today\'s Live Farm Advisory ↓',
    
    // Workflow
    workflowTitle: 'Our Workflow',
    workflowSubtitle: 'How AgriGuide turns daily crop challenges into verified solutions in 4 simple steps',
    step1Title: 'Report Problem',
    step1Desc: 'Describe your crop issue easily using voice recording, camera photo scan, or text in your native language.',
    step2Title: 'Multimodal AI Analysis',
    step2Desc: 'Our agricultural AI analyzes plant symptoms, pest signs, and visual leaf damage in real time.',
    step3Title: 'Expert & University Remedies',
    step3Desc: 'Verified guidelines from State Agricultural Universities prescribe exact organic and chemical treatments with voice audio.',
    step4Title: 'Better Yield & Direct Market',
    step4Desc: 'Protect your harvest, plan profitable crops, and connect directly with verified buyers at transparent prices without middlemen.',

    // Comparison
    comparisonTitle: 'Why We Are Better Compared to Traditional Methods',
    comparisonSubtitle: 'Experience the modern agricultural advantage over slow, costly conventional practices',
    traditionalTitle: 'Traditional Farming Methods',
    traditional1: 'Takes days to travel and meet agricultural extension officers',
    traditional2: 'Guesswork on crop diseases leads to costly wrong pesticides & soil damage',
    traditional3: 'High travel and consultation expenses with local chemical dealers',
    traditional4: 'Exploitative middlemen and hidden mandi commissions cut profits',
    
    agriGuideTitle: 'AgriGuide AI Platform',
    agriGuide1: 'Instant 24/7 AI assistance anytime, anywhere directly from your field',
    agriGuide2: 'Multimodal AI + ICAR and Agricultural University verified remedies with audio playback',
    agriGuide3: 'Zero cost & ultra-easy to use in your native mother tongue (Telugu, Hindi & English)',
    agriGuide4: 'Direct buyer connections & live APMC mandi prices with 100% price transparency',

    // Features Section
    featuresTitle: 'Explore AgriGuide Core Features',
    featuresSubtitle: 'Comprehensive digital toolkit designed specifically for Indian farmers',
    feature1Title: 'Multimodal Crop Doctor',
    feature1Sub: 'AI Plant Health & Disease Scanner',
    feature1Desc: 'Upload a leaf photo or speak your plant symptoms. Get instant scientific diagnosis, pest identification, severity rating, and ICAR-backed treatment dosages.',
    feature1Btn: 'Open Crop Doctor',

    feature2Title: 'My Farm & Crop Planner',
    feature2Sub: 'Scientific Field Allocation & Roadmap',
    feature2Desc: 'Configure farm acreage, soil type, and irrigation source. Compare suitable crops with APMC mandi economics and get an automated day-by-day management schedule.',
    feature2Btn: 'Open My Farm',

    feature3Title: 'Mandi Marketplace',
    feature3Sub: 'Live Mandi Prices & Direct Buyer Connect',
    feature3Desc: 'Access real-time commodity modal prices across APMC mandis, compare with MSP baselines, and send direct sell proposals to verified buyers at your chosen price.',
    feature3Btn: 'Open Marketplace',

    feature4Title: 'Government Schemes',
    feature4Sub: 'Farmer Subsidies & Financial Support',
    feature4Desc: 'Discover eligible central and state agricultural schemes (PM-Kisan, Rythu Bandhu, crop insurance). Check eligibility criteria and get step-by-step application guidance.',
    feature4Btn: 'Explore Schemes',

    phoneGreeting: 'Hello Farmer!',
    phoneSubtitle: 'Record your crop issue or check advisory',
    phoneTapToSpeak: 'Tap to speak & record',
    phoneOrType: 'OR TYPE ISSUE',
    phoneSubmit: 'Analyze Crop',
    phoneHome: 'Home',
    phoneDoctor: 'Doctor',
    phoneFarm: 'Farm',
    phoneMarket: 'Market',
  },
  te: {
    heroPill: 'ప్రతి అడుగులో రైతుకు తోడుగా · ఆధునిక AI మార్గదర్శి',
    heroTitle: 'అగ్రిగైడ్ (AgriGuide)',
    heroTagline: 'మీ పంటకు తెలివైన AI తోడు & వ్యవసాయ నిర్ణయ వేదిక',
    heroDesc: 'వాయిస్ మరియు ఫోటోల ద్వారా పంట తెగుళ్లను గుర్తించే మల్టీమోడల్ AI, వ్యవసాయ విశ్వవిద్యాలయాల ధృవీకరించిన నివారణలు, తాజా వాతావరణ నిర్ణయాలు, ప్రత్యక్ష మార్కెట్ ధరలు మరియు కొనుగోలుదారులతో నేరుగా అనుసంధానం.',
    diagnoseProblemBtn: 'సమస్య ఉందా? పంట ఆరోగ్యం తనిఖీ చేయండి',
    planMyCropBtn: 'నా పంటను ప్లాన్ చేయండి',
    mandiMarketBtn: 'మార్కెట్ ధరలు & అమ్మకాలు',
    govtSchemesBtn: 'రైతు పథకాలు & సబ్సిడీలు',
    voiceBadge: '🎙️ తెలుగు, హిందీ మరియు ఇంగ్లీషులో వాయిస్ & ఫోటో ద్వారా సులభ సేవలు',
    jumpToDashboard: 'ఈ రోజు లైవ్ వ్యవసాయ సలహాలు చూడండి ↓',

    // Workflow
    workflowTitle: 'మా పని విధానం',
    workflowSubtitle: 'అగ్రిగైడ్ మీ పంట సమస్యలను 4 సులభ దశల్లో శాస్త్రీయ పరిష్కారాలుగా ఎలా మారుస్తుంది',
    step1Title: '1 · సమస్యను తెలపండి',
    step1Desc: 'మీ స్థానిక తెలుగు భాషలో వాయిస్ మాట్లాడటం ద్వారా లేదా కెమెరాతో ఫోటో తీయడం ద్వారా పంట సమస్యను సులభంగా తెలపండి.',
    step2Title: '2 · మల్టీమోడల్ AI విశ్లేషణ',
    step2Desc: 'మా వ్యవసాయ AI మీ మొక్కల ఆకులు, పురుగుల లక్షణాలు మరియు తెగుళ్ల నష్టాన్ని తక్షణమే విశ్లేషిస్తుంది.',
    step3Title: '3 · నిపుణుల & విశ్వవిద్యాలయ మందులు',
    step3Desc: 'రాష్ట్ర వ్యవసాయ విశ్వవిద్యాలయాలు ధృవీకరించిన సురక్షితమైన సేంద్రీయ & రసాయన మందుల మోతాదులను వాయిస్ ఆడియోతో అందిస్తుంది.',
    step4Title: '4 · అధిక దిగుబడి & గిట్టుబాటు ధర',
    step4Desc: 'పంటను కాపాడుకోండి, లాభదాయక పంటలను ప్లాన్ చేయండి మరియు దళారులు లేకుండా నేరుగా కొనుగోలుదారులకు గిట్టుబాటు ధరకు అమ్మండి.',

    // Comparison
    comparisonTitle: 'సంప్రదాయ పద్ధతుల కంటే అగ్రిగైడ్ ఎందుకు మేలైనది',
    comparisonSubtitle: 'వ్యయప్రయాసలతో కూడిన పాత పద్ధతులను వీడి ఆధునిక సాంకేతిక ప్రయోజనాన్ని పొందండి',
    traditionalTitle: 'సంప్రదాయ పద్ధతులు',
    traditional1: 'వ్యవసాయ అధికారులు లేదా దుకాణదారుల వద్దకు వెళ్లడానికి రోజులు పడుతుంది',
    traditional2: 'తెగుళ్లపై అంచనాలు తప్పి ఖరీదైన తప్పుడు పురుగుమందులు వాడటం వల్ల నేల పాడవుతుంది',
    traditional3: 'స్థానిక డీలర్ల వద్ద అధిక ప్రయాణ మరియు సంప్రదింపుల ఖర్చులు',
    traditional4: 'మార్కెట్లో దళారుల దోపిడీ మరియు అసలైన మార్కెట్ ధరలు తెలియకపోవడం',

    agriGuideTitle: 'అగ్రిగైడ్ AI వేదిక',
    agriGuide1: 'మీ చేను నుంచే ఎప్పుడైనా, ఎక్కడైనా 24/7 తక్షణ AI నిపుణుల సహాయం',
    agriGuide2: 'మల్టీమోడల్ AI + ICAR & వ్యవసాయ విశ్వవిద్యాలయాల ధృవీకరించిన మందులు (ఆడియోతో)',
    agriGuide3: 'పూర్తిగా ఉచితం మరియు మీ సొంత మాతృభాష తెలుగులో వాయిస్ ద్వారా ఉపయోగించవచ్చు',
    agriGuide4: 'దళారులు లేకుండా నేరుగా కొనుగోలుదారులతో అనుసంధానం మరియు 100% పారదర్శక ధరలు',

    // Features Section
    featuresTitle: 'అగ్రిగైడ్ ప్రధాన విభాగాలు',
    featuresSubtitle: 'భారతీయ రైతుల కోసం ప్రత్యేకంగా రూపొందించిన సమగ్ర సాంకేతిక వేదిక',
    feature1Title: 'క్రాప్ డాక్టర్ (Crop Doctor)',
    feature1Sub: 'మల్టీమోడల్ పంట ఆరోగ్య & తెగుళ్ల స్కానర్',
    feature1Desc: 'ఆకు ఫోటోను అప్‌లోడ్ చేయండి లేదా సమస్యను మాట్లాడండి. తక్షణ శాస్త్రీయ నిర్ధారణ, తెగుళ్ల తీవ్రత మరియు ICAR సిఫార్సు చేసిన మందుల వివరాలు వినండి.',
    feature1Btn: 'క్రాప్ డాక్టర్ తెరవండి',

    feature2Title: 'నా పొలం & పంట ప్రణాళిక',
    feature2Sub: 'శాస్త్రీయ భూమి నిర్వహణ & సాగు మార్గదర్శి',
    feature2Desc: 'మీ విస్తీర్ణం, నేల రకం, డ్రిప్/బోరుబావి నీటి వనరులను నమోదు చేయండి. మార్కెట్ ధరల ఆధారంగా లాభదాయక పంటలను పోల్చి చూసి రోజువారీ సాగు షెడ్యూల్ పొందండి.',
    feature2Btn: 'నా పొలం తెరవండి',

    feature3Title: 'మార్కెట్ & కొనుగోలుదారులు',
    feature3Sub: 'లైవ్ మార్కెట్ ధరలు & డైరెక్ట్ బయర్ మ్యాచ్',
    feature3Desc: 'APMC మార్కెట్ల తాజా ధరలు, మద్దతు ధర (MSP) వివరాలు చూడండి. మీకు నచ్చిన ధరను నిర్ణయించి ధృవీకరించిన కొనుగోలుదారులకు నేరుగా అమ్మకపు అభ్యర్థన పంపండి.',
    feature3Btn: 'మార్కెట్ తెరవండి',

    feature4Title: 'ప్రభుత్వ పథకాలు & సబ్సిడీలు',
    feature4Sub: 'రైతు సంక్షేమ పథకాలు & ఆర్థిక సహాయం',
    feature4Desc: 'కేంద్ర, రాష్ట్ర ప్రభుత్వ పథకాలు (పీఎం కిసాన్, రైతు బంధు, పంటల బీమా). మీ అర్హతలను తనిఖీ చేసి దరఖాస్తు చేసుకోవడానికి మార్గదర్శకాలను పొందండి.',
    feature4Btn: 'పథకాలు చూడండి',

    phoneGreeting: 'నమస్కారం రైతు సోదరా!',
    phoneSubtitle: 'మీ పంట సమస్యను మాట్లాడండి లేదా టైప్ చేయండి',
    phoneTapToSpeak: 'మాట్లాడటానికి నొక్కండి',
    phoneOrType: 'లేదా ఇక్కడ టైప్ చేయండి',
    phoneSubmit: 'పంటను విశ్లేషించండి',
    phoneHome: 'హోమ్',
    phoneDoctor: 'డాక్టర్',
    phoneFarm: 'పొలం',
    phoneMarket: 'మార్కెట్',
  },
  hi: {
    heroPill: 'किसानों के साथ, हर कदम पर · आधुनिक कृषि साथी',
    heroTitle: 'एग्रीगाइड (AgriGuide)',
    heroTagline: 'आपके खेत का स्मार्ट AI साथी और निर्णय केंद्र',
    heroDesc: 'मल्टीमॉडल AI द्वारा संचालित, जो आवाज और फोटो के जरिए फसल रोगों की पहचान करता है, कृषि विश्वविद्यालयों द्वारा प्रमाणित उपचार देता है, सटीक मौसम निर्णय प्रदान करता है, और खरीदारों से सीधे जोड़ता है।',
    diagnoseProblemBtn: 'समस्या है? फसल स्वास्थ्य जांचें',
    planMyCropBtn: 'फसल की योजना बनाएं',
    mandiMarketBtn: 'मंडी भाव और बाजार',
    govtSchemesBtn: 'सरकारी योजनाएं और सब्सिडी',
    voiceBadge: '🎙️ हिंदी, तेलुगु और अंग्रेजी में आवाज और फोटो से आसान सहायता',
    jumpToDashboard: 'आज का लाइव कृषि परामर्श देखें ↓',

    // Workflow
    workflowTitle: 'हमारी कार्यप्रणाली',
    workflowSubtitle: 'कैसे एग्रीगाइड फसल की समस्याओं को 4 आसान चरणों में प्रमाणित समाधानों में बदलता है',
    step1Title: '1 · समस्या बताएं',
    step1Desc: 'अपनी मातृभाषा में आवाज रिकॉर्ड करके, कैमरे से फोटो खींचकर या लिखकर फसल की समस्या आसानी से बताएं।',
    step2Title: '2 · मल्टीमॉडल AI विश्लेषण',
    step2Desc: 'हमारा कृषि AI पौधों की पत्तियों, कीटों के लक्षण और नुकसान का तुरंत सटीक विश्लेषण करता है।',
    step3Title: '3 · विशेषज्ञों और विश्वविद्यालय की सलाह',
    step3Desc: 'कृषि विश्वविद्यालयों और ICAR के मानकों के अनुसार सटीक जैविक व रासायनिक दवाइयों की खुराक ऑडियो में प्राप्त करें।',
    step4Title: '4 · बेहतर उपज और सीधा बाजार',
    step4Desc: 'फसल को बचाएं, लाभकारी फसलों की योजना बनाएं और बिना बिचौलियों के सीधे सत्यापित खरीदारों को बेचें।',

    // Comparison
    comparisonTitle: 'पारंपरिक तरीकों की तुलना में हम बेहतर क्यों हैं',
    comparisonSubtitle: 'धीमे और महंगे पारंपरिक तरीकों को छोड़कर आधुनिक डिजिटल लाभ का अनुभव करें',
    traditionalTitle: 'पारंपरिक खेती के तरीके',
    traditional1: 'कृषि अधिकारियों या दुकानों तक जाने में कई दिन लग जाते हैं',
    traditional2: 'रोग का गलत अनुमान लगाने से महंगी गलत कीटनाशक दवाएं और मिट्टी का नुकसान',
    traditional3: 'स्थानीय दवा विक्रेताओं के पास आने-जाने का अधिक खर्च',
    traditional4: 'मंडी में बिचौलियों का शोषण और गुप्त कमीशन के कारण कम मुनाफा',

    agriGuideTitle: 'एग्रीगाइड AI प्लेटफॉर्म',
    agriGuide1: 'अपने खेत से ही 24/7 कभी भी, कहीं भी तुरंत AI विशेषज्ञ सहायता',
    agriGuide2: 'मल्टीमॉडल AI + ICAR और कृषि विश्वविद्यालयों द्वारा प्रमाणित उपचार (ऑडियो सहित)',
    agriGuide3: 'बिल्कुल मुफ्त और अपनी मातृभाषा में आवाज के जरिए उपयोग में बेहद आसान',
    agriGuide4: 'बिना बिचौलियों के सीधे खरीदारों से जुड़ाव और 100% पारदर्शी मंडी भाव',

    // Features Section
    featuresTitle: 'एग्रीगाइड की मुख्य विशेषताएं',
    featuresSubtitle: 'भारतीय किसानों के लिए विशेष रूप से तैयार डिजिटल कृषि मंच',
    feature1Title: 'क्रॉप डॉक्टर (Crop Doctor)',
    feature1Sub: 'AI फसल स्वास्थ्य एवं कीट निदान स्कैनर',
    feature1Desc: 'पत्ती की फोटो अपलोड करें या बोलकर बताएं। तुरंत वैज्ञानिक निदान, कीट की गंभीरता और प्रमाणित दवाओं की मात्रा सुनें।',
    feature1Btn: 'क्रॉप डॉक्टर खोलें',

    feature2Title: 'मेरा खेत और फसल योजना',
    feature2Sub: 'वैज्ञानिक खेत प्रबंधन और उत्पादन योजना',
    feature2Desc: 'खेत का रकबा, मिट्टी का प्रकार और सिंचाई साधन दर्ज करें। मंडी अर्थशास्त्र के आधार पर उपयुक्त फसलों की तुलना करें।',
    feature2Btn: 'मेरा खेत खोलें',

    feature3Title: 'मंडी बाजार (Marketplace)',
    feature3Sub: 'लाइव मंडी भाव और खरीदार मिलान',
    feature3Desc: 'APMC मंडियों के ताजा मॉडल भाव और MSP देखें। अपनी मनपसंद कीमत तय करके सत्यापित खरीदारों को सीधा प्रस्ताव भेजें।',
    feature3Btn: 'बाजार खोलें',

    feature4Title: 'सरकारी योजनाएं और सब्सिडी',
    feature4Sub: 'किसान कल्याण योजनाएं और वित्तीय सहायता',
    feature4Desc: 'पीएम-किसान, फसल बीमा जैसी केंद्रीय और राज्य योजनाओं की पात्रता जांचें और आवेदन के चरणबद्ध दिशानिर्देश पाएं।',
    feature4Btn: 'योजनाएं देखें',

    phoneGreeting: 'नमस्ते किसान भाई!',
    phoneSubtitle: 'अपनी फसल की समस्या बोलें या लिखें',
    phoneTapToSpeak: 'बोलने के लिए टैप करें',
    phoneOrType: 'या समस्या यहां लिखें',
    phoneSubmit: 'फसल जांचें',
    phoneHome: 'होम',
    phoneDoctor: 'डॉक्टर',
    phoneFarm: 'खेत',
    phoneMarket: 'बाजार',
  },
};

export const LandingPageExplainer: React.FC<LandingPageExplainerProps> = ({
  currentLang,
  onNavigateTab,
  onScrollToDashboard,
}) => {
  const t = LANDING_TEXT[currentLang] || LANDING_TEXT.en;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', paddingBottom: '32px' }}>
      {/* ===================================================================== */}
      {/* 1. HERO SECTION WITH AUTHENTIC FARMER & INTERACTIVE PHONE MOCKUP     */}
      {/* ===================================================================== */}
      <section style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '24px',
        padding: '36px 32px',
        border: '1px solid var(--ag-border-default)',
        boxShadow: '0 8px 30px rgba(47, 125, 50, 0.06)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '36px',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle decorative background glow */}
        <div style={{
          position: 'absolute',
          top: '-80px',
          left: '-80px',
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(47, 125, 50, 0.08) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none',
        }} />

        {/* Left Column: Headline, Description & CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', zIndex: 1 }}>
          {/* Pill Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--ag-color-primary-light)',
            color: 'var(--ag-color-primary-dark)',
            padding: '6px 14px',
            borderRadius: 'var(--ag-radius-full)',
            fontSize: '12px',
            fontWeight: 800,
            width: 'fit-content',
            border: '1px solid #A3D9A5',
          }}>
            <Sprout size={15} color="var(--ag-color-primary-base)" />
            <span>{t.heroPill}</span>
          </div>

          {/* Big Headline */}
          <div>
            <h1 style={{
              fontSize: '38px',
              fontWeight: 900,
              color: 'var(--ag-color-primary-dark)',
              letterSpacing: '-0.03em',
              margin: '0 0 4px 0',
              lineHeight: 1.15,
            }}>
              {t.heroTitle}
            </h1>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 800,
              color: 'var(--ag-color-text-primary)',
              letterSpacing: '-0.02em',
              margin: 0,
              lineHeight: 1.25,
            }}>
              {t.heroTagline}
            </h2>
          </div>

          {/* Description */}
          <p style={{
            fontSize: '15px',
            color: 'var(--ag-color-text-secondary)',
            lineHeight: 1.6,
            margin: '4px 0 8px 0',
            fontWeight: 500,
          }}>
            {t.heroDesc}
          </p>

          {/* Primary Action Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => onNavigateTab('doctor')}
              style={{
                backgroundColor: 'var(--ag-color-primary-base)',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px 22px',
                borderRadius: 'var(--ag-radius-full)',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(47, 125, 50, 0.28)',
                transition: 'transform 0.15s ease',
              }}
            >
              <Stethoscope size={16} />
              <span>{t.diagnoseProblemBtn}</span>
              <ArrowRight size={16} />
            </button>

            <button
              onClick={() => onNavigateTab('farm')}
              style={{
                backgroundColor: '#FAFBF7',
                color: 'var(--ag-color-text-primary)',
                border: '1px solid var(--ag-border-default)',
                padding: '12px 20px',
                borderRadius: 'var(--ag-radius-full)',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Sprout size={16} color="var(--ag-color-primary-base)" />
              <span>{t.planMyCropBtn}</span>
            </button>

            <button
              onClick={() => onNavigateTab('mandi')}
              style={{
                backgroundColor: '#FAFBF7',
                color: 'var(--ag-color-text-primary)',
                border: '1px solid var(--ag-border-default)',
                padding: '12px 20px',
                borderRadius: 'var(--ag-radius-full)',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Store size={16} color="var(--ag-color-primary-base)" />
              <span>{t.mandiMarketBtn}</span>
            </button>

            <button
              onClick={() => onNavigateTab('money')}
              style={{
                backgroundColor: '#FAFBF7',
                color: 'var(--ag-color-text-primary)',
                border: '1px solid var(--ag-border-default)',
                padding: '12px 20px',
                borderRadius: 'var(--ag-radius-full)',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Landmark size={16} color="var(--ag-color-primary-base)" />
              <span>{t.govtSchemesBtn}</span>
            </button>
          </div>

          {/* Voice & Multilingual Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#FAFBF7',
            border: '1px solid var(--ag-border-default)',
            borderRadius: '12px',
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--ag-color-text-secondary)',
            marginTop: '4px',
            width: 'fit-content',
          }}>
            <span>{t.voiceBadge}</span>
          </div>

          {onScrollToDashboard && (
            <div style={{ marginTop: '8px' }}>
              <button
                onClick={onScrollToDashboard}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--ag-color-primary-base)',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>{t.jumpToDashboard}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Authentic Visual + Floating Mobile Phone Mockup */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          minHeight: '360px',
        }}>
          {/* Authentic Farmer Photo Banner with Rounded Frame */}
          <div style={{
            width: '88%',
            height: '320px',
            borderRadius: '20px',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            border: '2px solid #FFFFFF',
          }}>
            <img 
              src="/farmer_hero_field.jpg" 
              alt="Indian farmer in lush green agricultural field"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }} 
            />
            {/* Gradient Overlay for aesthetic depth */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)',
            }} />
          </div>

          {/* Floating Mobile Phone Mockup (Exactly mirroring user inspiration) */}
          <div style={{
            position: 'absolute',
            right: '0px',
            bottom: '-12px',
            width: '210px',
            backgroundColor: '#1E293B',
            borderRadius: '28px',
            padding: '8px',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.25)',
            border: '3px solid #0F172A',
            zIndex: 2,
          }}>
            {/* Phone Screen Container */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '22px',
              padding: '14px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              overflow: 'hidden',
              minHeight: '270px',
              fontSize: '11px',
            }}>
              {/* Phone Status Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '4px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 800, color: 'var(--ag-color-primary-base)' }}>
                  <Sprout size={12} />
                  <span>AgriGuide</span>
                </div>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#64748B' }}>5G 📶</span>
              </div>

              {/* Phone Content Header */}
              <div style={{ textAlign: 'center', marginTop: '2px' }}>
                <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--ag-color-text-primary)' }}>
                  {t.phoneGreeting}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--ag-color-text-secondary)', marginTop: '2px' }}>
                  {t.phoneSubtitle}
                </div>
              </div>

              {/* Big Voice Microphone Button inside Phone */}
              <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
                <button
                  type="button"
                  onClick={() => onNavigateTab('doctor')}
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--ag-color-primary-base)',
                    color: '#FFFFFF',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(47, 125, 50, 0.35)',
                    cursor: 'pointer',
                  }}
                  title="Tap to speak"
                >
                  <Mic size={24} />
                </button>
              </div>

              <div style={{ textAlign: 'center', fontSize: '9px', fontWeight: 700, color: 'var(--ag-color-primary-dark)' }}>
                {t.phoneTapToSpeak}
              </div>

              {/* Mock Input Bar */}
              <div style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '6px 8px',
                fontSize: '9px',
                color: '#94A3B8',
              }}>
                {t.phoneOrType}
              </div>

              {/* Submit CTA */}
              <button
                type="button"
                onClick={() => onNavigateTab('doctor')}
                style={{
                  backgroundColor: 'var(--ag-color-primary-base)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px',
                  fontSize: '10px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {t.phoneSubmit}
              </button>

              {/* Mini Bottom Nav */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-around',
                paddingTop: '6px',
                borderTop: '1px solid #F1F5F9',
                marginTop: 'auto',
                fontSize: '8px',
                fontWeight: 700,
                color: '#64748B',
              }}>
                <span style={{ color: 'var(--ag-color-primary-base)' }}>🏠 {t.phoneHome}</span>
                <span>🩺 {t.phoneDoctor}</span>
                <span>🌾 {t.phoneFarm}</span>
                <span>🏪 {t.phoneMarket}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 2. OUR WORKFLOW (4 SIMPLE VERIFIED STEPS)                            */}
      {/* ===================================================================== */}
      <section style={{ textAlign: 'center' }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: 900,
          color: 'var(--ag-color-text-primary)',
          letterSpacing: '-0.02em',
          margin: '0 0 6px 0',
        }}>
          {t.workflowTitle}
        </h2>
        <p style={{
          fontSize: '14px',
          color: 'var(--ag-color-text-secondary)',
          margin: '0 auto 28px auto',
          maxWidth: '600px',
          fontWeight: 500,
        }}>
          {t.workflowSubtitle}
        </p>

        {/* 4 Connected Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '18px',
          alignItems: 'stretch',
        }}>
          {/* Step 1 */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--ag-border-default)',
            borderRadius: '20px',
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            boxShadow: 'var(--ag-shadow-card)',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '16px',
              fontSize: '11px',
              fontWeight: 900,
              color: 'var(--ag-color-text-secondary)',
              backgroundColor: '#F3F4F6',
              padding: '2px 8px',
              borderRadius: 'var(--ag-radius-full)',
            }}>
              1
            </div>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--ag-color-primary-light)',
              color: 'var(--ag-color-primary-base)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px',
            }}>
              <Mic size={26} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--ag-color-text-primary)' }}>
              {t.step1Title}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
              {t.step1Desc}
            </p>
          </div>

          {/* Step 2 */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--ag-border-default)',
            borderRadius: '20px',
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            boxShadow: 'var(--ag-shadow-card)',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '16px',
              fontSize: '11px',
              fontWeight: 900,
              color: 'var(--ag-color-text-secondary)',
              backgroundColor: '#F3F4F6',
              padding: '2px 8px',
              borderRadius: 'var(--ag-radius-full)',
            }}>
              2
            </div>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--ag-color-harvest-light)',
              color: 'var(--ag-color-warning-base)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px',
            }}>
              <Sparkles size={26} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--ag-color-text-primary)' }}>
              {t.step2Title}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
              {t.step2Desc}
            </p>
          </div>

          {/* Step 3 */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--ag-border-default)',
            borderRadius: '20px',
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            boxShadow: 'var(--ag-shadow-card)',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '16px',
              fontSize: '11px',
              fontWeight: 900,
              color: 'var(--ag-color-text-secondary)',
              backgroundColor: '#F3F4F6',
              padding: '2px 8px',
              borderRadius: 'var(--ag-radius-full)',
            }}>
              3
            </div>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#E0F2FE',
              color: '#0284C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px',
            }}>
              <ShieldCheck size={26} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--ag-color-text-primary)' }}>
              {t.step3Title}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
              {t.step3Desc}
            </p>
          </div>

          {/* Step 4 */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--ag-border-default)',
            borderRadius: '20px',
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            boxShadow: 'var(--ag-shadow-card)',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '16px',
              fontSize: '11px',
              fontWeight: 900,
              color: 'var(--ag-color-text-secondary)',
              backgroundColor: '#F3F4F6',
              padding: '2px 8px',
              borderRadius: 'var(--ag-radius-full)',
            }}>
              4
            </div>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--ag-color-primary-light)',
              color: 'var(--ag-color-primary-base)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px',
            }}>
              <TrendingUp size={26} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--ag-color-text-primary)' }}>
              {t.step4Title}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
              {t.step4Desc}
            </p>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 3. WHY WE ARE BETTER COMPARED TO TRADITIONAL METHODS                  */}
      {/* ===================================================================== */}
      <section style={{ textAlign: 'center' }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: 900,
          color: 'var(--ag-color-text-primary)',
          letterSpacing: '-0.02em',
          margin: '0 0 6px 0',
        }}>
          {t.comparisonTitle}
        </h2>
        <p style={{
          fontSize: '14px',
          color: 'var(--ag-color-text-secondary)',
          margin: '0 auto 28px auto',
          maxWidth: '640px',
          fontWeight: 500,
        }}>
          {t.comparisonSubtitle}
        </p>

        {/* Comparison Grid with Farmer Image */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          alignItems: 'stretch',
        }}>
          {/* Traditional Method Box */}
          <div style={{
            backgroundColor: '#FFFBFB',
            border: '1px solid #FECDD3',
            borderRadius: '20px',
            padding: '28px 24px',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#DC2626', fontWeight: 800, fontSize: '16px' }}>
              <XCircle size={20} />
              <span>{t.traditionalTitle}</span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: 'var(--ag-color-text-primary)', lineHeight: 1.4 }}>
                <span style={{ color: '#DC2626', fontWeight: 800 }}>✕</span>
                <span>{t.traditional1}</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: 'var(--ag-color-text-primary)', lineHeight: 1.4 }}>
                <span style={{ color: '#DC2626', fontWeight: 800 }}>✕</span>
                <span>{t.traditional2}</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: 'var(--ag-color-text-primary)', lineHeight: 1.4 }}>
                <span style={{ color: '#DC2626', fontWeight: 800 }}>✕</span>
                <span>{t.traditional3}</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: 'var(--ag-color-text-primary)', lineHeight: 1.4 }}>
                <span style={{ color: '#DC2626', fontWeight: 800 }}>✕</span>
                <span>{t.traditional4}</span>
              </li>
            </ul>
          </div>

          {/* AgriGuide Platform Box */}
          <div style={{
            backgroundColor: '#F0FDF4',
            border: '2px solid #86EFAC',
            borderRadius: '20px',
            padding: '28px 24px',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 8px 24px rgba(34, 197, 94, 0.12)',
            position: 'relative',
          }}>
            {/* VS Badge Floating on Left Edge on wide screens */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--ag-color-primary-dark)',
              fontWeight: 900,
              fontSize: '17px',
            }}>
              <Sprout size={20} color="var(--ag-color-primary-base)" />
              <span>{t.agriGuideTitle}</span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: 'var(--ag-color-text-primary)', lineHeight: 1.4, fontWeight: 600 }}>
                <CheckCircle2 size={16} color="var(--ag-color-primary-base)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{t.agriGuide1}</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: 'var(--ag-color-text-primary)', lineHeight: 1.4, fontWeight: 600 }}>
                <CheckCircle2 size={16} color="var(--ag-color-primary-base)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{t.agriGuide2}</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: 'var(--ag-color-text-primary)', lineHeight: 1.4, fontWeight: 600 }}>
                <CheckCircle2 size={16} color="var(--ag-color-primary-base)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{t.agriGuide3}</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: 'var(--ag-color-text-primary)', lineHeight: 1.4, fontWeight: 600 }}>
                <CheckCircle2 size={16} color="var(--ag-color-primary-base)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{t.agriGuide4}</span>
              </li>
            </ul>
          </div>

          {/* Third Column: Real Farmer With Smartphone Photo */}
          <div style={{
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            border: '1px solid var(--ag-border-default)',
            minHeight: '280px',
            position: 'relative',
          }}>
            <img 
              src="/farmer_phone_field.jpg" 
              alt="Indian farmer in paddy field with smartphone"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }} 
            />
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 4. COMPREHENSIVE SITE FEATURE EXPLORER                                */}
      {/* ===================================================================== */}
      <section style={{ textAlign: 'center' }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: 900,
          color: 'var(--ag-color-text-primary)',
          letterSpacing: '-0.02em',
          margin: '0 0 6px 0',
        }}>
          {t.featuresTitle}
        </h2>
        <p style={{
          fontSize: '14px',
          color: 'var(--ag-color-text-secondary)',
          margin: '0 auto 28px auto',
          maxWidth: '600px',
          fontWeight: 500,
        }}>
          {t.featuresSubtitle}
        </p>

        {/* 4 Interactive Feature Pillars */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
          textAlign: 'left',
        }}>
          {/* Feature 1: Crop Doctor */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid var(--ag-border-default)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--ag-shadow-card)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}>
            <div>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'var(--ag-color-primary-light)',
                color: 'var(--ag-color-primary-base)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
              }}>
                <Stethoscope size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--ag-color-text-primary)' }}>
                {t.feature1Title}
              </h3>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ag-color-primary-base)', textTransform: 'uppercase', marginBottom: '8px' }}>
                {t.feature1Sub}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                {t.feature1Desc}
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('doctor')}
              style={{
                width: '100%',
                backgroundColor: 'var(--ag-color-primary-light)',
                color: 'var(--ag-color-primary-dark)',
                border: '1px solid #A3D9A5',
                padding: '10px 16px',
                borderRadius: 'var(--ag-radius-md)',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <span>{t.feature1Btn}</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Feature 2: My Farm & Planner */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid var(--ag-border-default)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--ag-shadow-card)',
          }}>
            <div>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: '#ECFDF5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
              }}>
                <Sprout size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--ag-color-text-primary)' }}>
                {t.feature2Title}
              </h3>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', marginBottom: '8px' }}>
                {t.feature2Sub}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                {t.feature2Desc}
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('farm')}
              style={{
                width: '100%',
                backgroundColor: '#ECFDF5',
                color: '#065F46',
                border: '1px solid #A7F3D0',
                padding: '10px 16px',
                borderRadius: 'var(--ag-radius-md)',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <span>{t.feature2Btn}</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Feature 3: Mandi Marketplace */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid var(--ag-border-default)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--ag-shadow-card)',
          }}>
            <div>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'var(--ag-color-harvest-light)',
                color: 'var(--ag-color-warning-base)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
              }}>
                <Store size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--ag-color-text-primary)' }}>
                {t.feature3Title}
              </h3>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ag-color-warning-base)', textTransform: 'uppercase', marginBottom: '8px' }}>
                {t.feature3Sub}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                {t.feature3Desc}
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('mandi')}
              style={{
                width: '100%',
                backgroundColor: 'var(--ag-color-harvest-light)',
                color: '#92400E',
                border: '1px solid #FDE68A',
                padding: '10px 16px',
                borderRadius: 'var(--ag-radius-md)',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <span>{t.feature3Btn}</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Feature 4: Government Schemes */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid var(--ag-border-default)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--ag-shadow-card)',
          }}>
            <div>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
              }}>
                <Landmark size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--ag-color-text-primary)' }}>
                {t.feature4Title}
              </h3>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', marginBottom: '8px' }}>
                {t.feature4Sub}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                {t.feature4Desc}
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('money')}
              style={{
                width: '100%',
                backgroundColor: '#EFF6FF',
                color: '#1E40AF',
                border: '1px solid #BFDBFE',
                padding: '10px 16px',
                borderRadius: 'var(--ag-radius-md)',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <span>{t.feature4Btn}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
