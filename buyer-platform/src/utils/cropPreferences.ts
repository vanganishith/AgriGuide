import type { SellingLot } from '../types/marketplace';

/**
 * Normalizes a crop string for fuzzy matching (lowercase, stripped punctuation, normalized whitespace).
 */
export function normalizeCropName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[()[\]{}_,.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks whether a produce lot matches a preferred crop preference string.
 */
export function matchesCrop(
  lotCropName: string,
  lotVariety: string | undefined | null,
  preferredCrop: string
): boolean {
  if (!lotCropName || !preferredCrop) return false;

  const normLot = normalizeCropName(lotCropName);
  const normVar = normalizeCropName(lotVariety || '');
  const normPref = normalizeCropName(preferredCrop);
  const combinedLot = `${normLot} ${normVar}`.trim();

  // 1. Direct equality
  if (normLot === normPref || combinedLot === normPref) return true;

  // 2. Substring inclusion
  if (combinedLot.includes(normPref) || normPref.includes(normLot)) return true;

  // 3. Significant word token matching (words with >= 3 characters)
  const prefTokens = normPref.split(' ').filter((w) => w.length >= 3);
  const lotTokens = combinedLot.split(' ').filter((w) => w.length >= 3);

  // E.g. "rice" or "paddy" in "Rice (Paddy)" matches "Paddy" or "Rice"
  for (const token of prefTokens) {
    if (lotTokens.includes(token)) return true;
  }

  return false;
}

/**
 * Determines the preference rank of a lot based on the buyer's preferred crops list.
 * Returns { rank, matchedCrop }:
 *  rank: 0 for 1st preference, 1 for 2nd preference, etc. Returns 9999 if no match.
 */
export function getLotPreferenceRank(
  lot: SellingLot,
  preferredCrops?: string[]
): { rank: number; matchedCrop?: string } {
  if (!preferredCrops || !Array.isArray(preferredCrops) || preferredCrops.length === 0) {
    return { rank: 9999 };
  }

  for (let i = 0; i < preferredCrops.length; i++) {
    const pref = preferredCrops[i];
    if (matchesCrop(lot.crop_name, lot.variety, pref)) {
      return { rank: i, matchedCrop: pref };
    }
  }

  return { rank: 9999 };
}

/**
 * Sorts selling lots based on the buyer's preferred crop priority order:
 * 1. Lots matching the 1st preferred crop appear first.
 * 2. Lots matching the 2nd preferred crop appear second.
 * 3. Lots matching subsequent preferred crops appear next in exact order.
 * 4. Lots that don't match any preference appear last, ordered by created_at DESC (newest).
 * 5. Within the same preference rank, lots are ordered by created_at DESC (newest).
 */
export function sortLotsByBuyerPreferences(
  lots: SellingLot[],
  preferredCrops?: string[]
): SellingLot[] {
  if (!lots || lots.length === 0) return [];
  if (!preferredCrops || !Array.isArray(preferredCrops) || preferredCrops.length === 0) {
    // If no preferences specified, preserve newest-first date ordering
    return [...lots].sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });
  }

  return [...lots].sort((a, b) => {
    const { rank: rankA } = getLotPreferenceRank(a, preferredCrops);
    const { rank: rankB } = getLotPreferenceRank(b, preferredCrops);

    // 1. Primary order: preference rank (lower index = higher priority)
    if (rankA !== rankB) {
      return rankA - rankB;
    }

    // 2. Secondary order: newest upload date
    const dateA = new Date(a.created_at || 0).getTime();
    const dateB = new Date(b.created_at || 0).getTime();
    return dateB - dateA;
  });
}
