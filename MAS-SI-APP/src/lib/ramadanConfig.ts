import { useMemo } from 'react';

// Ramadan 2026 date range
// First night of Taraweeh prayers: Feb 17, 2026
// Last night: March 19, 2026
export const RAMADAN_CONFIG = {
  startDate: new Date(2026, 1, 17), // Feb 17, 2026 (months are 0-indexed)
  endDate: new Date(2026, 2, 20),   // March 20, 2026 (end of day March 19)
};

// Toggle for testing:
// null  = auto (date-based)
// true  = force Ramadan mode ON
// false = force Ramadan mode OFF
export const FORCE_RAMADAN_MODE: boolean | null = null;

/**
 * Plain function to check if Ramadan is currently active.
 * Use in non-hook contexts (event handlers, async functions, etc.)
 */
export function isRamadanActive(): boolean {
  if (FORCE_RAMADAN_MODE !== null) return FORCE_RAMADAN_MODE;
  const now = new Date();
  return now >= RAMADAN_CONFIG.startDate && now < RAMADAN_CONFIG.endDate;
}

/**
 * React hook that returns whether Ramadan mode is active.
 * Use at the top level of React components.
 */
export function useIsRamadan(): boolean {
  return useMemo(() => isRamadanActive(), []);
}
