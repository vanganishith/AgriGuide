import { supabase, isSupabaseConfigured, getOrCreateDefaultFarmerUser } from '../../config/supabase.js';
import { getCurrentWeather } from '../weather/weatherService.js';
import { generateDailyActivitiesForCropDay, getCropGrowthStage } from './cropDailyActivityEngine.js';
import {
  getTodayISTDateString,
  formatToISTDateString,
  calculateCropDayIST,
  addDaysIST
} from '../../utils/istDateUtils.js';

/**
 * Helper to compute date difference in full calendar days using IST Asia/Kolkata timezone.
 * Treat crop start date as DAY 1.
 * crop_day = current_date - crop_start_date + 1
 */
export function calculateCropDay(sowingDateStr, targetDateStr = null, createdAt = null) {
  return calculateCropDayIST(sowingDateStr, targetDateStr, createdAt);
}

/**
 * Format Date object to YYYY-MM-DD in Asia/Kolkata
 */
export function formatDate(date) {
  return formatToISTDateString(date);
}

/**
 * Add days to a YYYY-MM-DD string
 */
export function addDays(dateStr, days) {
  return addDaysIST(dateStr, days);
}

/**
 * Get or create 15-day rolling activity window for a specific crop plot
 */
export async function getCropDailyActivities({
  plotId,
  user = null,
  windowDays = 15,
  language = 'en'
}) {
  let userId = user?.id || null;
  if (!userId) {
    userId = await getOrCreateDefaultFarmerUser();
  }

  if (!isSupabaseConfigured() || !userId) {
    throw new Error('Supabase database is not configured or farmer identity is missing.');
  }

  // 1. Fetch the crop plot and its farm
  const { data: plot, error: plotErr } = await supabase
    .from('farm_plots')
    .select(`
      *,
      farms:farm_id (
        id,
        user_id,
        farm_name,
        total_acres,
        soil_type,
        irrigation_source,
        latitude,
        longitude
      )
    `)
    .eq('id', plotId)
    .eq('user_id', userId)
    .single();

  if (plotErr || !plot) {
    const error = new Error('Crop plot not found or does not belong to this farmer.');
    error.statusCode = 404;
    throw error;
  }

  const farm = plot.farms || {};
  const todayStr = getTodayISTDateString();
  const sowingDateStr = plot.sowing_date || todayStr;
  const currentCropDay = calculateCropDay(sowingDateStr, todayStr, plot.created_at);

  // 2. Fetch live weather for the farm location
  let liveWeather = null;
  try {
    const { data: profile } = await supabase.from('profiles').select('district, state').eq('id', userId).single();
    const district = profile?.district || 'Warangal';
    const state = profile?.state || 'Telangana';
    liveWeather = await getCurrentWeather({
      latitude: farm.latitude ? Number(farm.latitude) : 17.9689,
      longitude: farm.longitude ? Number(farm.longitude) : 79.5941,
      district,
      state
    });
  } catch (wErr) {
    console.warn('[CropActivityService] Live weather lookup notice:', wErr.message);
  }

  // 3. Determine the Past 15 Days History Window (Up to Today only - No future days)
  const startDay = Math.max(1, currentCropDay - (windowDays - 1));
  const targetDays = [];
  for (let dayNum = startDay; dayNum <= currentCropDay; dayNum++) {
    const dayOffset = dayNum - 1;
    const dateForDay = addDays(sowingDateStr, dayOffset);
    targetDays.push({
      cropDay: dayNum,
      date: dateForDay,
      isToday: dayNum === currentCropDay,
      isPast: dayNum < currentCropDay,
      isFuture: false,
    });
  }

  const startDateStr = targetDays[0].date;

  // 4. Fetch existing persisted activities from Supabase recommendations table (Past 15 days + Today)
  const { data: existingRows, error: recErr } = await supabase
    .from('recommendations')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', addDays(startDateStr, -2) + 'T00:00:00Z');

  if (recErr) {
    console.warn('[CropActivityService] Error fetching recommendations:', recErr.message);
  }

  // Filter recommendations specifically belonging to this plot
  const plotActivities = (existingRows || []).filter(r => {
    const inputs = r.inputs_used || {};
    return inputs.crop_id === plot.id || inputs.plot_id === plot.id || (r.crop_target && r.crop_target.includes(plot.current_crop));
  });

  // Map existing activities by `activity_date` + `category`
  const existingMap = new Map();
  plotActivities.forEach(r => {
    const inputs = r.inputs_used || {};
    const actDate = inputs.activity_date || r.deadline || formatDate(r.created_at);
    const cat = inputs.category || r.category || 'general';
    const key = `${actDate}_${cat}`;
    existingMap.set(key, r);
  });

  // 5. Check for MISSED activities on past dates and create real alerts
  const newAlertsToInsert = [];
  const missedUpdates = [];

  // Fetch recent alerts to prevent duplicate alert insertion
  const { data: existingAlerts } = await supabase
    .from('alerts')
    .select('id, affected_districts')
    .order('issued_at', { ascending: false })
    .limit(50);

  for (const act of plotActivities) {
    const inputs = act.inputs_used || {};
    const actDate = inputs.activity_date || act.deadline || formatDate(act.created_at);
    const currentStatus = inputs.status || (act.is_completed ? 'completed' : 'pending');

    // If past date and still pending -> mark as missed
    if (actDate < todayStr && currentStatus === 'pending' && !act.is_completed) {
      inputs.status = 'missed';
      inputs.missed_at = new Date().toISOString();

      missedUpdates.push(
        supabase
          .from('recommendations')
          .update({
            inputs_used: inputs,
            urgency: 'high',
          })
          .eq('id', act.id)
      );

      // Check if alert already exists for this activity
      const activityTag = `activity:${act.id}`;
      const alertAlreadyExists = (existingAlerts || []).some(a => 
        (a.affected_districts || []).includes(activityTag)
      );

      if (!alertAlreadyExists && newAlertsToInsert.length < 3) {
        newAlertsToInsert.push({
          title: `⚠️ Missed Farm Activity: ${plot.current_crop}`,
          description: `Scheduled ${inputs.category ? inputs.category.replace('_', ' ') : 'farm task'} ("${act.action_title}") on Day ${inputs.crop_day || calculateCropDay(sowingDateStr, actDate)} (${actDate}) was not completed.`,
          severity: 'warning',
          affected_districts: [
            farm.district || 'Warangal',
            `user:${userId}`,
            `crop:${plot.id}`,
            activityTag,
          ],
          source: 'AgriGuide Activity Monitor',
          issued_at: new Date().toISOString(),
        });
      }
    }
  }

  // Execute missed status updates & alert creation
  if (missedUpdates.length > 0) {
    await Promise.all(missedUpdates);
  }
  if (newAlertsToInsert.length > 0) {
    try {
      await supabase.from('alerts').insert(newAlertsToInsert);
    } catch (aErr) {
      console.warn('[CropActivityService] Error creating missed alerts:', aErr.message);
    }
  }

  // 6. Extract recent 2-3 days activities for AI analysis
  const recentHistory = [];
  plotActivities.forEach(r => {
    const inputs = r.inputs_used || {};
    const actDate = inputs.activity_date || r.deadline || formatDate(r.created_at);
    const day = Number(inputs.crop_day) || calculateCropDay(sowingDateStr, actDate);
    if (day >= Math.max(1, currentCropDay - 3) && day < currentCropDay) {
      recentHistory.push({
        id: r.id,
        activityDate: actDate,
        cropDay: day,
        category: inputs.category || r.category,
        actionTitle: r.action_title,
        status: inputs.status || (r.is_completed ? 'completed' : 'missed'),
        isCompleted: Boolean(r.is_completed),
      });
    }
  });

  // 7. Generate TODAY'S Plan ONLY (analyzing weather, soil, crop, and past 2-3 days activity)
  const todayEngineResult = generateDailyActivitiesForCropDay({
    cropName: plot.current_crop,
    variety: plot.variety || '',
    cropDay: currentCropDay,
    activityDate: todayStr,
    soilType: farm.soil_type || 'Black Cotton Soil',
    irrigationType: farm.irrigation_source || 'Drip Irrigation',
    acres: Number(plot.acres) || 1.0,
    district: farm.district || 'Warangal',
    state: farm.state || 'Telangana',
    weather: liveWeather,
    language,
    recentHistory,
  });

  const generatedTodayActivities = todayEngineResult.activities || [];
  const recentHistoryAnalysis = todayEngineResult.analysis || {};

  // Insert today's activities into Supabase recommendations if not already present
  const todayInserts = [];
  for (const genAct of generatedTodayActivities) {
    const key = `${todayStr}_${genAct.category}`;
    if (!existingMap.has(key)) {
      const inputsData = {
        crop_id: plot.id,
        plot_id: plot.id,
        farm_id: farm.id || plot.farm_id,
        crop_name: plot.current_crop,
        variety: plot.variety,
        crop_day: currentCropDay,
        activity_date: todayStr,
        category: genAct.category,
        priority: genAct.priority,
        status: 'pending',
        concise_description: genAct.conciseDescription,
        source_context: genAct.sourceContext,
        weather_context: genAct.weatherContext,
        soil_type: farm.soil_type || 'Black Cotton Soil',
        irrigation_type: farm.irrigation_source || 'Drip Irrigation',
        stage: genAct.stage,
        stage_te: genAct.stageTe,
        stage_hi: genAct.stageHi,
        created_at: new Date().toISOString(),
        completed_at: null,
        missed_at: null,
      };

      todayInserts.push({
        user_id: userId,
        action_title: genAct.title,
        crop_target: `${plot.current_crop} (${plot.acres} Acres)`,
        reason: genAct.conciseDescription,
        deadline: todayStr,
        urgency: genAct.priority,
        category: genAct.category === 'crop_scouting' ? 'pest' : (genAct.category === 'weather_protection' ? 'irrigation' : genAct.category),
        weather_context: genAct.weatherContext,
        source: genAct.sourceContext,
        inputs_used: inputsData,
        is_completed: false,
      });
    }
  }

  if (todayInserts.length > 0) {
    const { data: insertedToday, error: todayInsErr } = await supabase
      .from('recommendations')
      .insert(todayInserts)
      .select();

    if (todayInsErr) {
      console.warn('[CropActivityService] Error inserting today activities:', todayInsErr.message);
    } else if (insertedToday) {
      insertedToday.forEach(r => {
        const inputs = r.inputs_used || {};
        const actDate = inputs.activity_date || r.deadline || formatDate(r.created_at);
        const cat = inputs.category || r.category || 'general';
        const key = `${actDate}_${cat}`;
        existingMap.set(key, r);
      });
    }
  }

  // 8. Format all activities in the past 15-day history window + Today
  const allFormattedActivities = [];
  targetDays.forEach(dayInfo => {
    existingMap.forEach((rec) => {
      const inputs = rec.inputs_used || {};
      const actDate = inputs.activity_date || rec.deadline || formatDate(rec.created_at);
      if (actDate === dayInfo.date) {
        allFormattedActivities.push({
          id: rec.id,
          cropId: plot.id,
          farmId: farm.id || plot.farm_id,
          farmerId: userId,
          activityDate: actDate,
          cropDay: inputs.crop_day || dayInfo.cropDay,
          title: rec.action_title,
          conciseDescription: inputs.concise_description || rec.reason,
          category: inputs.category || rec.category || 'crop_scouting',
          priority: inputs.priority || rec.urgency || 'medium',
          status: inputs.status || (rec.is_completed ? 'completed' : (dayInfo.isPast ? 'missed' : 'pending')),
          isCompleted: Boolean(rec.is_completed),
          sourceContext: rec.source,
          weatherContext: rec.weather_context,
          stage: inputs.stage || getCropGrowthStage(plot.current_crop, dayInfo.cropDay).stage,
          stageTe: inputs.stage_te || getCropGrowthStage(plot.current_crop, dayInfo.cropDay).stageTe,
          stageHi: inputs.stage_hi || getCropGrowthStage(plot.current_crop, dayInfo.cropDay).stageHi,
          createdAt: rec.created_at,
          completedAt: inputs.completed_at || null,
          missedAt: inputs.missed_at || null,
        });
      }
    });
  });

  // Timeline summary per day (Past Days History + Today)
  const timeline15Days = targetDays.map(dayInfo => {
    const dayActs = allFormattedActivities.filter(a => a.activityDate === dayInfo.date);
    const completedCount = dayActs.filter(a => a.status === 'completed' || a.isCompleted).length;
    const missedCount = dayActs.filter(a => a.status === 'missed').length;
    const pendingCount = dayActs.filter(a => a.status === 'pending').length;

    let dayStatus = 'pending';
    if (dayActs.length > 0 && completedCount === dayActs.length) dayStatus = 'completed';
    else if (missedCount > 0) dayStatus = 'missed';
    else if (completedCount > 0) dayStatus = 'in_progress';

    return {
      cropDay: dayInfo.cropDay,
      date: dayInfo.date,
      isToday: dayInfo.isToday,
      isPast: dayInfo.isPast,
      isFuture: false,
      activitiesCount: dayActs.length,
      completedCount,
      missedCount,
      pendingCount,
      status: dayStatus,
      stage: getCropGrowthStage(plot.current_crop, dayInfo.cropDay).stage,
      stageTe: getCropGrowthStage(plot.current_crop, dayInfo.cropDay).stageTe,
      stageHi: getCropGrowthStage(plot.current_crop, dayInfo.cropDay).stageHi,
    };
  });

  const todayActivities = allFormattedActivities.filter(a => a.activityDate === todayStr);

  return {
    cropHeader: {
      cropId: plot.id,
      farmId: farm.id || plot.farm_id,
      farmName: farm.farm_name || 'My Farm',
      cropName: plot.current_crop,
      variety: plot.variety || 'Standard Variety',
      cropDay: currentCropDay,
      sowingDate: sowingDateStr,
      acres: Number(plot.acres) || 1.0,
      stage: getCropGrowthStage(plot.current_crop, currentCropDay).stage,
      stageTe: getCropGrowthStage(plot.current_crop, currentCropDay).stageTe,
      stageHi: getCropGrowthStage(plot.current_crop, currentCropDay).stageHi,
      status: plot.status || 'healthy',
      createdAt: plot.created_at,
    },
    conditions: {
      soilType: farm.soil_type || 'Black Cotton Soil',
      irrigationType: farm.irrigation_source || 'Drip Irrigation',
      district: farm.district || 'Warangal',
      state: farm.state || 'Telangana',
      location: `${farm.district || 'Warangal'}, ${farm.state || 'Telangana'}`,
      weather: liveWeather ? {
        temperature: liveWeather.temperature,
        rainfallProbability: liveWeather.rainfallProbability,
        windSpeedKmH: liveWeather.windSpeedKmH,
        conditionText: liveWeather.conditionText,
        sprayCondition: liveWeather.sprayCondition,
        source: 'Live Open-Meteo / IMD Feed',
      } : {
        temperature: 28,
        rainfallProbability: 0,
        windSpeedKmH: 10,
        conditionText: 'Weather sync unavailable',
        sprayCondition: 'safe',
        source: 'Regional Baseline (Weather unavailable)',
      },
    },
    recentHistoryAnalysis,
    todayActivities,
    timeline15Days,
    allActivities: allFormattedActivities,
  };
}

/**
 * Update activity status: completed, skipped, or pending
 */
export async function updateActivityStatus({
  activityId,
  status = 'completed',
  user = null
}) {
  let userId = user?.id || null;
  if (!userId) {
    userId = await getOrCreateDefaultFarmerUser();
  }

  if (!isSupabaseConfigured() || !userId) {
    throw new Error('Supabase database is not configured.');
  }

  const { data: rec, error: getErr } = await supabase
    .from('recommendations')
    .select('*')
    .eq('id', activityId)
    .eq('user_id', userId)
    .single();

  if (getErr || !rec) {
    const error = new Error('Activity not found or access unauthorized.');
    error.statusCode = 404;
    throw error;
  }

  const isCompleted = status === 'completed';
  const inputs = rec.inputs_used || {};
  inputs.status = status;
  if (isCompleted) {
    inputs.completed_at = new Date().toISOString();
  } else if (status === 'skipped') {
    inputs.skipped_at = new Date().toISOString();
    try {
      await supabase.from('alerts').insert({
        title: `⚠️ Skipped Activity: ${rec.action_title || 'Crop Milestone'}`,
        description: `You marked "${rec.action_title}" as skipped. Skipping essential agronomic operations can reduce crop vigor, decrease expected yield by 10-15%, and increase pest vulnerability. Recommended: review plot schedule and apply remediation.`,
        severity: 'danger',
        source: 'My Farm Schedule',
        affected_districts: [`user:${userId}`],
        issued_at: new Date().toISOString(),
      });
    } catch (aErr) {
      console.warn('[CropActivityService] Could not insert skipped activity alert:', aErr.message);
    }
  } else if (status === 'pending') {
    inputs.completed_at = null;
    inputs.skipped_at = null;
  }

  const { data: updated, error: upErr } = await supabase
    .from('recommendations')
    .update({
      is_completed: isCompleted,
      inputs_used: inputs,
    })
    .eq('id', activityId)
    .select()
    .single();

  if (upErr) {
    throw new Error(`Failed to update activity: ${upErr.message}`);
  }

  // Also log into completed_actions table if completed
  if (isCompleted) {
    try {
      await supabase.from('completed_actions').insert({
        user_id: userId,
        recommendation_id: activityId,
        action_name: rec.action_title,
        completed_at: new Date().toISOString(),
        notes: `Marked completed on ${new Date().toISOString().split('T')[0]}`,
      });
    } catch (cErr) {
      console.warn('[CropActivityService] Audit trail log notice:', cErr.message);
    }
  }

  return {
    id: updated.id,
    isCompleted: updated.is_completed,
    status: inputs.status,
    completedAt: inputs.completed_at,
  };
}

/**
 * Get farmer-isolated alerts from Supabase
 */
export async function getFarmerAlerts(user = null) {
  let userId = user?.id || null;
  if (!userId) {
    userId = await getOrCreateDefaultFarmerUser();
  }

  if (!isSupabaseConfigured() || !userId) {
    return [];
  }

  // Get user profile for district matching
  const { data: profile } = await supabase
    .from('profiles')
    .select('district, state')
    .eq('id', userId)
    .single();

  const userDistrict = profile?.district || 'Warangal';
  const userTag = `user:${userId}`;

  // Fetch alerts: either targeted to this farmer specifically (via user:tag in affected_districts) OR general public alert for user's district
  const { data: allAlerts, error } = await supabase
    .from('alerts')
    .select('*')
    .order('issued_at', { ascending: false })
    .limit(30);

  if (error) {
    console.warn('[CropActivityService] Error fetching alerts:', error.message);
    return [];
  }

  // Filter alerts strictly for this farmer
  const filteredAlerts = (allAlerts || []).filter(alert => {
    const districts = alert.affected_districts || [];
    const isUserSpecific = districts.some(d => d.startsWith('user:'));

    if (isUserSpecific) {
      // Must match THIS farmer
      return districts.includes(userTag);
    }

    // Otherwise it's a district-wide agronomic notice
    if (districts.length === 0) return true;
    return districts.includes(userDistrict) || districts.includes('All Districts');
  });

  return filteredAlerts.map(a => ({
    id: a.id,
    title: a.title,
    description: a.description,
    severity: a.severity,
    source: a.source,
    issuedAt: a.issued_at ? new Date(a.issued_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Today',
    affectedDistricts: a.affected_districts,
    isRead: false,
    createdAt: a.issued_at,
  }));
}
