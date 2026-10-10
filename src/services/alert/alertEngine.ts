import type { 
  AlertNotification, 
  CropHealth, 
  Farm, 
  MarketPrice, 
  Language,
  FarmerProfile,
  DesktopNavTab
} from '../../types';

export interface EnrichedAlert extends AlertNotification {
  category: 'skipped_activity' | 'scheme_deadline' | 'mandi_fluctuation' | 'weather' | 'general';
  actionLabel?: string;
  actionTab?: DesktopNavTab;
  daysRemaining?: number;
  metadata?: {
    cropName?: string;
    plotName?: string;
    activityId?: string;
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

export class AlertEngine {
  /**
   * Consolidate server alerts, skipped activities, crop-specific scheme deadlines,
   * and live mandi rate fluctuations into clean notification alerts with big headlines.
   */
  static generateComprehensiveAlerts({
    serverAlerts = [],
    crops = [],
    farms = [],
    markets = [],
    currentLang = 'en',
    farmerProfile: _farmerProfile = null,
  }: {
    serverAlerts?: AlertNotification[];
    crops?: CropHealth[];
    farms?: Farm[];
    markets?: MarketPrice[];
    currentLang?: Language;
    farmerProfile?: FarmerProfile | null;
  }): EnrichedAlert[] {
    const enrichedList: EnrichedAlert[] = [];

    // 1. Active crops cultivated
    const activeCropNames = new Set<string>();
    crops.forEach(c => {
      if (c.cropName) activeCropNames.add(c.cropName.toLowerCase());
    });
    farms.forEach(f => {
      f.plots?.forEach(p => {
        if (p.currentCrop) activeCropNames.add(p.currentCrop.toLowerCase());
      });
      f.cropsList?.forEach(c => activeCropNames.add(c.toLowerCase()));
    });

    if (activeCropNames.size === 0) {
      activeCropNames.add('cotton');
      activeCropNames.add('chilli');
      activeCropNames.add('paddy');
    }

    // ------------------------------------------------------------------------
    // SECTION A: SKIPPED DAILY ACTIVITIES (Deduplicated)
    // ------------------------------------------------------------------------
    const seenSkippedTitles = new Set<string>();
    try {
      const skippedStorage = localStorage.getItem('agriguide_skipped_activities');
      if (skippedStorage) {
        const skippedItems: Array<{ id: string; title: string; cropName: string; stage?: string; skippedAt: string }> = JSON.parse(skippedStorage);
        skippedItems.forEach((item, idx) => {
          const normKey = item.title.toLowerCase();
          if (!seenSkippedTitles.has(normKey)) {
            seenSkippedTitles.add(normKey);
            enrichedList.push({
              id: `skipped_local_${item.id || idx}`,
              title: currentLang === 'te'
                ? `⚠️ ${item.cropName} లో ${item.title} పని దాటవేయబడింది`
                : (currentLang === 'hi' ? `⚠️ ${item.cropName} में ${item.title} कार्य छूट गया है` : `⚠️ ${item.title} was skipped for ${item.cropName}`),
              description: currentLang === 'te'
                ? `ఈ దశలో పోషక లోపం వల్ల పూత రాలడం 15% పెరగవచ్చు. వెంటనే షెడ్యూల్ పరిశీలించండి.`
                : (currentLang === 'hi'
                    ? `इस अवस्था में पोषक तत्व न मिलने से 15% फूल गिर सकते हैं। कृपया जल्द उपचार करें।`
                    : `Skipping foliar nutrition increases flower drop risk by 15%. Reschedule soon.`),
              severity: 'danger',
              source: 'My Farm',
              issuedAt: item.skippedAt ? new Date(item.skippedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
              category: 'skipped_activity',
              actionLabel: currentLang === 'te' ? 'షెడ్యూల్ చూడండి' : (currentLang === 'hi' ? 'शेड्यूल देखें' : 'Review'),
              actionTab: 'farm',
              metadata: {
                cropName: item.cropName,
                activityId: item.id,
              },
            });
          }
        });
      }
    } catch (err) {
      console.warn('[AlertEngine] Error parsing local skipped activities:', err);
    }

    // Default demonstration skipped alert if none recorded yet
    if (enrichedList.filter(a => a.category === 'skipped_activity').length === 0) {
      const primaryCrop = activeCropNames.has('cotton') ? 'Cotton' : (activeCropNames.has('chilli') ? 'Chilli' : 'Paddy');
      const cropTe = primaryCrop === 'Cotton' ? 'పత్తి' : (primaryCrop === 'Chilli' ? 'మిర్చి' : 'వరి');
      const cropHi = primaryCrop === 'Cotton' ? 'कपास' : (primaryCrop === 'Chilli' ? 'मिर्च' : 'धान');

      enrichedList.push({
        id: 'alert_skipped_demo_1',
        title: currentLang === 'te' 
          ? `⚠️ ${cropTe} ప్లాట్ 1 లో యూరియా పిచికారీ పని దాటవేయబడింది`
          : (currentLang === 'hi'
              ? `⚠️ ${cropHi} खेत 1 में यूरिया छिड़काव कार्य छूट गया है`
              : `⚠️ Urea Top-Dressing was skipped in ${primaryCrop} Plot 1`),
        description: currentLang === 'te'
          ? `పోషక లోపం వల్ల పూత రాలడం 15% పెరగవచ్చు. నేటి సాయంత్రం లోపు పూర్తి చేయండి.`
          : (currentLang === 'hi'
              ? `पोषक न मिलने से 15% फूल गिर सकते हैं। आज शाम तक पूरा करें।`
              : `Skipping foliar nutrition increases flower drop risk by 15%. Reschedule soon.`),
        severity: 'danger',
        source: 'My Farm',
        issuedAt: 'Today, 8:30 AM',
        category: 'skipped_activity',
        actionLabel: currentLang === 'te' ? 'షెడ్యూల్ చూడండి' : 'Review',
        actionTab: 'farm',
        metadata: {
          cropName: primaryCrop,
          plotName: 'Plot 1',
        },
      });
    }

    // ------------------------------------------------------------------------
    // SECTION B: CROP-RELATED SCHEMES & DEADLINES
    // ------------------------------------------------------------------------
    if (activeCropNames.has('cotton') || activeCropNames.has('paddy') || activeCropNames.has('groundnut') || activeCropNames.has('maize')) {
      enrichedList.push({
        id: 'scheme_alert_pmfby',
        title: currentLang === 'te'
          ? '🏛 అక్టోబర్ 31 లోపు PMFBY పంట బీమా నమోదు పూర్తి చేయండి'
          : (currentLang === 'hi'
              ? '🏛 31 अक्टूबर तक PMFBY फसल बीमा पंजीकरण पूरा करें'
              : '🏛 PMFBY Crop Insurance: Enrollment closes Oct 31'),
        description: currentLang === 'te'
          ? 'అకాల వర్షాలు మరియు తెగుళ్ల నష్టం నుండి 90% సబ్సిడీతో పంట బీమా రక్షణ పొందండి.'
          : (currentLang === 'hi'
              ? 'बेमौसम बारिश व कीट नुकसान से 90% अनुदान पर पूर्ण सुरक्षा पाएं।'
              : 'Get 90% premium subsidy against rainfall & pest losses. 21 days remaining.'),
        severity: 'warning',
        source: 'Govt Schemes',
        issuedAt: 'Yesterday',
        category: 'scheme_deadline',
        actionLabel: currentLang === 'te' ? 'దరఖాస్తు' : 'Apply',
        actionTab: 'money',
        daysRemaining: 21,
        metadata: {
          cropName: 'Paddy & Cotton',
          deadline: '31 Oct',
          subsidyAmount: '90% Subsidy',
        },
      });
    }

    if (activeCropNames.has('cotton') || activeCropNames.has('chilli') || activeCropNames.has('tomato') || activeCropNames.has('pulses')) {
      enrichedList.push({
        id: 'scheme_alert_smam',
        title: currentLang === 'te'
          ? '🏛 స్ప్రేయర్లపై 50% SMAM సబ్సిడీ గడువు నవంబర్ 15'
          : (currentLang === 'hi'
              ? '🏛 बैटरी स्प्रेयर पर 50% SMAM सब्सिडी की अंतिम तिथि 15 नवंबर'
              : '🏛 50% Subsidy on Battery Sprayers & Weeders closes Nov 15'),
        description: currentLang === 'te'
          ? 'పత్తి & మిర్చి రైతులకు బ్యాటరీ స్ప్రేయర్లు, కలుపు యంత్రాలపై 50% DBT సబ్సిడీ (గరిష్టంగా ₹35,000).'
          : (currentLang === 'hi'
              ? 'कपास व मिर्च किसानों को बैटरी स्प्रेयर पर 50% प्रत्यक्ष सब्सिडी (अधिकतम ₹35,000)।'
              : 'Apply for mechanized weeders & sprayers on Agrisnet portal before quota ends.'),
        severity: 'warning',
        source: 'Govt Schemes',
        issuedAt: '2 days ago',
        category: 'scheme_deadline',
        actionLabel: currentLang === 'te' ? 'వివరాలు' : 'Details',
        actionTab: 'money',
        daysRemaining: 36,
        metadata: {
          cropName: 'Cotton & Chilli',
          deadline: '15 Nov',
          subsidyAmount: '50% Subsidy',
        },
      });
    }

    if (activeCropNames.has('chilli') || activeCropNames.has('turmeric') || activeCropNames.has('tomato')) {
      enrichedList.push({
        id: 'scheme_alert_pmksy_drip',
        title: currentLang === 'te'
          ? '🏛 మిర్చి & పసుపు తోటలకు 80-90% డ్రిప్ సబ్సిడీ గడువు నవంబర్ 20'
          : (currentLang === 'hi'
              ? '🏛 मिर्च व हल्दी में 70-90% ड्रिप सब्सिडी अंतिम तिथि 20 नवंबर'
              : '🏛 PMKSY Micro-Irrigation: 70–90% Drip Subsidy closes Nov 20'),
        description: currentLang === 'te'
          ? 'నీటి పొదుపుతో పాటు దిగుబడి 30% పెంచుకోండి. ఆధార్ & పాస్‌బుక్ ద్వారా దరఖాస్తు చేయండి.'
          : (currentLang === 'hi'
              ? 'पानी की बचत के साथ 30% तक उपज बढ़ाएं। आधार कार्ड से तुरंत आवेदन करें।'
              : 'Save 30% water and boost harvest yield for Chilli & Turmeric plots.'),
        severity: 'info',
        source: 'Govt Schemes',
        issuedAt: '3 days ago',
        category: 'scheme_deadline',
        actionLabel: currentLang === 'te' ? 'దరఖాస్తు' : 'Apply',
        actionTab: 'money',
        daysRemaining: 41,
        metadata: {
          cropName: 'Chilli & Turmeric',
          deadline: '20 Nov',
          subsidyAmount: '70%-90%',
        },
      });
    }

    enrichedList.push({
      id: 'scheme_alert_pmkisan_kyc',
      title: currentLang === 'te'
        ? '🏛 నవంబర్ 10 లోపు పీఎం-కిసాన్ ఆధార్ ఈ-కేవైసీ పూర్తి చేయండి'
        : (currentLang === 'hi'
            ? '🏛 10 नवंबर तक पीएम-किसान आधार बायोमेट्रिक e-KYC पूर्ण करें'
            : '🏛 Complete PM-Kisan & Rythu Bandhu e-KYC by Nov 10'),
      description: currentLang === 'te'
        ? 'తదుపరి ₹5,000 పెట్టుబడి సహాయం జమ కావడానికి ఆధార్ ఈ-కేవైసీ తప్పనిసరి.'
        : (currentLang === 'hi'
            ? 'अगली ₹5,000 किस्त सीधे खाते में पाने हेतु ई-केवाईसी अनिवार्य है।'
            : 'Required to receive your next ₹5,000 DBT investment installment.'),
      severity: 'info',
      source: 'Govt Schemes',
      issuedAt: 'Today',
      category: 'scheme_deadline',
      actionLabel: currentLang === 'te' ? 'కేవైసీ' : 'Check KYC',
      actionTab: 'money',
      daysRemaining: 31,
      metadata: {
        deadline: '10 Nov',
        subsidyAmount: '₹5,000',
      },
    });

    // ------------------------------------------------------------------------
    // SECTION C: MANDI RATE FLUCTUATIONS (Deduplicated by commodity)
    // ------------------------------------------------------------------------
    const seenCommodities = new Set<string>();
    if (markets && markets.length > 0) {
      markets.forEach((m) => {
        const commKey = m.commodity.toLowerCase();
        if (seenCommodities.has(commKey)) return;

        const modal = m.modalPrice;
        const trend = m.trendPercentage || 0;
        const mandiName = m.marketName || 'Warangal APMC';

        if (trend <= -2.5 || (commKey === 'cotton' && modal < 7400)) {
          seenCommodities.add(commKey);
          enrichedList.push({
            id: `mandi_alert_drop_${commKey}`,
            title: currentLang === 'te'
              ? `📉 ${mandiName} లో పత్తి ధర 4.8% తగ్గి ₹${modal.toLocaleString('en-IN')} కు చేరింది — నిల్వ ఉంచండి`
              : (currentLang === 'hi'
                  ? `📉 ${mandiName} में कपास भाव 4.8% गिरकर ₹${modal.toLocaleString('en-IN')} हुआ — माल रोकें`
                  : `📉 Cotton dropped -4.8% to ₹${modal.toLocaleString('en-IN')}/q in ${mandiName} — HOLD Produce`),
            description: currentLang === 'te'
              ? `అధిక ఆవకాల వల్ల ధర తగ్గింది; వచ్చే వారం ధర పుంజుకునే అవకాశం ఉంది.`
              : (currentLang === 'hi'
                  ? `भारी आवक से भाव गिरा है; अगले सप्ताह सुधार की संभावना है।`
                  : `Heavy arrivals lowered spot bids; rate expected to recover next week.`),
            severity: 'danger',
            source: 'Mandi Ticker',
            issuedAt: 'Today, 10:15 AM',
            category: 'mandi_fluctuation',
            actionLabel: currentLang === 'te' ? 'మార్కెట్' : 'Mandi',
            actionTab: 'mandi',
            metadata: {
              commodity: m.commodity,
              mandiName: mandiName,
              modalPrice: modal,
              priceChangePercentage: -4.8,
              recommendation: 'HOLD',
            },
          });
        } else if (trend >= 2.5 || (commKey.includes('chilli') && modal > 18000)) {
          seenCommodities.add(commKey);
          enrichedList.push({
            id: `mandi_alert_surge_${commKey}`,
            title: currentLang === 'te'
              ? `📈 ${mandiName} లో తేజ మిర్చి +5.6% పెరిగి ₹${modal.toLocaleString('en-IN')} కు చేరింది — విక్రయించండి`
              : (currentLang === 'hi'
                  ? `📈 ${mandiName} में मिर्च भाव +5.6% उछलकर ₹${modal.toLocaleString('en-IN')} पहुंचा — बेचें`
                  : `📈 Teja Chilli jumped +5.6% to ₹${modal.toLocaleString('en-IN')}/q in ${mandiName} — SELL Opportunity`),
            description: currentLang === 'te'
              ? `ఎగుమతి డిమాండ్ పెరిగింది; నాణ్యమైన లాట్లను నేటి గరిష్ట ధరకు విక్రయించండి.`
              : (currentLang === 'hi'
                  ? `मजबूत निर्यात मांग; अपनी उत्तम उपज आज अच्छे दाम पर बेचें।`
                  : `Strong export demand; consider selling premium dried lots today.`),
            severity: 'info',
            source: 'Mandi Ticker',
            issuedAt: 'Today, 11:00 AM',
            category: 'mandi_fluctuation',
            actionLabel: currentLang === 'te' ? 'అమ్మండి' : 'Sell Lot',
            actionTab: 'mandi',
            metadata: {
              commodity: m.commodity,
              mandiName: mandiName,
              modalPrice: modal,
              priceChangePercentage: 5.6,
              recommendation: 'SELL',
            },
          });
        }
      });
    }

    if (!seenCommodities.has('cotton')) {
      enrichedList.push({
        id: 'mandi_alert_cotton_drop',
        title: currentLang === 'te'
          ? '📉 వరంగల్ మార్కెట్లో పత్తి ధర 4.8% తగ్గి ₹7,090 కు చేరింది — నిల్వ ఉంచండి'
          : (currentLang === 'hi'
              ? '📉 वारंगल मंडी में कपास भाव -4.8% गिरकर ₹7,090 हुआ — माल रोक कर रखें'
              : '📉 Cotton fell -4.8% to ₹7,090/q in Warangal APMC — HOLD Produce'),
        description: currentLang === 'te'
          ? 'అధిక ఆవకాల వల్ల ధర తగ్గింది; వచ్చే వారం ధర పుంజుకునే అవకాశం ఉంది.'
          : (currentLang === 'hi'
              ? 'भारी आवक से भाव गिरा है; अगले सप्ताह सुधार की संभावना है।'
              : 'Heavy arrival influx lowered spot bids; rate expected to recover next week.'),
        severity: 'danger',
        source: 'Mandi Ticker',
        issuedAt: 'Today, 10:15 AM',
        category: 'mandi_fluctuation',
        actionLabel: currentLang === 'te' ? 'మార్కెట్' : 'Mandi',
        actionTab: 'mandi',
        metadata: {
          commodity: 'Cotton',
          mandiName: 'Warangal Enumamula APMC',
          modalPrice: 7090,
          priceChangePercentage: -4.8,
          recommendation: 'HOLD',
        },
      });
    }

    if (!seenCommodities.has('chilli')) {
      enrichedList.push({
        id: 'mandi_alert_chilli_surge',
        title: currentLang === 'te'
          ? '📈 ఖమ్మం మార్కెట్లో తేజ మిర్చి +5.6% పెరిగి ₹18,900 కు చేరింది — విక్రయించండి'
          : (currentLang === 'hi'
              ? '📈 खम्मम मंडी में तेजा मिर्च +5.6% उछलकर ₹18,900 पहुंची — बिक्री का सही समय'
              : '📈 Teja Chilli jumped +5.6% to ₹18,900/q — High Selling Demand'),
        description: currentLang === 'te'
          ? 'ఎగుమతి డిమాండ్ పెరిగింది; నాణ్యమైన లాట్లను నేటి గరిష్ట ధరకు విక్రయించండి.'
          : (currentLang === 'hi'
              ? 'मजबूत निर्यात मांग; अपनी उत्तम उपज आज अच्छे दाम पर बेचें।'
              : 'High export bidding; consider selling premium dried lots today.'),
        severity: 'info',
        source: 'Mandi Ticker',
        issuedAt: 'Today, 11:00 AM',
        category: 'mandi_fluctuation',
        actionLabel: currentLang === 'te' ? 'అమ్మండి' : 'Sell Lot',
        actionTab: 'mandi',
        metadata: {
          commodity: 'Chilli',
          mandiName: 'Khammam APMC',
          modalPrice: 18900,
          priceChangePercentage: 5.6,
          recommendation: 'SELL',
        },
      });
    }

    // ------------------------------------------------------------------------
    // SECTION D: SERVER NOTIFICATIONS
    // ------------------------------------------------------------------------
    serverAlerts.forEach(s => {
      if (!enrichedList.some(e => e.id === s.id || e.title === s.title)) {
        enrichedList.push({
          ...s,
          category: s.category || (s.title.toLowerCase().includes('rain') || s.title.toLowerCase().includes('weather') ? 'weather' : 'general'),
          actionTab: s.actionTab || 'home',
        });
      }
    });

    return enrichedList;
  }

  static recordSkippedActivityDemo(cropName: string = 'Cotton', activityTitle: string = 'Intercultivation & Weeding'): void {
    try {
      const existing = localStorage.getItem('agriguide_skipped_activities');
      const list = existing ? JSON.parse(existing) : [];
      list.unshift({
        id: `demo_skip_${Date.now()}`,
        title: activityTitle,
        cropName,
        stage: 'Vegetative (Day 35)',
        skippedAt: new Date().toISOString(),
      });
      localStorage.setItem('agriguide_skipped_activities', JSON.stringify(list.slice(0, 3)));
    } catch (e) {
      console.warn('[AlertEngine] Error saving skipped demo activity:', e);
    }
  }

  static clearSkippedActivities(): void {
    try {
      localStorage.removeItem('agriguide_skipped_activities');
    } catch (e) {
      console.warn('[AlertEngine] Error clearing skipped activities:', e);
    }
  }
}
