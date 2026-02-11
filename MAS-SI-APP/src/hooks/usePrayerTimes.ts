import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase';
import { gettingPrayerData } from '@/src/types';
import { ThePrayerData } from '@/src/components/getPrayerData';
import { useState, useEffect, useMemo } from 'react';
import { format, parse, isAfter, isBefore, addDays, differenceInMilliseconds } from 'date-fns';

/**
 * Shared hook for current time - single timer used across all prayer time hooks
 * This prevents multiple timers running simultaneously (performance optimization)
 */
const useCurrentTime = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timerId);
    }, []);

    return currentTime;
};

/**
 * Utility function to parse a time string like "2:30 PM" into a Date object (today's date)
 */
const parseTime = (timeStr: string): Date => {
    const now = new Date();

    // 24-hour format: "05:39:00" or "17:30" or "5:39:00"
    const match24 = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (match24) {
        const result = new Date(now);
        result.setHours(parseInt(match24[1], 10), parseInt(match24[2], 10), 0, 0);
        return result;
    }

    // 12-hour format: "5:39 AM", "5:39AM", "5:39\u202FAM"
    const match12 = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match12) {
        let hours = parseInt(match12[1], 10);
        const minutes = parseInt(match12[2], 10);
        const period = match12[3].toUpperCase();
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        const result = new Date(now);
        result.setHours(hours, minutes, 0, 0);
        return result;
    }

    // Fallback
    const normalized = timeStr.replace(/[\u00A0\u202F]/g, ' ');
    return parse(normalized, 'h:mm a', now);
};

/**
 * Utility function to format current Date to time string for parsing
 */
const formatTimeStr = (date: Date): string => {
    return format(date, 'h:mm a');
};

/**
 * Utility function to get prayer times array
 */
const getPrayerTimesArray = (prayer: gettingPrayerData) => {
    return [
        { name: 'Fajr', time: prayer.athan_fajr, iqamah: prayer.iqa_fajr },
        { name: 'Dhuhr', time: prayer.athan_zuhr, iqamah: prayer.iqa_zuhr },
        { name: 'Asr', time: prayer.athan_asr, iqamah: prayer.iqa_asr },
        { name: 'Maghrib', time: prayer.athan_maghrib, iqamah: prayer.iqa_maghrib },
        { name: 'Isha', time: prayer.athan_isha, iqamah: prayer.iqa_isha },
    ];
};

/**
 * Main hook to fetch prayer times from Supabase
 */
export const usePrayerTimes = () => {
    return useQuery({
        queryKey: ['prayerTimes'],
        queryFn: async () => {
            const { data: prayerTimes, error } = await supabase
                .from('prayers')
                .select('*')
                .eq('id', 1)
                .single();

            if (error) {
                console.error('Error fetching prayers:', error);
                throw error;
            }

            if (!prayerTimes) {
                throw new Error('No prayer times data found');
            }

            // Transform the data using the existing helper
            const weekInfo: gettingPrayerData[] = ThePrayerData({ prayerTimes });
            return weekInfo;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
    });
};

/**
 * Hook to get today's prayer data
 */
export const useTodayPrayer = () => {
    const { data: prayerTimesWeek } = usePrayerTimes();

    return useMemo(() => {
        if (!prayerTimesWeek || prayerTimesWeek.length === 0) {
            return null;
        }

        const today = new Date();
        const todayStr = format(today, 'yyyy-MM-dd');

        return prayerTimesWeek.find(prayer => prayer.date === todayStr) || prayerTimesWeek[0];
    }, [prayerTimesWeek]);
};

/**
 * Hook to get tomorrow's prayer data
 */
export const useTomorrowPrayer = () => {
    const { data: prayerTimesWeek } = usePrayerTimes();

    return useMemo(() => {
        if (!prayerTimesWeek || prayerTimesWeek.length === 0) {
            return null;
        }

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');

        return prayerTimesWeek.find(prayer => prayer.date === tomorrowStr) || prayerTimesWeek[1] || prayerTimesWeek[0];
    }, [prayerTimesWeek]);
};

/**
 * Hook to calculate the current prayer based on current time
 */
export const useCurrentPrayer = () => {
    const prayer = useTodayPrayer();
    const nextPrayer = useTomorrowPrayer();
    const currentTime = useCurrentTime(); // Use shared timer

    return useMemo(() => {
        if (!prayer || !nextPrayer) {
            return '';
        }

        const currentTimeStr = formatTimeStr(currentTime);
        const currentDate = parseTime(currentTimeStr);
        const prayers = getPrayerTimesArray(prayer);

        // Check if we're after Isha (between Isha and next day's Fajr)
        const ishaDate = parseTime(prayers[4].time);
        const fajrDate = parseTime(prayers[0].time);

        if (isAfter(currentDate, ishaDate) || isBefore(currentDate, fajrDate)) {
            // After Isha or before Fajr (early morning), current prayer is Isha (showing next day's Fajr)
            return 'Isha';
        }

        // Find the current prayer based on time
        for (let i = 0; i < prayers.length; i++) {
            const prayerDate = parseTime(prayers[i].time);
            if (isBefore(currentDate, prayerDate)) {
                // Return the previous prayer, or Isha if it's the first one (before Fajr means after Isha)
                if (i === 0) {
                    return 'Isha';
                }
                return prayers[i - 1].name;
            }
        }

        // If we've passed all prayers today, return Isha
        return 'Isha';
    }, [prayer, nextPrayer, currentTime]);
};

/**
 * Hook to calculate the upcoming prayer
 */
export const useUpcomingPrayer = () => {
    const prayer = useTodayPrayer();
    const nextPrayer = useTomorrowPrayer();
    const currentTime = useCurrentTime(); // Use shared timer

    return useMemo(() => {
        if (!prayer || !nextPrayer) {
            return '';
        }

        const currentTimeStr = formatTimeStr(currentTime);
        const currentDate = parseTime(currentTimeStr);
        const prayers = getPrayerTimesArray(prayer);

        // Check if we're after Isha (between Isha and next day's Fajr)
        const ishaDate = parseTime(prayers[4].time);
        const fajrDate = parseTime(prayers[0].time);

        if (isAfter(currentDate, ishaDate) || isBefore(currentDate, fajrDate)) {
            // After Isha or before Fajr, next prayer is next day's Fajr
            return 'Fajr';
        }

        // Find the next upcoming prayer
        for (let i = 0; i < prayers.length; i++) {
            const prayerDate = parseTime(prayers[i].time);
            if (isBefore(currentDate, prayerDate)) {
                return prayers[i].name;
            }
        }

        // If we've passed all prayers today, next is tomorrow's Fajr
        return 'Fajr';
    }, [prayer, nextPrayer, currentTime]);
};

/**
 * Utility function to format time duration
 */
const formatTimeDuration = (hours: number, minutes: number): string => {
    if (hours === 0 && minutes === 0) {
        return 'Now';
    } else if (hours === 0) {
        return `${minutes} mins`;
    } else {
        return `${hours} hr ${minutes} mins`;
    }
};

/**
 * Hook to calculate time to next prayer
 */
export const useTimeToNextPrayer = () => {
    const prayer = useTodayPrayer();
    const nextPrayer = useTomorrowPrayer();
    const currentTime = useCurrentTime(); // Use shared timer

    return useMemo(() => {
        if (!prayer || !nextPrayer) {
            return '';
        }

        const currentTimeStr = formatTimeStr(currentTime);
        const currentDate = parseTime(currentTimeStr);
        const prayers = getPrayerTimesArray(prayer);

        // Determine which prayer index we're at
        let salahIndex = 0;
        const ishaDate = parseTime(prayers[4].time);
        const fajrDate = parseTime(prayers[0].time);

        if (isAfter(currentDate, ishaDate) || isBefore(currentDate, fajrDate)) {
            salahIndex = 5; // nextDayFajr
        } else {
            for (let i = 0; i < prayers.length; i++) {
                const prayerDate = parseTime(prayers[i].time);
                if (isBefore(currentDate, prayerDate)) {
                    salahIndex = i;
                    break;
                }
            }
        }

        // Get the current salah based on index
        let currentSalah: { salah: string; iqamah: string; athan: string } | null = null;

        if (salahIndex === 5) {
            currentSalah = {
                salah: 'Fajr',
                iqamah: nextPrayer.iqa_fajr,
                athan: nextPrayer.athan_fajr,
            };
        } else {
            const prayerData = prayers[salahIndex];
            currentSalah = {
                salah: prayerData.name,
                iqamah: prayerData.iqamah,
                athan: prayerData.time,
            };
        }

        if (!currentSalah) {
            return '';
        }

        let iqamahDate = parseTime(currentSalah.iqamah);

        // If showing next day's Fajr, add a day to the iqamah time
        if (salahIndex === 5) {
            iqamahDate = addDays(iqamahDate, 1);
        }

        // Calculate time until next iqamah
        const diffMs = differenceInMilliseconds(iqamahDate, currentDate);
        const hours = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));
        const minutes = Math.floor((Math.abs(diffMs) % (1000 * 60 * 60)) / (1000 * 60));

        // Handle negative duration (time has passed)
        if (diffMs < 0) {
            // If iqamah has passed, show time until next prayer's athan
            let nextAthanDate: Date;

            if (salahIndex === 5) {
                // Already showing next day's Fajr, so next athan is Dhuhr of next day
                nextAthanDate = addDays(parseTime(nextPrayer.athan_zuhr), 1);
            } else if (currentSalah.salah === 'Fajr') {
                nextAthanDate = parseTime(prayer.athan_zuhr);
            } else if (currentSalah.salah === 'Dhuhr') {
                nextAthanDate = parseTime(prayer.athan_asr);
            } else if (currentSalah.salah === 'Asr') {
                nextAthanDate = parseTime(prayer.athan_maghrib);
            } else if (currentSalah.salah === 'Maghrib') {
                nextAthanDate = parseTime(prayer.athan_isha);
            } else if (currentSalah.salah === 'Isha') {
                nextAthanDate = addDays(parseTime(nextPrayer.athan_fajr), 1);
            } else {
                nextAthanDate = parseTime(prayer.athan_zuhr);
            }

            const athanDiffMs = differenceInMilliseconds(nextAthanDate, currentDate);
            const athanHours = Math.floor(Math.abs(athanDiffMs) / (1000 * 60 * 60));
            const athanMinutes = Math.floor((Math.abs(athanDiffMs) % (1000 * 60 * 60)) / (1000 * 60));

            if (athanDiffMs <= 0) {
                return 'Now';
            }
            return formatTimeDuration(athanHours, athanMinutes);
        }

        // Time until iqamah
        return formatTimeDuration(hours, minutes);
    }, [prayer, nextPrayer, currentTime]);
};


