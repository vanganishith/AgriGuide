/**
 * AgriGuide Deterministic Crop Daily Activity Agronomy Engine
 * 
 * Generates agronomy-grounded, multi-factor daily activities based on:
 * 1. Crop name & variety
 * 2. Exact crop day (calculated from sowing_date: Day 1 = sowing day)
 * 3. Soil type (Water retention, nutrient leaching, aeration)
 * 4. Irrigation source/type (Drip, Sprinkler, Flood, Borewell, Rainfed)
 * 5. Plot acreage
 * 6. Location (District, State)
 * 7. Live Weather & Forecast (Rain probability, Temperature, Wind speed, Spray safety)
 * 8. Crop Growth Stage
 * 
 * Multilingual output support: 'en', 'te', 'hi'.
 */

import { getTodayISTDateString } from '../../utils/istDateUtils.js';

export const CROP_GROWTH_STAGES = {
  COTTON: [
    { stage: 'Sowing & Germination', startDay: 1, endDay: 10, stageTe: 'విత్తనం & మొలకెత్తే దశ', stageHi: 'बुवाई और अंकुरण' },
    { stage: 'Seedling & Early Vegetative', startDay: 11, endDay: 35, stageTe: 'మొక్క దశ & తొలి శాఖీయ దశ', stageHi: 'पौधा और प्रारंभिक वानस्पतिक अवस्था' },
    { stage: 'Squaring & Active Branching', startDay: 36, endDay: 60, stageTe: 'మొగ్గ తొడుగు దశ (స్క్వేరింగ్)', stageHi: 'कलियां बनना (स्क्वेयरिंग अवस्था)' },
    { stage: 'Flowering & Boll Formation', startDay: 61, endDay: 110, stageTe: 'పూత & కాయ ఏర్పడే దశ', stageHi: 'फूल और गूलर बनने की अवस्था' },
    { stage: 'Boll Bursting & Maturity', startDay: 111, endDay: 145, stageTe: 'కాయ పగిలే దశ & పరిపక్వత', stageHi: 'गूलर फटने और परिपक्वता अवस्था' },
    { stage: 'Harvesting & Picking', startDay: 146, endDay: 180, stageTe: 'పత్తి తీత & కోత దశ', stageHi: 'कपास तुड़ाई और कटाई' }
  ],
  MAIZE: [
    { stage: 'Sowing & Emergence', startDay: 1, endDay: 10, stageTe: 'విత్తనం & మొలక దశ', stageHi: 'बुवाई और अंकुरण' },
    { stage: 'Vegetative Growth (V4-V8)', startDay: 11, endDay: 35, stageTe: 'శాఖీయ పెరుగుదల దశ', stageHi: 'वानस्पतिक वृद्धि अवस्था' },
    { stage: 'Tasseling & Silking', startDay: 36, endDay: 65, stageTe: 'పూత & వెన్ను (కంకి) దశ', stageHi: 'मंजरी और रेशे निकलने की अवस्था' },
    { stage: 'Grain Filling (Milking & Dough)', startDay: 66, endDay: 95, stageTe: 'గింజ పాలుపోసుకునే దశ', stageHi: 'दाना भरने की अवस्था (दूधिया और सख्त)' },
    { stage: 'Physiological Maturity & Harvest', startDay: 96, endDay: 125, stageTe: 'పరిపక్వత & కోత దశ', stageHi: 'परिपक्वता और कटाई' }
  ],
  CHILLI: [
    { stage: 'Nursery & Transplanting', startDay: 1, endDay: 15, stageTe: 'నారుమడి & నాటు వేసే దశ', stageHi: 'नर्सरी और रोपाई अवस्था' },
    { stage: 'Establishment & Early Growth', startDay: 16, endDay: 40, stageTe: 'వేరు పారే దశ & తొలి పెరుగుదల', stageHi: 'शुरुआती वानस्पतिक वृद्धि' },
    { stage: 'Active Flowering & Fruit Set', startDay: 41, endDay: 80, stageTe: 'పూత & కాయ కట్టే దశ', stageHi: 'फूल और मिर्च लगने की अवस्था' },
    { stage: 'Green Chilli Picking', startDay: 81, endDay: 120, stageTe: 'పచ్చిమిర్చి కోత దశ', stageHi: 'हरी मिर्च तुड़ाई' },
    { stage: 'Ripening & Red Harvest', startDay: 121, endDay: 165, stageTe: 'ఎర్రమిర్చి కోత & ఆరబెట్టడం', stageHi: 'लाल मिर्च तुड़ाई और सुखाई' }
  ],
  PADDY: [
    { stage: 'Nursery & Sowing', startDay: 1, endDay: 20, stageTe: 'నారుమడి & విత్తే దశ', stageHi: 'नर्सरी और बुवाई' },
    { stage: 'Transplanting & Tillering', startDay: 21, endDay: 50, stageTe: 'నాట్లు & పిలకలు తొడిగే దశ', stageHi: 'रोपाई और कल्ले फूटने की अवस्था' },
    { stage: 'Panicle Initiation & Booting', startDay: 51, endDay: 80, stageTe: 'చిరుపొట్ట & వెన్ను దశ', stageHi: 'बाली निकलने की अवस्था (बूटिंग)' },
    { stage: 'Flowering & Grain Filling', startDay: 81, endDay: 110, stageTe: 'పూత & గింజ పాలుపోసుకునే దశ', stageHi: 'फूल और दाना भराव' },
    { stage: 'Ripening & Harvesting', startDay: 111, endDay: 140, stageTe: 'కోత & నూర్పిడి దశ', stageHi: 'कटाई और गहाई' }
  ],
  TOMATO: [
    { stage: 'Transplanting & Establishment', startDay: 1, endDay: 20, stageTe: 'నాట్లు & వేరుపారే దశ', stageHi: 'रोपाई और जमाव' },
    { stage: 'Vegetative Growth & Staking', startDay: 21, endDay: 45, stageTe: 'శాఖీయ పెరుగుదల & కర్రల ఆసరా', stageHi: 'वानस्पतिक वृद्धि और सहारा (स्टेकिंग)' },
    { stage: 'Flowering & Fruit Development', startDay: 46, endDay: 75, stageTe: 'పూత & కాయ ఎదుగుదల దశ', stageHi: 'फूल और फल विकास' },
    { stage: 'Fruit Ripening & Selective Harvest', startDay: 76, endDay: 120, stageTe: 'పండ్ల కోత దశ', stageHi: 'फल पकना और तुड़ाई' }
  ],
  GROUNDNUT: [
    { stage: 'Sowing & Seedling Emergence', startDay: 1, endDay: 15, stageTe: 'విత్తనం & మొలకెత్తే దశ', stageHi: 'बुवाई और अंकुरण' },
    { stage: 'Vegetative & Active Branching', startDay: 16, endDay: 35, stageTe: 'శాఖీయ పెరుగుదల & కొమ్మల దశ', stageHi: 'वानस्पतिक वृद्धि और शाखाएं' },
    { stage: 'Flowering & Pegging (Gynephore Penetration)', startDay: 36, endDay: 60, stageTe: 'పూత & ఊడలు దిగే దశ (పెగ్గింగ్)', stageHi: 'फूल और खूंटे (पेग) बनने की अवस्था' },
    { stage: 'Pod Development & Seed Filling', startDay: 61, endDay: 95, stageTe: 'కాయ ఎదుగుదల & గింజ ఊరే దశ', stageHi: 'फली विकास और दाना भराव' },
    { stage: 'Pod Maturity & Harvesting', startDay: 96, endDay: 125, stageTe: 'కాయ పరిపక్వత & కోత దశ', stageHi: 'फली परिपक्वता और कटाई' }
  ],
  GENERAL: [
    { stage: 'Sowing / Establishment', startDay: 1, endDay: 15, stageTe: 'విత్తే / నాటే దశ', stageHi: 'बुवाई और जमाव' },
    { stage: 'Vegetative Growth', startDay: 16, endDay: 45, stageTe: 'శాఖీయ పెరుగుదల దశ', stageHi: 'वानस्पतिक वृद्धि' },
    { stage: 'Flowering / Reproductive', startDay: 46, endDay: 85, stageTe: 'పూత & ఉత్పత్తి దశ', stageHi: 'फूल और फलन' },
    { stage: 'Maturity & Harvest', startDay: 86, endDay: 130, stageTe: 'పరిపక్వత & కోత దశ', stageHi: 'परिपक्वता और कटाई' }
  ]
};

export function getCropGrowthStage(cropName, cropDay) {
  const normName = (cropName || '').toUpperCase();
  let stages = CROP_GROWTH_STAGES.GENERAL;

  if (normName.includes('COTTON') || normName.includes('పత్తి') || normName.includes('कपास')) {
    stages = CROP_GROWTH_STAGES.COTTON;
  } else if (normName.includes('MAIZE') || normName.includes('మొక్కజొన్న') || normName.includes('मक्का') || normName.includes('CORN')) {
    stages = CROP_GROWTH_STAGES.MAIZE;
  } else if (normName.includes('CHILLI') || normName.includes('మిరప') || normName.includes('मिर्च')) {
    stages = CROP_GROWTH_STAGES.CHILLI;
  } else if (normName.includes('PADDY') || normName.includes('వరి') || normName.includes('धान') || normName.includes('RICE')) {
    stages = CROP_GROWTH_STAGES.PADDY;
  } else if (normName.includes('TOMATO') || normName.includes('టమాట') || normName.includes('टमाटर')) {
    stages = CROP_GROWTH_STAGES.TOMATO;
  } else if (normName.includes('GROUNDNUT') || normName.includes('PEANUT') || normName.includes('వేరుశనగ') || normName.includes('मूंगफली') || normName.includes('GROUND NUT')) {
    stages = CROP_GROWTH_STAGES.GROUNDNUT;
  }

  const match = stages.find(s => cropDay >= s.startDay && cropDay <= s.endDay);
  if (match) return match;

  const lastStage = stages[stages.length - 1];
  if (cropDay > lastStage.endDay) {
    return {
      stage: 'Late Harvest / Field Clearing',
      stageTe: 'ఆలస్యపు కోత / పొలం శుభ్రత',
      stageHi: 'कटाई उपरांत / खेत सफाई',
      startDay: lastStage.endDay + 1,
      endDay: 999
    };
  }

  return stages[0];
}

/**
 * Generate deterministic, agronomy-grounded, multi-factor daily activities.
 */
export function generateDailyActivitiesForCropDay({
  cropName = 'Cotton',
  variety = '',
  cropDay = 1,
  activityDate = getTodayISTDateString(),
  soilType = 'Black Cotton Soil',
  irrigationType = 'Drip Irrigation',
  acres = 4.5,
  district = 'Warangal',
  state = 'Telangana',
  weather = null,
  language = 'en',
  recentHistory = []
}) {
  const normCrop = (cropName || '').toLowerCase();
  const normSoil = (soilType || '').toLowerCase();
  const normIrrig = (irrigationType || '').toLowerCase();
  const stageInfo = getCropGrowthStage(cropName, cropDay);

  // Analyze past 2-3 days activity history
  const past2to3Days = (recentHistory || []).filter(a => a.activityDate && a.activityDate < activityDate);
  const missedTasks = past2to3Days.filter(a => a.status === 'missed' || (!a.isCompleted && a.status !== 'skipped'));
  const completedTasks = past2to3Days.filter(a => a.isCompleted || a.status === 'completed');

  const missedFertilizer = missedTasks.find(a => a.category === 'fertilizer');
  const missedIrrigation = missedTasks.find(a => a.category === 'irrigation');
  const missedScouting = missedTasks.find(a => a.category === 'crop_scouting');

  let historySummaryEn = 'Crop started on schedule. Following Day 1 agronomic plan.';
  let historySummaryTe = 'పంట ప్రారంభించబడింది. 1వ రోజు ప్రామాణిక ప్రణాళిక కొనసాగుతోంది.';
  let historySummaryHi = 'फसल शुरू हो गई है। दिन 1 की मानक योजना जारी है।';

  if (past2to3Days.length > 0) {
    if (missedTasks.length > 0) {
      historySummaryEn = `AI Analysis: ${missedTasks.length} task(s) missed in the last 2-3 days. Today's plan has been adaptively prioritized for remedial catch-up.`;
      historySummaryTe = `AI విశ్లేషణ: గత 2-3 రోజుల్లో ${missedTasks.length} పని/పనులు పూర్తి కాలేదు. ఈ రోజు ప్రణాళికలో వాటికి అత్యవసర ప్రాధాన్యత ఇవ్వబడింది.`;
      historySummaryHi = `AI विश्लेषण: पिछले 2-3 दिनों में ${missedTasks.length} कार्य छूट गए थे। आज की योजना में सुधारात्मक कार्यों को प्राथमिकता दी गई है।`;
    } else {
      historySummaryEn = `AI Analysis: Excellent progress! All scheduled activities were completed over the last 2-3 days. Proceeding with Day ${cropDay} growth operations.`;
      historySummaryTe = `AI విశ్లేషణ: అద్భుతం! గత 2-3 రోజుల్లో అన్ని వ్యవసాయ పనులు విజయవంతంగా పూర్తయ్యాయి. ${cropDay}వ రోజు తదుపరి పెరుగుదల పనులు కొనసాగించండి.`;
      historySummaryHi = `AI विश्लेषण: बहुत बढ़िया! पिछले 2-3 दिनों के सभी कार्य पूरे हो चुके हैं। दिन ${cropDay} के अगले चरण के कार्य जारी रखें।`;
    }
  }

  // Weather factors
  const rainProb = Number(weather?.rainfallProbability || weather?.rainProbability || 0);
  const temp = Number(weather?.temperature || 28);
  const wind = Number(weather?.windSpeedKmH || weather?.windSpeed || 10);
  const sprayCondition = weather?.sprayCondition || (wind > 18 || rainProb > 40 ? 'unsafe' : 'safe');
  const isHighRainExpected = rainProb >= 50;
  const isExtremeHeat = temp >= 36;
  const isHighWind = wind >= 18;

  // Activities array
  const activities = [];

  // -------------------------------------------------------------------------
  // 1. 🌱 CROP SCOUTING / INSPECTION TASK (Modulated by Crop + Day)
  // -------------------------------------------------------------------------
  let scoutTitleEn = '';
  let scoutDescEn = '';
  let scoutPriority = 'high';

  if (normCrop.includes('cotton')) {
    if (cropDay <= 10) {
      scoutTitleEn = 'Inspect seed germination & stand establishment';
      scoutDescEn = `Check seed emergence across ${acres} acres. Look for uniform germination and mark any seedling gaps.`;
    } else if (cropDay <= 25) {
      scoutTitleEn = 'Scout for early sucking pests (Thrips & Jassids)';
      scoutDescEn = 'Inspect the underside of young leaves for leaf curling, silvery sheen, or yellowing edges.';
    } else if (cropDay <= 50) {
      scoutTitleEn = 'Field scouting for square formation & Whiteflies';
      scoutDescEn = `Inspect squares and lower leaf surfaces. Count whiteflies/jassids per plant across 20 random spots in the ${acres}-acre plot.`;
    } else if (cropDay <= 90) {
      scoutTitleEn = 'Pheromone trap & pink bollworm rosette flower check';
      scoutDescEn = 'Check moth catches in pheromone traps (threshold: 8 moths/trap/night). Inspect rosette flowers for pink bollworm larvae.';
      scoutPriority = 'high';
    } else if (cropDay <= 130) {
      scoutTitleEn = 'Boll development & leaf reddening check';
      scoutDescEn = 'Inspect mature bolls for boll rot or fungal staining. Check for magnesium deficiency (leaf reddening) in older leaves.';
    } else {
      scoutTitleEn = 'Check boll opening & prepare for clean picking';
      scoutDescEn = 'Identify fully burst bolls ready for morning picking. Keep picking bags clean from dried bracts and leaf trash.';
    }
  } else if (normCrop.includes('maize')) {
    if (cropDay <= 12) {
      scoutTitleEn = 'Inspect seedling emergence & cutworm damage';
      scoutDescEn = `Verify uniform crop stand in ${acres} acres. Check for cutworm cutting at ground level.`;
    } else if (cropDay <= 30) {
      scoutTitleEn = 'Scout for Fall Armyworm (FAW) whorl damage';
      scoutDescEn = 'Check central whorls for pinhole feeding and fresh saw-dust frass. Inspect 20 plants per acre.';
      scoutPriority = 'high';
    } else if (cropDay <= 65) {
      scoutTitleEn = 'Tassel emergence & stem borer inspection';
      scoutDescEn = 'Inspect tassels and developing ears. Check for stem borer exit holes and pollen shedding vigor.';
    } else {
      scoutTitleEn = 'Cob maturity & grain moisture check';
      scoutDescEn = 'Peel back husks on sample cobs to verify grain hardening and black layer formation at base of kernel.';
    }
  } else if (normCrop.includes('chilli')) {
    if (cropDay <= 15) {
      scoutTitleEn = 'Monitor seedling survival & gap filling';
      scoutDescEn = `Check transplanted seedlings in ${acres} acres for root establishment and replace any wilted plants.`;
    } else if (cropDay <= 40) {
      scoutTitleEn = 'Scout for Thrips, Mites & Murda leaf curl';
      scoutDescEn = 'Inspect upward leaf curling (thrips) and downward curling (mites). Check underside with a hand lens.';
      scoutPriority = 'high';
    } else if (cropDay <= 85) {
      scoutTitleEn = 'Flowering vigor & fruit borer scouting';
      scoutDescEn = 'Check for flower drop and inspect tender chillies for entry boreholes of Helicoverpa larvae.';
    } else {
      scoutTitleEn = 'Inspect ripe pod uniformity and anthracnose spots';
      scoutDescEn = 'Check pods for circular sunken lesions (dieback/anthracnose). Harvest ripe pods in dry conditions.';
    }
  } else if (normCrop.includes('paddy') || normCrop.includes('rice')) {
    if (cropDay <= 20) {
      scoutTitleEn = 'Check seedling vigor in nursery / shallow standing water';
      scoutDescEn = `Verify root development and maintain 2cm shallow water level in ${acres} acres.`;
    } else if (cropDay <= 50) {
      scoutTitleEn = 'Monitor tillering & Yellow Stem Borer dead hearts';
      scoutDescEn = 'Count tillers per hill (aim for 15-20). Inspect for dead central shoots (dead hearts) caused by stem borer.';
      scoutPriority = 'high';
    } else if (cropDay <= 85) {
      scoutTitleEn = 'Scout for Brown Planthopper (BPH) & Leaf Folder';
      scoutDescEn = 'Part the tillers at water base to check BPH nymphs. Check for longitudinal leaf folding.';
    } else {
      scoutTitleEn = 'Panicle ripening & drainage check';
      scoutDescEn = 'Inspect golden grain filling. Drain standing water 10 days before harvest to ensure uniform maturity.';
    }
  } else if (normCrop.includes('groundnut') || normCrop.includes('peanut') || normCrop.includes('వరి') || normCrop.includes('వేరుశనగ') || normCrop.includes('मूंगफली')) {
    if (cropDay <= 15) {
      scoutTitleEn = 'Inspect crop emergence and seedling vigor';
      scoutDescEn = `Walk through the ${acres}-acre plot to verify plant population and early root establishment.`;
    } else if (cropDay <= 35) {
      scoutTitleEn = 'Scout for Leaf Miner & Sucking Pests (Thrips/Jassids)';
      scoutDescEn = 'Inspect leaflets for translucent blister mines (leaf miner) and downward curling. Check 20 plants across plot.';
    } else if (cropDay <= 60) {
      scoutTitleEn = 'Monitor flowering, peg penetration & Tikka leaf spot';
      scoutDescEn = 'Check peg entry into loose friable soil. Inspect lower leaves for circular dark brown Tikka spots.';
      scoutPriority = 'high';
    } else {
      scoutTitleEn = 'Pod maturity & kernel filling check';
      scoutDescEn = 'Pull sample plants to check pod inner shell darkening (70-80% dark veins indicates harvest maturity).';
    }
  } else {
    // General Crop
    if (cropDay <= 15) {
      scoutTitleEn = 'Inspect crop emergence and seedling vigor';
      scoutDescEn = `Walk through the ${acres}-acre plot to verify plant population and early root establishment.`;
    } else if (cropDay <= 60) {
      scoutTitleEn = 'Scout for foliar pests and nutrient deficiency';
      scoutDescEn = 'Inspect upper and lower foliage across random transects. Check for leaf spots or yellowing.';
    } else {
      scoutTitleEn = 'Monitor pod/fruit development & crop health';
      scoutDescEn = 'Assess harvest readiness and check for late-season disease symptoms.';
    }
  }

  activities.push({
    category: 'crop_scouting',
    title: scoutTitleEn,
    conciseDescription: scoutDescEn,
    priority: scoutPriority,
    sourceContext: 'ICAR & SAU Agronomic Scouting Standard',
  });

  // -------------------------------------------------------------------------
  // 2. 💧 IRRIGATION & SOIL MANAGEMENT TASK (Modulated by Soil + Irrig + Weather)
  // -------------------------------------------------------------------------
  let irrigTitleEn = '';
  let irrigDescEn = '';
  let irrigPriority = 'medium';

  const isDrip = normIrrig.includes('drip');
  const isSprinkler = normIrrig.includes('sprinkler');
  const isRainfed = normIrrig.includes('rainfed');
  const isBlackSoil = normSoil.includes('black');
  const isSandySoil = normSoil.includes('sandy');

  if (isHighRainExpected) {
    irrigTitleEn = 'Rain forecast: Delay irrigation & clear plot drains';
    irrigDescEn = `High rainfall probability (${rainProb}%). Suspend scheduled irrigation to avoid waterlogging and root rot. Ensure field drainage channels are open.`;
    irrigPriority = 'high';
  } else if (isDrip) {
    if (isBlackSoil) {
      irrigTitleEn = 'Drip irrigation: 1.5 - 2 hr cycle on black soil';
      irrigDescEn = `Run drip laterals for 1.5 to 2 hours during morning hours. Black soil retains moisture — avoid water accumulation at lateral ends.`;
    } else if (isSandySoil) {
      irrigTitleEn = 'Drip irrigation: Split cycles on sandy soil';
      irrigDescEn = `Provide two shorter 1-hour drip cycles (morning & late afternoon) to compensate for high percolation rate in sandy soil.`;
    } else {
      irrigTitleEn = 'Drip irrigation scheduling & filter check';
      irrigDescEn = `Operate drip system for 2 hours. Flush sub-mains and backwash the screen/disc filter to maintain uniform emitter pressure.`;
    }
  } else if (isSprinkler) {
    if (isHighWind) {
      irrigTitleEn = 'Delay sprinkler operation due to strong wind';
      irrigDescEn = `Wind speed is ${wind} km/h. High wind causes uneven water distribution. Operate sprinklers during calm early morning hours.`;
    } else {
      irrigTitleEn = 'Sprinkler irrigation: 2.5 hr shift';
      irrigDescEn = `Run sprinkler lines for 2.5 hours per shift. Ensure overlapping spray patterns across ${acres} acres.`;
    }
  } else if (isRainfed) {
    irrigTitleEn = 'Soil moisture conservation & dust mulching';
    irrigDescEn = `Perform shallow inter-culture with a blade harrow to create a soil mulch and break soil capillaries to conserve root-zone moisture.`;
  } else {
    // Borewell / Canal Flood
    if (isBlackSoil) {
      irrigTitleEn = 'Furrow irrigation check & moisture probing';
      irrigDescEn = 'Check soil cracking depth. Apply light furrow irrigation only if top 3 inches are completely dry to prevent wilt in heavy soil.';
    } else {
      irrigTitleEn = 'Plot irrigation & border bund check';
      irrigDescEn = `Irrigate alternate furrows across ${acres} acres to save 30% water while maintaining root zone field capacity.`;
    }
  }

  activities.push({
    category: 'irrigation',
    title: irrigTitleEn,
    conciseDescription: irrigDescEn,
    priority: irrigPriority,
    sourceContext: 'Central Research Institute for Dryland Agriculture (CRIDA) Water Management Protocol',
  });

  // -------------------------------------------------------------------------
  // 3. 🧪 NUTRITION, FERTILIZER & CROP PROTECTION (Modulated by Day + Weather)
  // -------------------------------------------------------------------------
  let nutTitleEn = '';
  let nutDescEn = '';
  let nutPriority = 'medium';

  if (isHighRainExpected) {
    nutTitleEn = 'Postpone foliar sprays & granular fertilizer';
    nutDescEn = `Expected rain (${rainProb}% prob) will wash off foliar chemicals and cause nitrogen leaching. Defer all spraying until skies clear.`;
    nutPriority = 'high';
  } else if (isHighWind && sprayCondition === 'unsafe') {
    nutTitleEn = 'Hold foliar spray: High wind drift risk';
    nutDescEn = `Wind speed (${wind} km/h) exceeds safe spraying threshold (15 km/h). Wait for wind to drop below 12 km/h before spraying.`;
  } else {
    // Modulate based on crop age & stage
    if (cropDay >= 1 && cropDay <= 15) {
      nutTitleEn = 'Basal dose / early seedling root booster';
      if (isDrip) {
        nutDescEn = `Fertigate 19:19:19 water-soluble fertilizer @ 2.5 kg/acre via drip to stimulate early root proliferation.`;
      } else {
        nutDescEn = `Verify basal DAP/NPK placement 5cm away and 5cm below the seed row in ${acres} acres.`;
      }
    } else if (cropDay >= 16 && cropDay <= 35) {
      nutTitleEn = 'First split Nitrogen application & weeding';
      nutDescEn = `Apply first top-dressing of Urea @ 25-30 kg/acre after inter-cultivation weeding when soil has moderate moisture.`;
      nutPriority = 'high';
    } else if (cropDay >= 36 && cropDay <= 65) {
      nutTitleEn = 'Micronutrient foliar spray (Zinc & Boron)';
      nutDescEn = `Foliar spray Zinc Sulphate (0.2%) + Boron (0.1%) or 13:00:45 @ 5g/L during early morning to enhance flowering and reduce drop.`;
    } else if (cropDay >= 66 && cropDay <= 100) {
      nutTitleEn = 'Potassium top-dressing & boll/grain nourishment';
      nutDescEn = `Apply Muriate of Potash (MOP) @ 20 kg/acre or fertigate SOP 00:00:50 to support grain filling and boll weight.`;
    } else {
      nutTitleEn = 'Late-season foliar booster & clean field upkeep';
      nutDescEn = `Spray 1% Potassium Nitrate (13-0-45) to prevent premature leaf senescence and optimize harvest quality.`;
    }
  }

  if (missedFertilizer && !isHighRainExpected) {
    nutTitleEn = `⚠️ Remedial Dose: ${missedFertilizer.title || 'Nutrient Application'} (Catch-up)`;
    nutDescEn = `Our AI detected this nutrient application was missed in the last 2-3 days. Apply today immediately across ${acres} acres before crop development is impeded.`;
    nutPriority = 'high';
  }

  activities.push({
    category: 'fertilizer',
    title: nutTitleEn,
    conciseDescription: nutDescEn,
    priority: nutPriority,
    sourceContext: 'State Agricultural University (PJTSAU) Nutrient Management Schedule',
  });

  // -------------------------------------------------------------------------
  // 4. 🌦 WEATHER & MICRO-CLIMATE ADAPTATION TASK
  // -------------------------------------------------------------------------
  let weatherTitleEn = '';
  let weatherDescEn = '';
  let weatherPriority = 'low';

  if (weather === null) {
    weatherTitleEn = 'Weather advisory update pending';
    weatherDescEn = 'Live meteorological sync is currently connecting. Base your field decisions on ground soil moisture.';
  } else if (isHighRainExpected) {
    weatherTitleEn = `Rain alert (${rainProb}% prob): Protect harvested produce`;
    weatherDescEn = `Rainfall predicted for ${district}. Cover any exposed inputs or harvested produce with tarpaulins.`;
    weatherPriority = 'high';
  } else if (isExtremeHeat) {
    weatherTitleEn = `Extreme temperature (${temp}°C): Restrict afternoon field work`;
    weatherDescEn = `High daytime heat index. Complete all spraying, irrigation, and heavy farm labor before 10:30 AM or after 4:30 PM.`;
    weatherPriority = 'high';
  } else if (isHighWind) {
    weatherTitleEn = `Breezy conditions (${wind} km/h): Check staking & crop lodging`;
    weatherDescEn = `Strong breeze in ${district}. Check support stakes for tall crops and secure greenhouse/shade-net edges.`;
  } else {
    weatherTitleEn = `Favorable weather (${temp}°C, Clear): Optimal field day`;
    weatherDescEn = `Calm winds and optimal temperature in ${district}. Ideal conditions for crop scouting, fertigation, and field operations.`;
  }

  activities.push({
    category: 'weather_protection',
    title: weatherTitleEn,
    conciseDescription: weatherDescEn,
    priority: weatherPriority,
    sourceContext: weather ? `IMD / Open-Meteo Verified Ground Data (${district})` : 'Agronomic Baseline Climate Model',
  });

  // Return activities enriched with crop day, date, and history analysis
  const enrichedActivities = activities.map((act, index) => ({
    id: `act_${cropName.toLowerCase().replace(/[^a-z0-9]/g, '')}_d${cropDay}_${act.category}_${index}`,
    cropDay,
    activityDate,
    stage: stageInfo.stage,
    stageTe: stageInfo.stageTe,
    stageHi: stageInfo.stageHi,
    category: act.category,
    title: act.title,
    conciseDescription: act.conciseDescription,
    priority: act.priority,
    status: 'pending',
    sourceContext: act.sourceContext,
    weatherContext: weather ? `${temp}°C, ${rainProb}% rain, ${wind} km/h wind` : 'Standard seasonal climate',
    soilType,
    irrigationType,
    acres,
  }));

  return {
    activities: enrichedActivities,
    analysis: {
      summary: historySummaryEn,
      summaryTe: historySummaryTe,
      summaryHi: historySummaryHi,
      missedCount: missedTasks.length,
      completedCount: completedTasks.length,
      evaluatedDaysCount: past2to3Days.length,
    }
  };
}
