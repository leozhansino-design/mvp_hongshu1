/**
 * Cache utility functions - pure functions without external dependencies
 */

/**
 * Generate a cache key based on device and birth info parameters
 * Used to ensure same user + same info returns consistent results
 */
export function generateCacheKey(params: {
  deviceId: string;
  name: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  gender: string;
  isLunar: boolean;
  curveMode: 'life' | 'wealth';
  isPaid: boolean;
}): string {
  const str = [
    params.deviceId,
    params.name,
    params.year,
    params.month,
    params.day,
    params.hour,
    params.gender,
    params.isLunar ? 'lunar' : 'solar',
    params.curveMode,
    params.isPaid ? 'paid' : 'free',
  ].join('|');

  // Use simple hash algorithm (client-compatible)
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  // Convert to hex string and pad
  const hashHex = Math.abs(hash).toString(16).padStart(8, '0');
  // Add version prefix to avoid permanent cache issues
  return `v1_${hashHex}_${str.length}`;
}
