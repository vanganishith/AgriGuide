/**
 * Indian Standard Time (IST) Date and Crop-Age Utilities
 * Timezone: Asia/Kolkata (UTC +05:30)
 */

/**
 * Returns today's calendar date in Asia/Kolkata timezone as 'YYYY-MM-DD'
 */
export function getTodayISTDateString(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

/**
 * Formats any Date object, timestamp number, or ISO string into an IST calendar date 'YYYY-MM-DD'
 */
export function formatToISTDateString(date: Date | string | number): string {
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

/**
 * Formats an IST date string 'YYYY-MM-DD' for user display (e.g. '10 Oct')
 */
export function formatISTDateForDisplay(dateStr: string | null | undefined, lang: string = 'en'): string {
  if (!dateStr) return '';
  try {
    const cleanDate = dateStr.slice(0, 10);
    const [year, month, day] = cleanDate.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    
    const locale = lang === 'te' ? 'te-IN' : (lang === 'hi' ? 'hi-IN' : 'en-IN');
    return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

/**
 * Calculates displayed crop day and normalized sowing date in Indian Standard Time.
 * 
 * Rule:
 * If an authoritative timestamp exists:
 *   elapsedMs = now - sowingTimestamp
 *   completedDays = Math.floor(elapsedMs / 86400000)
 *   displayedDay = Math.max(1, completedDays + 1)
 * 
 * If date-only string 'YYYY-MM-DD' exists:
 *   diffDays = todayIST - sowingDateIST
 *   displayedDay = Math.max(1, diffDays + 1)
 */
export function calculateCropAgeIST(
  sowingDateOrTimestamp: string | null | undefined,
  createdAtTimestamp?: string | null
): { cropDay: number; sowingDateStr: string } {
  const todayIST = getTodayISTDateString();
  
  if (!sowingDateOrTimestamp && !createdAtTimestamp) {
    return { cropDay: 1, sowingDateStr: todayIST };
  }

  // 1. Check if we have an authoritative ISO timestamp with exact time
  const exactIso = (sowingDateOrTimestamp && sowingDateOrTimestamp.includes('T'))
    ? sowingDateOrTimestamp
    : (createdAtTimestamp && createdAtTimestamp.includes('T'))
      ? createdAtTimestamp
      : null;

  if (exactIso) {
    const sowingTimeMs = new Date(exactIso).getTime();
    const nowMs = Date.now();
    const elapsedMs = nowMs - sowingTimeMs;
    const sowingISTDate = formatToISTDateString(exactIso);

    if (elapsedMs >= 0) {
      const completedDays = Math.floor(elapsedMs / (24 * 60 * 60 * 1000));
      return {
        cropDay: Math.max(1, completedDays + 1),
        sowingDateStr: sowingDateOrTimestamp ? sowingDateOrTimestamp.slice(0, 10) : sowingISTDate,
      };
    }
  }

  // 2. Date-only calculation in Asia/Kolkata
  const sowingDateStr = (sowingDateOrTimestamp || '').slice(0, 10) || todayIST;
  const [sYear, sMonth, sDay] = sowingDateStr.split('-').map(Number);
  const [tYear, tMonth, tDay] = todayIST.split('-').map(Number);

  const sUtc = Date.UTC(sYear, (sMonth || 1) - 1, sDay || 1);
  const tUtc = Date.UTC(tYear, (tMonth || 1) - 1, tDay || 1);

  const diffDays = Math.floor((tUtc - sUtc) / (24 * 60 * 60 * 1000));
  return {
    cropDay: Math.max(1, diffDays + 1),
    sowingDateStr,
  };
}
