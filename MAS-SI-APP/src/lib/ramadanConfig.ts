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

// ============================================
// TARAWEEH TIME HELPERS
// ============================================

function convertTo24Hour(timeStr: string): string {
  const period = timeStr.slice(-2).toUpperCase();
  const [hourStr, minuteStr] = timeStr.slice(0, -2).split(":");
  let hour = parseInt(hourStr, 10);

  if (period === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period === 'AM' && hour === 12) {
    hour = 0;
  }

  const hh = hour.toString().padStart(2, '0');
  const mm = minuteStr.padStart(2, '0');
  return `${hh}:${mm}:00`;
}

function setTimeToCurrentDate(timeString: string): Date {
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, seconds, 0);
  return date;
}

export interface TaraweehTimes {
  firstStart: Date;
  firstEnd: number;
  secondStart: number;
  secondEnd: number;
}

/**
 * Calculates all four Taraweeh session times from the Isha iqamah time string.
 * Session 1: starts at Isha iqamah, ends 1 hour later
 * Session 2: starts 1h30m after Isha iqamah, ends 2h30m after
 */
export function getTaraweehTimes(ishaIqamahTime: string): TaraweehTimes {
  const firstStart = setTimeToCurrentDate(convertTo24Hour(ishaIqamahTime));
  const firstEnd = new Date(firstStart).setHours(firstStart.getHours() + 1);
  const secondStart = new Date(firstStart).setHours(firstStart.getHours() + 1, firstStart.getMinutes() + 30);
  const secondEnd = new Date(firstStart).setHours(firstStart.getHours() + 2, firstStart.getMinutes() + 30);

  return { firstStart, firstEnd, secondStart, secondEnd };
}
