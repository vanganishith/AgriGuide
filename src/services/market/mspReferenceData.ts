export interface MspBenchmark {
  commodity: string;
  season: string;
  source: string;
  rates: {
    varietyOrGrade: string;
    mspPrice: number;
    unit: string;
  }[];
  isCentralMspCovered: boolean;
  officialNote: string;
}

export const OFFICIAL_MSP_BENCHMARKS: Record<string, MspBenchmark> = {
  paddy: {
    commodity: 'Paddy',
    season: 'Kharif Marketing Season (KMS 2024-25 / 2025-26)',
    source: 'Commission for Agricultural Costs and Prices (CACP), Govt. of India',
    rates: [
      { varietyOrGrade: 'Common', mspPrice: 2300, unit: 'quintal' },
      { varietyOrGrade: 'Grade A', mspPrice: 2320, unit: 'quintal' },
    ],
    isCentralMspCovered: true,
    officialNote: 'Procurement at declared MSP is conducted at registered Primary Agricultural Credit Societies (PACS) and Civil Supplies Purchase Centers with standard moisture limit ≤ 17%.',
  },
  cotton: {
    commodity: 'Cotton',
    season: 'Kharif Marketing Season (KMS 2024-25 / 2025-26)',
    source: 'Cotton Corporation of India (CCI) & CACP, Govt. of India',
    rates: [
      { varietyOrGrade: 'Medium Staple', mspPrice: 7121, unit: 'quintal' },
      { varietyOrGrade: 'Long Staple', mspPrice: 7521, unit: 'quintal' },
    ],
    isCentralMspCovered: true,
    officialNote: 'CCI undertakes price support operations when market rates fall below MSP. Standard FAQ quality requires moisture between 8% to 12%.',
  },
  maize: {
    commodity: 'Maize',
    season: 'Kharif Marketing Season (KMS 2024-25 / 2025-26)',
    source: 'CACP, Ministry of Agriculture & Farmers Welfare',
    rates: [
      { varietyOrGrade: 'Yellow Hybrid', mspPrice: 2225, unit: 'quintal' },
    ],
    isCentralMspCovered: true,
    officialNote: 'Procurement operations are supported by Markfed and state nodal agencies for FAQ grade grain.',
  },
  soybean: {
    commodity: 'Soybean',
    season: 'Kharif Marketing Season (KMS 2024-25 / 2025-26)',
    source: 'CACP, Ministry of Agriculture & Farmers Welfare',
    rates: [
      { varietyOrGrade: 'Yellow', mspPrice: 4892, unit: 'quintal' },
    ],
    isCentralMspCovered: true,
    officialNote: 'Support price operations under PM-AASHA / NAFED when market rates trade below benchmark.',
  },
  groundnut: {
    commodity: 'Groundnut',
    season: 'Kharif Marketing Season (KMS 2024-25 / 2025-26)',
    source: 'CACP, Ministry of Agriculture & Farmers Welfare',
    rates: [
      { varietyOrGrade: 'Pods in Shell', mspPrice: 6783, unit: 'quintal' },
    ],
    isCentralMspCovered: true,
    officialNote: 'Procurement support by NAFED for FAQ quality pods.',
  },
  tur: {
    commodity: 'Tur (Arhar)',
    season: 'Kharif Marketing Season (KMS 2024-25 / 2025-26)',
    source: 'CACP, Ministry of Agriculture & Farmers Welfare',
    rates: [
      { varietyOrGrade: 'FAQ Grade', mspPrice: 7550, unit: 'quintal' },
    ],
    isCentralMspCovered: true,
    officialNote: 'Direct procurement at declared MSP via e-Samridhi portal by NAFED / NCCF.',
  },
  chilli: {
    commodity: 'Chilli',
    season: 'Commercial / Open Market',
    source: 'State Agricultural Marketing Department',
    rates: [],
    isCentralMspCovered: false,
    officialNote: 'Dry Red Chilli is a commercial spice traded directly in APMC open auction markets (e.g. Khammam & Warangal yards) without Central MSP declaration.',
  },
  tomato: {
    commodity: 'Tomato',
    season: 'Perishable Horticulture / Open Market',
    source: 'State Horticulture & APMC Market Committee',
    rates: [],
    isCentralMspCovered: false,
    officialNote: 'Tomato is a perishable horticultural commodity traded through daily APMC open auction and daily market arrivals without Central MSP declaration.',
  },
};

export function getMspBenchmarkForCommodity(commodityName: string): MspBenchmark | null {
  if (!commodityName) return null;
  const key = commodityName.toLowerCase().trim();
  
  if (key.includes('paddy') || key.includes('rice') || key.includes('వరి') || key.includes('धान')) {
    return OFFICIAL_MSP_BENCHMARKS.paddy;
  }
  if (key.includes('cotton') || key.includes('పత్తి') || key.includes('कपास')) {
    return OFFICIAL_MSP_BENCHMARKS.cotton;
  }
  if (key.includes('maize') || key.includes('మొక్కజొన్న') || key.includes('मक्का')) {
    return OFFICIAL_MSP_BENCHMARKS.maize;
  }
  if (key.includes('chilli') || key.includes('మిర్చి') || key.includes('मिर्च')) {
    return OFFICIAL_MSP_BENCHMARKS.chilli;
  }
  if (key.includes('tomato') || key.includes('టమాట') || key.includes('टमाटर')) {
    return OFFICIAL_MSP_BENCHMARKS.tomato;
  }
  if (key.includes('soybean') || key.includes('సోయాబీన్') || key.includes('सोयाबीन')) {
    return OFFICIAL_MSP_BENCHMARKS.soybean;
  }
  if (key.includes('groundnut') || key.includes('వేరుశనగ') || key.includes('मूंगफली')) {
    return OFFICIAL_MSP_BENCHMARKS.groundnut;
  }
  if (key.includes('tur') || key.includes('arhar') || key.includes('red gram') || key.includes('redgram') || key.includes('pigeon pea') || key.includes('కందులు') || key.includes('కంది') || key.includes('अरहर') || key.includes('तुअर') || key.includes('तूर')) {
    return OFFICIAL_MSP_BENCHMARKS.tur;
  }

  return null;
}
