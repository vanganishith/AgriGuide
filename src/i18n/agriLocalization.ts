import type { TodayDecision, WeatherData, AlertNotification, Language } from '../types';

export const CROP_NAMES: Record<string, Record<Language, string>> = {
  cotton: { en: 'Cotton', te: 'పత్తి', hi: 'कपास' },
  maize: { en: 'Maize', te: 'మొక్కజొన్న', hi: 'मक्का' },
  chilli: { en: 'Chilli', te: 'మిరప', hi: 'मिर्च' },
  chili: { en: 'Chilli', te: 'మిరప', hi: 'मिर्च' },
  paddy: { en: 'Paddy', te: 'వరి', hi: 'धान' },
  rice: { en: 'Rice', te: 'వరి', hi: 'चावल' },
  tomato: { en: 'Tomato', te: 'టమాటా', hi: 'टमाटर' },
  wheat: { en: 'Wheat', te: 'గోధుమ', hi: 'गेहूं' },
  groundnut: { en: 'Groundnut', te: 'వేరుశనగ', hi: 'मूंगफली' },
  soybean: { en: 'Soybean', te: 'సోయాబీన్', hi: 'सोयाबीन' },
  redgram: { en: 'Red Gram', te: 'కంది', hi: 'अरहर' },
  'red gram': { en: 'Red Gram', te: 'కంది', hi: 'अरहर' },
  tur: { en: 'Tur (Red Gram)', te: 'కంది', hi: 'अरहर / तूर' },
  arhar: { en: 'Arhar (Red Gram)', te: 'కంది', hi: 'अरहर' },
  bengalgram: { en: 'Bengal Gram', te: 'శనగలు', hi: 'चना' },
};

export const DISTRICT_TRANSLATIONS: Record<string, Record<Language, string>> = {
  'medchal-malkajgiri': { en: 'Medchal–Malkajgiri', te: 'మేడ్చల్–మల్కాజిగిరి', hi: 'मेडचल-मलकाजगिरी' },
  'medchal–malkajgiri': { en: 'Medchal–Malkajgiri', te: 'మేడ్చల్–మల్కాజిగిరి', hi: 'मेडचल-मलकाजगिरी' },
  'medchal malkajgiri': { en: 'Medchal–Malkajgiri', te: 'మేడ్చల్–మల్కాజిగిరి', hi: 'मेडचल-मलकाजगिरी' },
  'medchal': { en: 'Medchal', te: 'మేడ్చల్', hi: 'मेडचल' },
  'malkajgiri': { en: 'Malkajgiri', te: 'మల్కాజిగిరి', hi: 'मलकाजगिरी' },
  'warangal': { en: 'Warangal', te: 'వరంగల్', hi: 'वारंगल' },
  'warangal urban': { en: 'Warangal Urban', te: 'వరంగల్ అర్బన్', hi: 'वारंगल शहरी' },
  'warangal rural': { en: 'Warangal Rural', te: 'వరంగల్ రూరల్', hi: 'वारंगल ग्रामीण' },
  'hanamkonda': { en: 'Hanamkonda', te: 'హనుమకొండ', hi: 'हनमकोंडा' },
  'ranga reddy': { en: 'Ranga Reddy', te: 'రంగారెడ్డి', hi: 'रंगारेड्डी' },
  'rangareddy': { en: 'Ranga Reddy', te: 'రంగారెడ్డి', hi: 'रंगारेड्डी' },
  'hyderabad': { en: 'Hyderabad', te: 'హైదరాబాద్', hi: 'हैदराबाद' },
  'karimnagar': { en: 'Karimnagar', te: 'కరీంనగర్', hi: 'करीमनगर' },
  'khammam': { en: 'Khammam', te: 'ఖమ్మం', hi: 'खम्मम' },
  'nalgonda': { en: 'Nalgonda', te: 'నల్గొండ', hi: 'नलगोंडा' },
  'nizamabad': { en: 'Nizamabad', te: 'నిజామాబాద్', hi: 'निजामाबाद' },
  'mahabubnagar': { en: 'Mahabubnagar', te: 'మహబూబ్‌నగర్', hi: 'महबूबनगर' },
  'mahbubnagar': { en: 'Mahbubnagar', te: 'మహబూబ్‌నగర్', hi: 'महबूबनगर' },
  'sangareddy': { en: 'Sangareddy', te: 'సంగారెడ్డి', hi: 'संगारेड्डी' },
  'siddipet': { en: 'Siddipet', te: 'సిద్దిపేట', hi: 'सिद्दिपेट' },
  'suryapet': { en: 'Suryapet', te: 'సూర్యాపేట', hi: 'सूर्यापेट' },
  'vikarabad': { en: 'Vikarabad', te: 'వికారాబాద్', hi: 'विकाराबाद' },
  'wanaparthy': { en: 'Wanaparthy', te: 'వనపర్తి', hi: 'वनपर्थी' },
  'yadadri bhuvanagiri': { en: 'Yadadri Bhuvanagiri', te: 'యాదాద్రి భువనగిరి', hi: 'यादाद्री भुवनगिरी' },
  'yadadri': { en: 'Yadadri', te: 'యాదాద్రి', hi: 'यादाद्री' },
  'ad性のbad': { en: 'Adilabad', te: 'ఆదిలాబాద్', hi: 'आदिलाबाद' },
  'adilabad': { en: 'Adilabad', te: 'ఆదిలాబాద్', hi: 'आदिलाबाद' },
  'bhadradri kothagudem': { en: 'Bhadradri Kothagudem', te: 'భద్రాద్రి కొత్తగూడెం', hi: 'भद्राद्री कोठागुडेम' },
  'jagtial': { en: 'Jagtial', te: 'జగిత్యాల', hi: 'जगित्याल' },
  'jangaon': { en: 'Jangaon', te: 'జనగామ', hi: 'जनगांव' },
  'jayashankar bhupalpally': { en: 'Jayashankar Bhupalpally', te: 'జయశంకర్ భూపాలపల్లి', hi: 'जयशंकर भूपालपल्ली' },
  'jogulamba gadwal': { en: 'Jogulamba Gadwal', te: 'జోగులాంబ గద్వాల', hi: 'जोगुलाम्बा गडवाल' },
  'kamareddy': { en: 'Kamareddy', te: 'కామారెడ్డి', hi: 'कामारेड्डी' },
  'kumuram bheem asifabad': { en: 'Kumuram Bheem Asifabad', te: 'కొమరం భీమ్ ఆసిఫాబాద్', hi: 'कुमुरम भीम आसिफाबाद' },
  'mahabubabad': { en: 'Mahabubabad', te: 'మహబూబాబాద్', hi: 'महबूबाबाद' },
  'mancherial': { en: 'Mancherial', te: 'మంచిర్యాల', hi: 'मंचिरियाल' },
  'medak': { en: 'Medak', te: 'మెదక్', hi: 'मेडक' },
  'mulugu': { en: 'Mulugu', te: 'ములుగు', hi: 'मुलुगु' },
  'nagarkurnool': { en: 'Nagarkurnool', te: 'నాగర్‌కర్నూల్', hi: 'नागरकुरनूल' },
  'narayanpet': { en: 'Narayanpet', te: 'నారాయణపేట', hi: 'नारायणपेट' },
  'nirmal': { en: 'Nirmal', te: 'నిర్మల్', hi: 'निर्मल' },
  'peddapalli': { en: 'Peddapalli', te: 'పెద్దపల్లి', hi: 'पेद्दापल्ली' },
  'rajanna sircilla': { en: 'Rajanna Sircilla', te: 'రాజన్న సిరిసిల్ల', hi: 'राजन्ना सिरसिल्ला' },
  'nandyal': { en: 'Nandyal', te: 'నంద్యాల', hi: 'नंद्याल' },
  'nandyala': { en: 'Nandyala', te: 'నంద్యాల', hi: 'नंद्याल' },
  'kurnool': { en: 'Kurnool', te: 'కర్నూలు', hi: 'कर्नूल' },
  'guntur': { en: 'Guntur', te: 'గుంటూరు', hi: 'गुंटूर' },
  'krishna': { en: 'Krishna', te: 'కృష్ణా', hi: 'कृष्णा' },
  'visakhapatnam': { en: 'Visakhapatnam', te: 'విశాఖపట్నం', hi: 'विशाखापट्टनम' },
  'anantapur': { en: 'Anantapur', te: 'అనంతపురం', hi: 'अनंतपुर' },
  'chittoor': { en: 'Chittoor', te: 'చిత్తూరు', hi: 'चित्तूर' },
  'nellore': { en: 'Nellore', te: 'నెల్లూరు', hi: 'नेल्लोर' },
  'prakasam': { en: 'Prakasam', te: 'ప్రకాశం', hi: 'प्रकाशम' },
  'kadapa': { en: 'Kadapa', te: 'కడప', hi: 'कडपा' },
  'srikakulam': { en: 'Srikakulam', te: 'శ్రీకాకుళం', hi: 'श्रीकाकुलम' },
  'vizianagaram': { en: 'Vizianagaram', te: 'విజయనగరం', hi: 'विजयनगरम' },
  'east godavari': { en: 'East Godavari', te: 'తూర్పు గోదావరి', hi: 'पूर्वी गोदावरी' },
  'west godavari': { en: 'West Godavari', te: 'పశ్చిమ గోదావరి', hi: 'पश्चिमी गोदावरी' },
};

export const STATE_TRANSLATIONS: Record<string, Record<Language, string>> = {
  'telangana': { en: 'Telangana', te: 'తెలంగాణ', hi: 'तेलंगाना' },
  'andhra pradesh': { en: 'Andhra Pradesh', te: 'ఆంధ్రప్రదేశ్', hi: 'आंध्र प्रदेश' },
  'karnataka': { en: 'Karnataka', te: 'కర్ణాటక', hi: 'कर्नाटक' },
  'maharashtra': { en: 'Maharashtra', te: 'మహారాష్ట్ర', hi: 'महाराष्ट्र' },
  'tamil nadu': { en: 'Tamil Nadu', te: 'తమిళనాడు', hi: 'तमिलनाडु' },
  'india': { en: 'India', te: 'భారతదేశం', hi: 'भारत' },
};

export function localizeDistrict(district?: string, lang: Language = 'en'): string {
  if (!district || lang === 'en') return district || '';
  const key = district.toLowerCase().trim();
  return DISTRICT_TRANSLATIONS[key]?.[lang] || district;
}

export function localizeState(state?: string, lang: Language = 'en'): string {
  if (!state || lang === 'en') return state || '';
  const key = state.toLowerCase().trim();
  return STATE_TRANSLATIONS[key]?.[lang] || state;
}

export function localizeLocation(
  district?: string, 
  state?: string, 
  lang: Language = 'en', 
  village?: string
): string {
  if (!district && !state) return '';
  const d = localizeDistrict(district, lang);
  const s = localizeState(state, lang);
  const v = village ? `${village}, ` : '';
  if (d && s) return `${v}${d}, ${s}`;
  return `${v}${d || s}`;
}

export function localizeLocationString(locStr: string, lang: Language): string {
  if (!locStr || lang === 'en') return locStr;
  let res = locStr;

  // Replace all states
  for (const [stateKey, translations] of Object.entries(STATE_TRANSLATIONS)) {
    const regex = new RegExp(stateKey, 'gi');
    res = res.replace(regex, translations[lang]);
  }

  // Replace all districts
  for (const [distKey, translations] of Object.entries(DISTRICT_TRANSLATIONS)) {
    const regex = new RegExp(distKey, 'gi');
    res = res.replace(regex, translations[lang]);
  }

  return res;
}

export function localizeCropName(name: string, lang: Language): string {
  if (!name || lang === 'en') return name;
  const key = name.toLowerCase().trim();
  for (const [cropKey, translations] of Object.entries(CROP_NAMES)) {
    if (key.includes(cropKey)) {
      return translations[lang] || name;
    }
  }
  return name;
}

export function localizeCropTarget(target: string, lang: Language): string {
  if (!target || lang === 'en') return target;

  let result = target;
  // Translate crop names
  for (const [cropKey, translations] of Object.entries(CROP_NAMES)) {
    const regex = new RegExp(`\\b${cropKey}\\b`, 'gi');
    result = result.replace(regex, translations[lang]);
  }

  if (lang === 'te') {
    result = result
      .replace(/Farm Plots/gi, 'పొలం ప్లాట్లు')
      .replace(/Field/gi, 'చేను')
      .replace(/Ready Harvest/gi, 'కోతకు సిద్ధమైన పంట')
      .replace(/\bAcres\b/gi, 'ఎకరాలు')
      .replace(/\bAcre\b/gi, 'ఎకరం')
      .replace(/\band\b/gi, 'మరియు')
      .replace(/&/g, '&');
  } else if (lang === 'hi') {
    result = result
      .replace(/Farm Plots/gi, 'खेत के प्लॉट')
      .replace(/Field/gi, 'खेत')
      .replace(/Ready Harvest/gi, 'तैयार फसल')
      .replace(/\bAcres\b/gi, 'एकड़')
      .replace(/\bAcre\b/gi, 'एकड़')
      .replace(/\band\b/gi, 'और')
      .replace(/&/g, '&');
  }

  return result;
}

export function localizeSoil(soil?: string, lang: Language = 'en'): string {
  if (!soil || lang === 'en') return soil || '';
  const s = soil.toLowerCase();
  if (lang === 'te') {
    if (s.includes('red loamy') || s.includes('red')) return 'ఎర్ర నేల';
    if (s.includes('black')) return 'నల్ల రేగడి నేల';
    if (s.includes('clay')) return 'బంక మట్టి నేల';
    if (s.includes('sandy')) return 'ఇసుక నేల';
    if (s.includes('alluvial')) return 'వండలి నేల';
    return soil;
  }
  if (lang === 'hi') {
    if (s.includes('red loamy') || s.includes('red')) return 'लाल दोमट मिट्टी';
    if (s.includes('black')) return 'काली मिट्टी';
    if (s.includes('clay')) return 'चिकनी मिट्टी';
    if (s.includes('sandy')) return 'बलुई मिट्टी';
    if (s.includes('alluvial')) return 'जलोढ़ मिट्टी';
    return soil;
  }
  return soil;
}

export function localizeIrrigation(irr?: string, lang: Language = 'en'): string {
  if (!irr || lang === 'en') return irr || '';
  const i = irr.toLowerCase();
  if (lang === 'te') {
    if (i.includes('borewell') && i.includes('drip')) return 'బోరుబావి & బిందు సేద్యం (డ్రిప్)';
    if (i.includes('borewell')) return 'బోరుబావి';
    if (i.includes('drip')) return 'బిందు సేద్యం (డ్రిప్)';
    if (i.includes('canal')) return 'కాలువ నీరు';
    if (i.includes('sprinkler')) return 'తుంపర సేద్యం (స్ప్రింక్లర్)';
    if (i.includes('rainfed')) return 'వర్షాధారం';
    return irr;
  }
  if (lang === 'hi') {
    if (i.includes('borewell') && i.includes('drip')) return 'बोरवेल और ड्रिप';
    if (i.includes('borewell')) return 'बोरवेल';
    if (i.includes('drip')) return 'ड्रिप सिंचाई';
    if (i.includes('canal')) return 'नहर सिंचाई';
    if (i.includes('sprinkler')) return 'स्प्रिंकलर';
    if (i.includes('rainfed')) return 'वर्षा आधारित';
    return irr;
  }
  return irr;
}

export function localizeStage(stage?: string, lang: Language = 'en'): string {
  if (!stage || lang === 'en') return stage || '';
  const st = stage.toLowerCase();
  if (lang === 'te') {
    if (st.includes('nursery') || st.includes('transplanting')) return 'నారుమడి & నాట్లు వేసే దశ';
    if (st.includes('germination') || st.includes('seedling')) return 'మొలక & నారు దశ';
    if (st.includes('planned') || st.includes('sowing')) return 'ప్రణాళిక / విత్తే దశ';
    if (st.includes('vegetative')) return 'శాఖీయ ఎదుగుదల దశ';
    if (st.includes('flowering')) return 'పూత దశ';
    if (st.includes('boll') || st.includes('fruit')) return 'కాయ తయారయ్యే దశ';
    if (st.includes('harvest') || st.includes('maturity')) return 'పక్వత / కోత దశ';
    return stage;
  }
  if (lang === 'hi') {
    if (st.includes('nursery') || st.includes('transplanting')) return 'नर्सरी और रोपाई चरण';
    if (st.includes('germination') || st.includes('seedling')) return 'अंकुरण और पौधा अवस्था';
    if (st.includes('planned') || st.includes('sowing')) return 'योजना / बुवाई चरण';
    if (st.includes('vegetative')) return 'वानस्पतिक अवस्था';
    if (st.includes('flowering')) return 'फूल आने की अवस्था';
    if (st.includes('boll') || st.includes('fruit')) return 'फल / टिंडे बनने की अवस्था';
    if (st.includes('harvest') || st.includes('maturity')) return 'कटाई चरण';
    return stage;
  }
  return stage;
}

export function localizeTask(task?: string, lang: Language = 'en'): string {
  if (!task || lang === 'en') return task || '';
  const t = task.toLowerCase();
  if (lang === 'te') {
    if (t.includes('check seedling vigor in nursery') || t.includes('shallow standing water')) return 'నారుమడిలో మొక్కల ఎదుగుదల & నిల్వ నీటిని (2 సెం.మీ) తనిఖీ చేయండి';
    if (t.includes('drip irrigation scheduling') || t.includes('filter check')) return 'బిందు సేద్యం (డ్రిప్) సమయపాలన & ఫిల్టర్ శుభ్రత తనిఖీ';
    if (t.includes('basal dose') || t.includes('seedling root booster')) return 'ప్రాథమిక ఎరువుల మోతాదు / వేరు వ్యవస్థ బలోపేతం';
    if (t.includes('favorable weather') || t.includes('optimal field day')) return 'అనుకూల వాతావరణం: క్షేత్ర పనులకు ఉత్తమ రోజు';
    if (t.includes('rain alert') || t.includes('protect harvested')) return 'వర్ష సూచన: కోసిన పంటను & ఎరువులను భద్రపరచండి';
    if (t.includes('extreme temperature') || t.includes('restrict afternoon')) return 'అధిక ఉష్ణోగ్రత హెచ్చరిక: మధ్యాహ్న క్షేత్ర పనులను పరిమితం చేయండి';
    if (t.includes('inspect seed germination') || t.includes('stand establishment')) return 'విత్తన మొలక శాతం & మొక్కల సాంద్రతను తనిఖీ చేయండి';
    if (t.includes('monitor seedling survival') || t.includes('gap filling')) return 'నాటిన మొక్కల నిలదొక్కుకోవడం & గ్యాప్ ఫిల్లింగ్ (ఖాళీల భర్తీ) పరిశీలన';
    if (t.includes('sucking pest') || t.includes('thrips') || t.includes('jassid')) return 'తొలి దశ రసం పీల్చే పురుగులు (తామర పురుగులు & పచ్చదోమ) పరిశీలన';
    if (t.includes('fall armyworm') || t.includes('faw')) return 'కత్తెర పురుగు (ఫాల్ ఆర్మీవార్మ్) సుడి ఆకుల నష్టం పరిశీలన';
    if (t.includes('tillering') || t.includes('stem borer') || t.includes('dead heart')) return 'వరి పిలకలు & కాండం తొలుచు పురుగు (ఎండిన మొవ్వులు) పరిశీలన';
    if (t.includes('first split nitrogen') || t.includes('first nitrogen')) return 'మొదటి విడత నత్రజని (యూరియా) ఎరువు & కలుపు తీత';
    if (t.includes('micronutrient') || t.includes('zinc') || t.includes('boron')) return 'సూక్ష్మ పోషకాల పిచికారీ (జింక్ & బోరాన్)';
    if (t.includes('potassium') || t.includes('boll/grain')) return 'పొటాష్ ఎరువుల మోతాదు & కాయ/గింజ పోషణ';
    if (t.includes('plot irrigation') || t.includes('border bund')) return 'పొలం నీటి తడి & గట్ల పటిష్టత తనిఖీ';
    if (t.includes('remedial dose') || t.includes('catch-up')) return '⚠️ నష్టనివారణ ఎరువుల మోతాదు (గత 2-3 రోజుల బకాయి పని)';
    if (t.includes('water deficit') || t.includes('overdue irrigation')) return '⚠️ నీటి ఎద్దడి నివారణ (బకాయి నీటి తడి)';
    if (t.includes('weather advisory update pending')) return 'వాతావరణ సూచన నవీకరణ వేచి ఉంది';
    if (t.includes('breezy') || t.includes('staking')) return 'గాలి తీవ్రత: మొక్కల కర్రల ఆసరా & బందోబస్తు తనిఖీ';
    if (t.includes('pest monitoring') || t.includes('trapping')) return 'తెగుళ్ల పర్యవేక్షణ & ఉచ్చులు';
    if (t.includes('balanced fertilization')) return 'సమతుల్య ఎరువుల యాజమాన్యం';
    if (t.includes('foliar') || t.includes('nutrient')) return 'ఆకులపై పోషక పిచికారీ';
    if (t.includes('drain') || t.includes('drainage')) return 'మురుగు నీటి కాలువల నిర్వహణ';
    if (t.includes('scouting') || t.includes('inspection')) return 'సాధారణ క్షేత్ర పరిశీలన';
    if (t.includes('weed')) return 'కలుపు యాజమాన్యం';
    return task;
  }
  if (lang === 'hi') {
    if (t.includes('check seedling vigor in nursery') || t.includes('shallow standing water')) return 'नर्सरी में पौधों की वृद्धि और हल्के पानी (2 सेमी) की जांच करें';
    if (t.includes('drip irrigation scheduling') || t.includes('filter check')) return 'ड्रिप सिंचाई शेड्यूलिंग और फिल्टर की सफाई';
    if (t.includes('basal dose') || t.includes('seedling root booster')) return 'शुरुआती उर्वरक खुराक / जड़ों का विकास';
    if (t.includes('favorable weather') || t.includes('optimal field day')) return 'अनुकूल मौसम: खेत के कार्यों के लिए उत्तम दिन';
    if (t.includes('rain alert') || t.includes('protect harvested')) return 'बारिश की चेतावनी: कटी हुई फसल और खादों को सुरक्षित करें';
    if (t.includes('extreme temperature') || t.includes('restrict afternoon')) return 'अत्यधिक तापमान चेतावनी: दोपहर में धूप में काम से बचें';
    if (t.includes('inspect seed germination') || t.includes('stand establishment')) return 'बीज अंकुरण और पौधों की संख्या की जांच करें';
    if (t.includes('monitor seedling survival') || t.includes('gap filling')) return 'रोपे गए पौधों के जीवित रहने और रिक्त स्थान भरने की निगरानी';
    if (t.includes('sucking pest') || t.includes('thrips') || t.includes('jassid')) return 'प्रारंभिक रस चूसक कीटों (थ्रिप्स और जैसिड) की निगरानी';
    if (t.includes('fall armyworm') || t.includes('faw')) return 'फॉल आर्मीवॉर्म (सैनिक कीट) के नुकसान की निगरानी';
    if (t.includes('tillering') || t.includes('stem borer') || t.includes('dead heart')) return 'कल्ले फूटना और तना छेदक के सूखे प्रकोप की जांच';
    if (t.includes('first split nitrogen') || t.includes('first nitrogen')) return 'पहली यूरिया खुराक और खरपतवार नियंत्रण';
    if (t.includes('micronutrient') || t.includes('zinc') || t.includes('boron')) return 'सूक्ष्म पोषक तत्वों का छिड़काव (जिंक और बोरॉन)';
    if (t.includes('potassium') || t.includes('boll/grain')) return 'पोटाश की खुराक और दाना/फल भराव';
    if (t.includes('plot irrigation') || t.includes('border bund')) return 'खेत में सिंचाई और मेड़ों की मजबूती की जांच';
    if (t.includes('remedial dose') || t.includes('catch-up')) return '⚠️ सुधारात्मक खाद खुराक (पिछले 2-3 दिनों का अधूरा कार्य)';
    if (t.includes('water deficit') || t.includes('overdue irrigation')) return '⚠️ जल संकट निवारण (बकाया सिंचाई)';
    if (t.includes('weather advisory update pending')) return 'मौसम सलाह अपडेट लंबित';
    if (t.includes('breezy') || t.includes('staking')) return 'हवा की गति: पौधों के सहारे और मेड़ों की जांच';
    if (t.includes('pest monitoring') || t.includes('trapping')) return 'कीट निगरानी और ट्रैप';
    if (t.includes('balanced fertilization')) return 'संतुलित खाद प्रबंधन';
    if (t.includes('foliar') || t.includes('nutrient')) return 'पोषक तत्वों का छिड़काव';
    if (t.includes('drain') || t.includes('drainage')) return 'जल निकासी प्रबंधन';
    if (t.includes('scouting') || t.includes('inspection')) return 'नियमित खेत निरीक्षण';
    if (t.includes('weed')) return 'खरपतवार प्रबंधन';
    return task;
  }
  return task;
}

export function localizeDescription(desc?: string, lang: Language = 'en'): string {
  if (!desc || lang === 'en') return desc || '';
  const d = desc.toLowerCase();
  if (lang === 'te') {
    if (d.includes('verify root development and maintain 2cm shallow water')) {
      return desc.replace(/Verify root development and maintain 2cm shallow water level in ([\d.]+) acres\./i, '$1 ఎకరాల్లో వేర్లు సరిగ్గా పారేలా చూసి 2 సెం.మీ నిల్వ నీటి మట్టాన్ని నిర్వహించండి.');
    }
    if (d.includes('operate drip system for 2 hours')) {
      return 'డ్రిప్ విధానాన్ని 2 గంటల పాటు నడపండి. సమానమైన నీటి ఒత్తిడి కోసం స్క్రీన్/డిస్క్ ఫిల్టర్లను బ్యాక్‌వాష్ చేయండి.';
    }
    if (d.includes('fertigate 19:19:19 water-soluble')) {
      return 'వేరు వ్యవస్థ త్వరితగతిన విస్తరించడానికి 19:19:19 నీటిలో కరిగే ఎరువును ఎకరానికి 2.5 కేజీలు డ్రిప్ ద్వారా అందించండి.';
    }
    if (d.includes('calm winds and optimal temperature')) {
      return 'శాంతమైన గాలి మరియు అనుకూల ఉష్ణోగ్రత. పంట పరిశీలన, ఎరువుల యాజమాన్యం మరియు క్షేత్ర పనులకు సరైన సమయం.';
    }
    if (d.includes('irrigate alternate furrows')) {
      return desc.replace(/Irrigate alternate furrows across ([\d.]+) acres to save 30% water while maintaining root zone field capacity\./i, '$1 ఎకరాల్లో సాలు విడిచి సాలు పద్ధతిలో నీరు అందించి 30% నీటిని ఆదా చేయండి.');
    }
    if (d.includes('check transplanted seedlings in')) {
      return desc.replace(/Check transplanted seedlings in ([\d.]+) acres for root establishment and replace any wilted plants\./i, '$1 ఎకరాల్లో నాటిన మొక్కలు వేరు పారాయో లేదో చూసి, వడలిన మొక్కల స్థానంలో కొత్తవి నాటండి.');
    }
    if (d.includes('check seed emergence across')) {
      return desc.replace(/Check seed emergence across ([\d.]+) acres\. Look for uniform germination and mark any seedling gaps\./i, '$1 ఎకరాల్లో విత్తన మొలక శాతం ఏపుగా ఉందో లేదో చూడండి. ఖాళీగా ఉన్న చోట్లను గుర్తించండి.');
    }
    if (d.includes('apply first top-dressing of urea')) {
      return 'మొదటి అంతరకృషి/కలుపు తీసిన తర్వాత ఎకరానికి 25-30 కేజీల యూరియాను తగినంత తేమ ఉన్నప్పుడు వేయండి.';
    }
    if (d.includes('verify basal dap/npk placement')) {
      return desc.replace(/Verify basal DAP\/NPK placement 5cm away and 5cm below the seed row in ([\d.]+) acres\./i, '$1 ఎకరాల్లో విత్తన వరుసకు 5 సెం.మీ దూరంలో మరియు 5 సెం.మీ లోతులో ప్రాథమిక DAP/NPK ఎరువు పడేలా చూసుకోండి.');
    }
    if (d.includes('live meteorological sync') || d.includes('connecting')) {
      return 'ప్రత్యక్ష వాతావరణ సమాచారం అనుసంధానించబడుతోంది. భూమిలో ఉన్న తేమ ఆధారంగా మీ క్షేత్ర నిర్ణయాలు తీసుకోండి.';
    }
    if (d.includes('remedial') || d.includes('catch-up') || d.includes('missed in the last 2-3 days')) {
      return 'గత 2-3 రోజుల్లో మిస్ అయిన పోషకాల మోతాదును ఈ రోజు తక్షణమే అందించండి.';
    }
    return desc;
  }
  if (lang === 'hi') {
    if (d.includes('verify root development and maintain 2cm shallow water')) {
      return desc.replace(/Verify root development and maintain 2cm shallow water level in ([\d.]+) acres\./i, '$1 एकड़ में जड़ों के विकास की जांच करें और 2 सेमी पानी का स्तर बनाए रखें।');
    }
    if (d.includes('operate drip system for 2 hours')) {
      return 'ड्रिप प्रणाली को 2 घंटे चलाएं और समान दबाव के लिए फिल्टर को साफ (बैकवाश) करें।';
    }
    if (d.includes('fertigate 19:19:19 water-soluble')) {
      return 'जड़ों के विकास के लिए 19:19:19 घुलनशील खाद 2.5 किग्रा/एकड़ ड्रिप से दें।';
    }
    if (d.includes('calm winds and optimal temperature')) {
      return 'शांत हवा और सामान्य तापमान। फसल निरीक्षण, खाद और कृषि कार्यों के लिए उत्तम समय।';
    }
    if (d.includes('irrigate alternate furrows')) {
      return desc.replace(/Irrigate alternate furrows across ([\d.]+) acres to save 30% water while maintaining root zone field capacity\./i, '$1 एकड़ में एक नाली छोड़कर सिंचाई करें जिससे 30% पानी की बचत हो सके।');
    }
    if (d.includes('check transplanted seedlings in')) {
      return desc.replace(/Check transplanted seedlings in ([\d.]+) acres for root establishment and replace any wilted plants\./i, '$1 एकड़ में रोपे गए पौधों के जमाव की जांच करें और मुरझाए पौधों की जगह नए लगाएं।');
    }
    if (d.includes('check seed emergence across')) {
      return desc.replace(/Check seed emergence across ([\d.]+) acres\. Look for uniform germination and mark any seedling gaps\./i, '$1 एकड़ में बीज अंकुरण की जांच करें और खाली स्थानों को चिह्नित करें।');
    }
    if (d.includes('apply first top-dressing of urea')) {
      return 'निराई-गुड़ाई के बाद 25-30 किग्रा/एकड़ यूरिया पर्याप्त नमी में डालें।';
    }
    if (d.includes('verify basal dap/npk placement')) {
      return desc.replace(/Verify basal DAP\/NPK placement 5cm away and 5cm below the seed row in ([\d.]+) acres\./i, '$1 एकड़ में बीज की पंक्ति से 5 सेमी दूर और 5 सेमी नीचे डीएपी/एनपीके खाद की स्थिति जांचें।');
    }
    if (d.includes('live meteorological sync') || d.includes('connecting')) {
      return 'प्रत्यक्ष मौसम डेटा कनेक्ट हो रहा है। जमीन की नमी के आधार पर अपने खेत के निर्णय लें।';
    }
    if (d.includes('remedial') || d.includes('catch-up') || d.includes('missed in the last 2-3 days')) {
      return 'पिछले 2-3 दिनों में छूटी हुई खाद खुराक को आज तुरंत डालें।';
    }
    return desc;
  }
  return desc;
}

export function localizeSource(source?: string, lang: Language = 'en'): string {
  if (!source || lang === 'en') return source || '';
  const s = source.toLowerCase();
  if (lang === 'te') {
    if (s.includes('icar') || s.includes('sau')) return 'ఆధారం: ICAR & రాష్ట్ర వ్యవసాయ విశ్వవిద్యాలయాల ప్రామాణిక మార్గదర్శకాలు';
    if (s.includes('crida')) return 'ఆధారం: మెట్ట వ్యవసాయ కేంద్ర పరిశోధనా సంస్థ (CRIDA) జల యాజమాన్య సూత్రాలు';
    if (s.includes('pjtsau')) return 'ఆధారం: ప్రొఫెసర్ జయశంకర్ తెలంగాణ వ్యవసాయ విశ్వవిద్యాలయం (PJTSAU) ఎరువుల మార్గదర్శకాలు';
    if (s.includes('imd') || s.includes('open-meteo')) return 'ఆధారం: భారత వాతావరణ విభాగం (IMD) ప్రామాణిక వాతావరణ నివేదిక';
    if (s.includes('climate model') || s.includes('baseline climate')) return 'ఆధారం: వ్యవసాయ వాతావరణ ప్రామాణిక సూచిక';
    return source;
  }
  if (lang === 'hi') {
    if (s.includes('icar') || s.includes('sau')) return 'स्रोत: आईसीएआर (ICAR) और राज्य कृषि विश्वविद्यालय मानक';
    if (s.includes('crida')) return 'स्रोत: केंद्रीय शुष्क भूमि कृषि अनुसंधान संस्थान (CRIDA) जल प्रबंधन नियम';
    if (s.includes('pjtsau')) return 'स्रोत: प्रोफेसर जयशंकर तेलंगाना राज्य कृषि विश्वविद्यालय (PJTSAU) पोषण प्रबंधन';
    if (s.includes('imd') || s.includes('open-meteo')) return 'स्रोत: भारत मौसम विज्ञान विभाग (IMD) प्रमाणित मौसम डेटा';
    if (s.includes('climate model') || s.includes('baseline climate')) return 'स्रोत: कृषि जलवायु आधारभूत मॉडल';
    return source;
  }
  return source;
}

export function localizeWeatherSnippet(snippet?: string, lang: Language = 'en'): string {
  if (!snippet || lang === 'en') return snippet || '';
  if (lang === 'te') {
    return snippet
      .replace(/rain/gi, 'వర్షం')
      .replace(/wind/gi, 'గాలి')
      .replace(/Standard seasonal climate/gi, 'ప్రామాణిక వాతావరణం');
  }
  if (lang === 'hi') {
    return snippet
      .replace(/rain/gi, 'बारिश')
      .replace(/wind/gi, 'हवा')
      .replace(/Standard seasonal climate/gi, 'मानक मौसमी जलवायु');
  }
  return snippet;
}

export function localizeHybrid(hybrid?: string, lang: Language = 'en'): string {
  if (!hybrid || lang === 'en') return hybrid || '';
  if (hybrid.includes('Standard Recommended Bt Hybrid')) {
    if (lang === 'te') {
      return 'ప్రామాణిక సిఫార్సు చేసిన Bt హైబ్రిడ్ (స్థానిక రకాలను KVK/రైతు భరోసా కేంద్రంలో నిర్ధారించుకోండి)';
    }
    if (lang === 'hi') {
      return 'मानक अनुशंसित बीटी हाइब्रिड (केवीके/कृषि केंद्र से स्थानीय किस्मों की पुष्टि करें)';
    }
  }
  return hybrid;
}

export function localizeDiagnosisTitle(title?: string, lang: Language = 'en'): string {
  if (!title || lang === 'en') return title || '';
  const t = title.toLowerCase();
  if (lang === 'te') {
    if (t.includes('whitefly') || t.includes('sucking pest')) {
      return 'పత్తి ఆకులపై తెల్లదోమ / రసం పీల్చే పురుగుల దాడి';
    }
    if (t.includes('jassid') || t.includes('leafhopper')) {
      return 'పచ్చదోమ / రసం పీల్చే పురుగుల దాడి';
    }
    if (t.includes('bollworm')) {
      return 'కాయ తొలుచు పురుగు ఉధృతి';
    }
    if (t.includes('healthy') || t.includes('no issue')) {
      return 'పంట ఆరోగ్యంగా ఉంది';
    }
    return title;
  }
  if (lang === 'hi') {
    if (t.includes('whitefly') || t.includes('sucking pest')) {
      return 'कपास की पत्तियों पर सफेद मक्खी / रस चूसक कीट का प्रकोप';
    }
    if (t.includes('jassid') || t.includes('leafhopper')) {
      return 'जैसिड / रस चूसक कीट का प्रकोप';
    }
    if (t.includes('bollworm')) {
      return 'गुलाबी सुंडी का प्रकोप';
    }
    if (t.includes('healthy') || t.includes('no issue')) {
      return 'फसल स्वस्थ है';
    }
    return title;
  }
  return title;
}

export function formatRelativeDateLocalized(dateStr: string | undefined, lang: Language = 'en'): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const timeFormatted = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    
    if (isToday) {
      if (lang === 'te') return `ఈ రోజు, ${timeFormatted}`;
      if (lang === 'hi') return `आज, ${timeFormatted}`;
      return `Today, ${timeFormatted}`;
    }
    return d.toLocaleDateString(lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function localizeDecision(decision: TodayDecision, lang: Language): TodayDecision {
  if (lang === 'en' || !decision) return decision;

  let localizedActionTitle = decision.actionTitle;
  let localizedReason = decision.reason;
  let localizedDeadline = decision.deadline;
  let localizedWeatherContext = decision.weatherContext;
  let localizedSource = decision.source;
  const localizedCropTarget = localizeCropTarget(decision.cropTarget, lang);

  if (lang === 'te') {
    // 1. Action Titles
    if (decision.id === 'decision_field_inspection' || decision.actionTitle.toLowerCase().includes('scouting')) {
      localizedActionTitle = 'పత్తి మరియు మొక్కజొన్న చేలలో సాధారణ పరిశీలన చేయండి';
    } else if (decision.id === 'decision_rain_drainage' || decision.actionTitle.toLowerCase().includes('drainage')) {
      localizedActionTitle = 'వర్షం పడే అవకాశం ఉన్నందున చేనులో మురుగు నీటి కాలువలను సరిచూసుకోండి';
    } else if (decision.id === 'decision_cotton_spray' || decision.actionTitle.toLowerCase().includes('bio-pesticide')) {
      localizedActionTitle = 'పత్తి ఆకులను పరిశీలించి అవసరమైతే జీవ పురుగుమందు పిచికారీ చేయండి';
    } else if (decision.id === 'decision_caution_spray' || decision.actionTitle.toLowerCase().includes('cooler hours')) {
      localizedActionTitle = 'మందు పిచికారీని ఉదయం లేదా సాయంత్రం వేళల్లో మాత్రమే చేయండి';
    } else if (decision.id === 'decision_mandi_sell' || decision.actionTitle.toLowerCase().includes('produce')) {
      localizedActionTitle = 'సిద్ధంగా ఉన్న పంటను మార్కెట్‌కు తీసుకువెళ్ళండి';
    }

    // 2. Reasons
    if (decision.reason.includes('Regular field scouting ensures early detection')) {
      localizedReason = 'చేనును క్రమం తప్పకుండా పరిశీలించడం వల్ల తెగుళ్ల వ్యాప్తి మరియు పోషక లోపాలను ప్రారంభ దశలోనే గుర్తించవచ్చు.';
    } else if (decision.reason.includes('rainfall probability')) {
      localizedReason = 'వాతావరణ నివేదిక ప్రకారం వర్షం పడే అవకాశం ఉంది. చేనులో నీరు నిల్వ ఉండకుండా కాలువలను శుభ్రం చేయండి.';
    } else if (decision.reason.includes('under watch') && decision.reason.includes('safe window')) {
      localizedReason = 'పంట పరిశీలనలో ఉంది. ప్రస్తుత వాతావరణం మందు పిచికారీ చేయడానికి అనుకూలంగా ఉంది.';
    } else if (decision.reason.includes('cooler hours') || decision.reason.includes('foliar evaporation')) {
      localizedReason = 'ఎండ తీవ్రత లేదా గాలి వేగం వల్ల ఆకులపై రసాయనం ఆరిపోకుండా చల్లని వేళల్లో పిచికారీ చేయండి.';
    } else if (decision.reason.includes('APMC modal rate')) {
      localizedReason = 'మార్కెట్‌లో మంచి ధర మరియు చురుకైన క్రయవిక్రయాలు జరుగుతున్నాయి.';
    }

    // 3. Deadlines
    if (decision.deadline.includes('morning hours')) {
      localizedDeadline = 'ఉదయం వేళల్లో';
    } else if (decision.deadline.includes('afternoon rain')) {
      localizedDeadline = 'మధ్యాహ్నం వర్షం పడకముందే';
    } else if (decision.deadline.includes('2:00 PM')) {
      localizedDeadline = 'మధ్యాహ్నం 2:00 గంటల లోపు';
    } else if (decision.deadline.includes('4:30 PM') || decision.deadline.includes('6:30 PM')) {
      localizedDeadline = 'సాయంత్రం 4:30 – 6:30 మధ్య';
    } else if (decision.deadline.includes('trading hours')) {
      localizedDeadline = 'మార్కెట్ పని వేళలు: ఉదయం 9:00 – మధ్యాహ్నం 3:00';
    }

    // 4. Weather Context
    if (decision.weatherContext) {
      localizedWeatherContext = decision.weatherContext
        .replace(/Clear & Sunny/gi, 'స్వచ్ఛమైన ఎండ')
        .replace(/Partly Cloudy/gi, 'పాక్షికంగా మేఘావృతం')
        .replace(/Rainy \/ Showers/gi, 'వర్షం / జల్లులు')
        .replace(/Scattered Showers/gi, 'చెదురుమదురు వర్షం')
        .replace(/Thunderstorm Warning/gi, 'ఉరుములతో కూడిన వర్షం')
        .replace(/Safe Spray Window/gi, 'పిచికారీకి అనుకూల సమయం')
        .replace(/Rain Risk/gi, 'వర్ష సూచన')
        .replace(/Evening Window/gi, 'సాయంత్రం సమయం')
        .replace(/Clear Transport/gi, 'రవాణాకు అనుకూలం')
        .replace(/Field Routine/gi, 'సాధారణ క్షేత్ర పని')
        .replace(/Market Open/gi, 'మార్కెట్ తెరిచి ఉంది');
    }

    // 5. Sources
    if (decision.source) {
      localizedSource = decision.source
        .replace(/Standard Crop Agronomy Guidelines/gi, 'ప్రామాణిక పంట వ్యవసాయ మార్గదర్శకాలు')
        .replace(/Weather-Informed Agronomic Rule/gi, 'వాతావరణ ఆధారిత వ్యవసాయ సూత్రం')
        .replace(/Integrated Pest Management \(IPM\) Rule/gi, 'సమగ్ర సస్యరక్షణ (IPM) మార్గదర్శకం')
        .replace(/Agro-Met Advisory Rule/gi, 'వాతావరణ వ్యవసాయ సలహా')
        .replace(/APMC Market Rule Engine/gi, 'మార్కెట్ ధరల విశ్లేషణ');
    }
  } else if (lang === 'hi') {
    // Hindi translations
    if (decision.id === 'decision_field_inspection' || decision.actionTitle.toLowerCase().includes('scouting')) {
      localizedActionTitle = 'कपास और मक्का के खेतों में नियमित निरीक्षण करें';
    } else if (decision.id === 'decision_rain_drainage' || decision.actionTitle.toLowerCase().includes('drainage')) {
      localizedActionTitle = 'बारिश की संभावना को देखते हुए खेत में जल निकासी नालियों की जांच करें';
    } else if (decision.id === 'decision_cotton_spray' || decision.actionTitle.toLowerCase().includes('bio-pesticide')) {
      localizedActionTitle = 'कपास की पत्तियों की जांच करें और आवश्यकतानुसार जैविक कीटनाशक का छिड़काव करें';
    } else if (decision.id === 'decision_caution_spray' || decision.actionTitle.toLowerCase().includes('cooler hours')) {
      localizedActionTitle = 'पत्तियों पर छिड़काव सुबह जल्दी या शाम के समय करें';
    } else if (decision.id === 'decision_mandi_sell' || decision.actionTitle.toLowerCase().includes('produce')) {
      localizedActionTitle = 'तैयार फसल को नजदीकी मंडी ले जाने पर विचार करें';
    }

    if (decision.reason.includes('Regular field scouting ensures early detection')) {
      localizedReason = 'नियमित खेत निरीक्षण से कीटों के प्रकोप और पोषक तत्वों की कमी का समय पर पता चलता है।';
    } else if (decision.reason.includes('rainfall probability')) {
      localizedReason = 'मौसम पूर्वानुमान के अनुसार बारिश की संभावना है। जलभराव रोकने के लिए नालियां साफ करें।';
    } else if (decision.reason.includes('under watch') && decision.reason.includes('safe window')) {
      localizedReason = 'फसल निगरानी में है। वर्तमान मौसम कीटनाशक छिड़काव के लिए अनुकूल है।';
    } else if (decision.reason.includes('cooler hours') || decision.reason.includes('foliar evaporation')) {
      localizedReason = 'तेज धूप से पत्तियों को बचाने के लिए ठंडे समय में ही छिड़काव करें।';
    } else if (decision.reason.includes('APMC modal rate')) {
      localizedReason = 'मंडी में अच्छे भाव और सक्रिय व्यापार की स्थिति है।';
    }

    if (decision.deadline.includes('morning hours')) {
      localizedDeadline = 'सुबह के समय';
    } else if (decision.deadline.includes('afternoon rain')) {
      localizedDeadline = 'दोपहर की बारिश से पहले';
    } else if (decision.deadline.includes('2:00 PM')) {
      localizedDeadline = 'दोपहर 2:00 बजे से पहले';
    } else if (decision.deadline.includes('4:30 PM') || decision.deadline.includes('6:30 PM')) {
      localizedDeadline = 'शाम 4:30 से 6:30 के बीच';
    } else if (decision.deadline.includes('trading hours')) {
      localizedDeadline = 'मंडी का समय: सुबह 9:00 से दोपहर 3:00';
    }

    if (decision.weatherContext) {
      localizedWeatherContext = decision.weatherContext
        .replace(/Clear & Sunny/gi, 'साफ और धूप')
        .replace(/Partly Cloudy/gi, 'आंशिक रूप से बादल')
        .replace(/Rainy \/ Showers/gi, 'बारिश / बौछारें')
        .replace(/Scattered Showers/gi, 'छिटपुट बारिश')
        .replace(/Thunderstorm Warning/gi, 'तूफान की चेतावनी')
        .replace(/Safe Spray Window/gi, 'छिड़काव के लिए सुरक्षित समय')
        .replace(/Rain Risk/gi, 'बारिश का जोखिम')
        .replace(/Evening Window/gi, 'शाम का समय')
        .replace(/Clear Transport/gi, 'परिवहन के लिए साफ')
        .replace(/Field Routine/gi, 'दैनिक खेत कार्य')
        .replace(/Market Open/gi, 'मंडी खुली है');
    }

    if (decision.source) {
      localizedSource = decision.source
        .replace(/Standard Crop Agronomy Guidelines/gi, 'मानक फसल कृषि विज्ञान दिशानिर्देश')
        .replace(/Weather-Informed Agronomic Rule/gi, 'मौसम आधारित कृषि नियम')
        .replace(/Integrated Pest Management \(IPM\) Rule/gi, 'एकीकृत कीट प्रबंधन (IPM) नियम')
        .replace(/Agro-Met Advisory Rule/gi, 'कृषि-मौसम सलाह')
        .replace(/APMC Market Rule Engine/gi, 'मंडी मूल्य विश्लेषण');
    }
  }

  return {
    ...decision,
    actionTitle: localizedActionTitle,
    cropTarget: localizedCropTarget,
    reason: localizedReason,
    deadline: localizedDeadline,
    weatherContext: localizedWeatherContext,
    source: localizedSource,
  };
}

export function localizeWeather(weather: WeatherData | null, lang: Language): WeatherData | null {
  if (!weather || lang === 'en') return weather;

  let conditionText = weather.conditionText;
  let sprayWindowText = weather.sprayWindowText;
  let advisoryText = weather.advisoryText;
  let locationText = localizeLocationString(weather.location || '', lang);

  if (lang === 'te') {
    // Condition
    if (conditionText.includes('Clear') || conditionText.includes('Sunny')) conditionText = 'స్వచ్ఛమైన ఎండ / నిర్మలం';
    else if (conditionText.includes('Partly Cloudy')) conditionText = 'పాక్షికంగా మేఘావృతం';
    else if (conditionText.includes('Rainy') || conditionText.includes('Showers')) conditionText = 'వర్షం / జల్లులు';
    else if (conditionText.includes('Scattered')) conditionText = 'చెదురుమదురు వర్షం';
    else if (conditionText.includes('Thunderstorm')) conditionText = 'ఉరుములతో కూడిన వర్షం';

    // Spray Window
    if (sprayWindowText.includes('until 2:00 PM')) sprayWindowText = 'మధ్యాహ్నం 2:00 వరకు మందు కొట్టడానికి అనుకూలం';
    else if (sprayWindowText.includes('Avoid spraying')) sprayWindowText = 'ఈ రోజు మందు పిచికారీ చేయవద్దు';
    else if (sprayWindowText.includes('High wind')) sprayWindowText = 'ఎక్కువ గాలి వేగం - రసాయనం కొట్టుకుపోయే ప్రమాదం';
    else if (sprayWindowText.includes('caution in morning')) sprayWindowText = 'ఉదయం వేళల్లో జాగ్రత్తగా మందు కొట్టండి';
    else if (sprayWindowText.includes('before 10 AM')) sprayWindowText = 'ఉదయం 10 లోపు లేదా సాయంత్రం 4 తర్వాత మాత్రమే పిచికారీ చేయండి';

    // Advisory Explanation
    if (advisoryText.includes('Low humidity and moderate breeze')) {
      advisoryText = 'తక్కువ తేమ మరియు అనుకూలమైన గాలి. పోషకాలు గ్రహించడానికి మంచి పరిస్థితులు.';
    } else if (advisoryText.includes('Rain expected') || advisoryText.includes('wash off')) {
      advisoryText = 'వర్షం పడే అవకాశం ఉంది. పురుగుమందులు ఆకులపై నుండి కొట్టుకుపోతాయి.';
    } else if (advisoryText.includes('exceeds safe spraying limits')) {
      advisoryText = `గాలి వేగం (${weather.windSpeedKmH} km/h) సురక్షిత పరిమితి కంటే ఎక్కువగా ఉంది.`;
    } else if (advisoryText.includes('Moderate breeze') || advisoryText.includes('close to crop')) {
      advisoryText = `ఓ మోస్తరు గాలి (${weather.windSpeedKmH} km/h). పంట ఆకులకు దగ్గరగా పిచికారీ చేయండి.`;
    } else if (advisoryText.includes('High heat') || advisoryText.includes('scorch')) {
      advisoryText = `మధ్యాహ్నపు ఎండ తీవ్రత (${weather.temperature}°C) వల్ల ఆకులు మాడిపోయే ప్రమాదం ఉంది.`;
    }
  } else if (lang === 'hi') {
    // Condition
    if (conditionText.includes('Clear') || conditionText.includes('Sunny')) conditionText = 'साफ और धूप';
    else if (conditionText.includes('Partly Cloudy')) conditionText = 'आंशिक रूप से बादल';
    else if (conditionText.includes('Rainy') || conditionText.includes('Showers')) conditionText = 'बारिश / बौछारें';
    else if (conditionText.includes('Scattered')) conditionText = 'छिटपुट बारिश';
    else if (conditionText.includes('Thunderstorm')) conditionText = 'तूफान की चेतावनी';

    // Spray Window
    if (sprayWindowText.includes('until 2:00 PM')) sprayWindowText = 'दोपहर 2:00 बजे तक छिड़काव सुरक्षित';
    else if (sprayWindowText.includes('Avoid spraying')) sprayWindowText = 'आज छिड़काव से बचें';
    else if (sprayWindowText.includes('High wind')) sprayWindowText = 'तेज हवा का बहाव';
    else if (sprayWindowText.includes('caution in morning')) sprayWindowText = 'सुबह सावधानी से छिड़काव करें';
    else if (sprayWindowText.includes('before 10 AM')) sprayWindowText = 'सुबह 10 बजे से पहले या शाम 4 बजे के बाद ही छिड़काव करें';

    // Advisory Explanation
    if (advisoryText.includes('Low humidity and moderate breeze')) {
      advisoryText = 'कम नमी और अनुकूल हवा। पोषक तत्वों के अवशोषण के लिए अच्छी स्थिति।';
    } else if (advisoryText.includes('Rain expected') || advisoryText.includes('wash off')) {
      advisoryText = 'बारिश की संभावना है। कीटनाशक फसलों से धुल जाएंगे।';
    } else if (advisoryText.includes('exceeds safe spraying limits')) {
      advisoryText = `हवा की गति (${weather.windSpeedKmH} km/h) सुरक्षित सीमा से अधिक है।`;
    } else if (advisoryText.includes('Moderate breeze') || advisoryText.includes('close to crop')) {
      advisoryText = `मध्यम हवा (${weather.windSpeedKmH} km/h)। फसल की पत्तियों के पास छिड़काव करें।`;
    } else if (advisoryText.includes('High heat') || advisoryText.includes('scorch')) {
      advisoryText = `दोपहर में अधिक तापमान (${weather.temperature}°C) के कारण पत्तियां झुलस सकती हैं।`;
    }
  }

  return {
    ...weather,
    location: locationText,
    conditionText,
    sprayWindowText,
    advisoryText,
  };
}

export function localizeAlert(alert: AlertNotification, lang: Language): AlertNotification {
  if (!alert || lang === 'en') return alert;

  let title = alert.title;
  let description = alert.description;
  let source = alert.source;

  if (lang === 'te') {
    if (title.includes('Adjoining Mandal Pest Alert') || title.includes('Pest Alert')) {
      title = 'పక్క మండలాల్లో తెగుళ్ల హెచ్చరిక';
    }
    if (description.includes('Whitefly & Jassid') || description.includes('Geesugonda')) {
      description = 'పక్కనే ఉన్న గీసుకొండ & వర్ధన్నపేట చేలలో తెల్లదోమ & పచ్చదోమ దాడి నమోదైంది. ఈ రోజు సాధారణ పరిశీలన సిఫార్సు చేయబడింది.';
    }
    if (source.includes('PJTSAU')) {
      source = 'PJTSAU వ్యవసాయ విస్తరణ విభాగం';
    }
  } else if (lang === 'hi') {
    if (title.includes('Adjoining Mandal Pest Alert') || title.includes('Pest Alert')) {
      title = 'निकटवर्ती मंडल में कीट चेतावनी';
    }
    if (description.includes('Whitefly & Jassid') || description.includes('Geesugonda')) {
      description = 'आसपास के गीसुगोंडा और वर्धन्नापेट के खेतों में सफेद मक्खी और जैसिड का प्रकोप देखा गया है। आज नियमित निरीक्षण की सलाह दी जाती है।';
    }
    if (source.includes('PJTSAU')) {
      source = 'PJTSAU कृषि विस्तार';
    }
  }

  return {
    ...alert,
    title,
    description,
    source,
  };
}
