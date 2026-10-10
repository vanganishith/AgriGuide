/**
 * Indian Standard Time (IST) Date and Crop-Age Utilities for Node.js Backend
 * Timezone: Asia/Kolkata (UTC +05:30)
 */

export function getTodayISTDateString() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

export function formatToISTDateString(date) {
  if (!date) return getTodayISTDateString();
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return getTodayISTDateString();

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(d);
}

export function addDaysIST(dateStr, days) {
  const cleanDate = (dateStr || getTodayISTDateString()).slice(0, 10);
  const [year, month, day] = cleanDate.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + days);
  
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dt = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dt}`;
}

export function calculateCropDayIST(sowingDateStr, targetDateStr = null, createdAtTimestamp = null) {
  const todayIST = getTodayISTDateString();
  const targetIST = targetDateStr ? targetDateStr.slice(0, 10) : todayIST;

  // 1. If we have exact createdAt timestamp and target is today
  if (createdAtTimestamp && String(createdAtTimestamp).includes('T') && targetIST === todayIST) {
    const elapsedMs = Date.now() - new Date(createdAtTimestamp).getTime();
    if (elapsedMs >= 0) {
      const completedDays = Math.floor(elapsedMs / (24 * 60 * 60 * 1000));
      return Math.max(1, completedDays + 1);
    }
  }

  // 2. Date-only comparison in IST
  const sowingIST = (sowingDateStr || '').slice(0, 10) || (createdAtTimestamp ? formatToISTDateString(createdAtTimestamp) : targetIST);
  const [sYear, sMonth, sDay] = sowingIST.split('-').map(Number);
  const [tYear, tMonth, tDay] = targetIST.split('-').map(Number);

  const sUtc = Date.UTC(sYear, (sMonth || 1) - 1, sDay || 1);
  const tUtc = Date.UTC(tYear, (tMonth || 1) - 1, tDay || 1);

  const diffDays = Math.floor((tUtc - sUtc) / (24 * 60 * 60 * 1000));
  return Math.max(1, diffDays + 1);
}

export function calculateElapsedDaysIST(sowingTimestamp) {
  if (!sowingTimestamp) return 1;
  const sowingMs = new Date(sowingTimestamp).getTime();
  if (isNaN(sowingMs)) return 1;
  const elapsedMs = Date.now() - sowingMs;
  if (elapsedMs < 0) return 1;
  const completedDays = Math.floor(elapsedMs / (24 * 60 * 60 * 1000));
  return Math.max(1, completedDays + 1);
}

export function formatISTDateForDisplay(dateStr, lang = 'en') {
  if (!dateStr) return '';
  try {
    const cleanDate = dateStr.slice(0, 10);
    const [year, month, day] = cleanDate.split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    const locale = lang === 'te' ? 'te-IN' : (lang === 'hi' ? 'hi-IN' : 'en-IN');
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      timeZone: 'Asia/Kolkata',
    }).format(d);
  } catch {
    return dateStr;
  }
}

