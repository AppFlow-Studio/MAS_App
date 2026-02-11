import { View, Text, TouchableOpacity, Pressable, ImageBackground } from 'react-native'
import React, { useState, useEffect } from 'react'
import { gettingPrayerData } from '../types';
import { format, parse, isAfter, isBefore, addDays, differenceInMilliseconds } from 'date-fns';
import { Link, useRouter } from 'expo-router';
import { Icon } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming } from 'react-native-reanimated';
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

type salahDisplayWidgetProp = {
    prayer: gettingPrayerData,
    nextPrayer: gettingPrayerData
}
type timeProp = {
    time: string
}
type currentSalahProp = {
    salah: string,
    athan: string,
    iqamah: string
}
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function SalahDisplayWidget({ prayer, nextPrayer }: salahDisplayWidgetProp) {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const buttonScale = useSharedValue(1);
    
    const animatedButtonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: buttonScale.value }]
    }));

    const handleViewAllPress = () => {
        // Haptic feedback for better feel
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        // Button press animation
        buttonScale.value = withSequence(
            withTiming(0.95, { duration: 50 }),
            withSpring(1, { damping: 15, stiffness: 400 })
        );
        
        // Navigate to prayer times tab (using navigate for smooth tab switch)
        router.navigate('/prayersTable');
    };

    if (!prayer) {
        return
    }
    const salahArray = ["fajr", "dhuhr", "asr", "maghrib", "isha", "nextDayFajr"];
    const [liveTime, setLiveTime] = useState(new Date());
    const [salahIndex, setCurrentSalahIndex] = useState(0);
    const [currentSalah, setCurrentSalah] = useState<currentSalahProp>({
        salah: "Fajr",
        athan: prayer.athan_fajr,
        iqamah: prayer.iqa_fajr
    });
    const refreshLiveTime = () => {
        setLiveTime(new Date())
    }
    const onSetCurrentSalah = () => {
        if (salahArray[salahIndex] == "fajr") {
            const fajrSalah = {
                salah: "Fajr",
                athan: prayer.athan_fajr,
                iqamah: prayer.iqa_fajr
            }
            setCurrentSalah(fajrSalah)
        }
        else if (salahArray[salahIndex] == "dhuhr") {
            const dhuhrSalah = {
                salah: "Dhuhr",
                athan: prayer.athan_zuhr,
                iqamah: prayer.iqa_zuhr
            }
            setCurrentSalah(dhuhrSalah)

        }
        else if (salahArray[salahIndex] == "asr") {
            const asrSalah = {
                salah: "Asr",
                athan: prayer.athan_asr,
                iqamah: prayer.iqa_asr
            }
            setCurrentSalah(asrSalah)

        }
        else if (salahArray[salahIndex] == "maghrib") {
            const maghribSalah = {
                salah: "Maghrib",
                athan: prayer.athan_maghrib,
                iqamah: prayer.iqa_maghrib
            }
            setCurrentSalah(maghribSalah)

        }
        else if (salahArray[salahIndex] == "isha") {
            const ishaSalah = {
                salah: "Isha",
                athan: prayer.athan_isha,
                iqamah: prayer.iqa_isha
            }
            setCurrentSalah(ishaSalah)

        }
        else if (salahArray[salahIndex] == "nextDayFajr") {
            const nextDayFajrSalah = {
                salah: "Fajr",
                athan: nextPrayer.athan_fajr,
                iqamah: nextPrayer.iqa_fajr
            }
            setCurrentSalah(nextDayFajrSalah)

        }
    }

    const getTimeToNextPrayer = () => {
        const currentDate = parseTime(currentTime)
        let iqamahDate = parseTime(currentSalah.iqamah)

        // If showing next day's Fajr, only add a day if we're in the evening (after Isha)
        // Don't add a day if we're in early morning (before Fajr) - Fajr is later today
        if (salahIndex === 5) {
            const ishaDate = parseTime(prayer.athan_isha)

            // Only add a day if current time is after Isha (evening hours)
            // If we're before Fajr (early morning), Fajr is later today, not tomorrow
            if (isAfter(currentDate, ishaDate)) {
                iqamahDate = addDays(iqamahDate, 1)
            }
        }

        // Calculate time until next iqamah
        const diffMs = differenceInMilliseconds(iqamahDate, currentDate)
        const hours = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60))
        const minutes = Math.floor((Math.abs(diffMs) % (1000 * 60 * 60)) / (1000 * 60))

        // Handle negative duration (time has passed)
        if (diffMs < 0) {
            // If iqamah has passed, show time until next prayer's athan
            let nextAthanDate: Date;

            if (salahIndex === 5) {
                // Already showing next day's Fajr, so next athan is Dhuhr of next day
                nextAthanDate = addDays(parseTime(nextPrayer.athan_zuhr), 1)
            } else if (currentSalah.salah === 'Fajr') {
                nextAthanDate = parseTime(prayer.athan_zuhr)
            } else if (currentSalah.salah === 'Dhuhr') {
                nextAthanDate = parseTime(prayer.athan_asr)
            } else if (currentSalah.salah === 'Asr') {
                nextAthanDate = parseTime(prayer.athan_maghrib)
            } else if (currentSalah.salah === 'Maghrib') {
                nextAthanDate = parseTime(prayer.athan_isha)
            } else if (currentSalah.salah === 'Isha') {
                nextAthanDate = addDays(parseTime(nextPrayer.athan_fajr), 1)
            } else {
                nextAthanDate = parseTime(prayer.athan_zuhr)
            }

            const athanDiffMs = differenceInMilliseconds(nextAthanDate, currentDate)
            const athanHours = Math.floor(Math.abs(athanDiffMs) / (1000 * 60 * 60))
            const athanMinutes = Math.floor((Math.abs(athanDiffMs) % (1000 * 60 * 60)) / (1000 * 60))

            if (athanDiffMs <= 0) {
                return 'Now'
            } else if (athanHours === 0) {
                return `${athanMinutes} mins`
            } else {
                return `${athanHours} hr ${athanMinutes} mins`
            }
        }

        // Time until iqamah
        if (hours === 0 && minutes === 0) {
            return 'Now'
        } else if (hours === 0) {
            return `${minutes} mins`
        } else {
            return `${hours} hr ${minutes} mins`
        }
    }

    const currentTime = format(liveTime, 'h:mm a');
    const timeToNextPrayer = getTimeToNextPrayer();
    const compareTime = () => {
        const currentDate = parseTime(currentTime);

        // Determine which prayer should be current based on current time
        const prayers = [
            { name: "fajr", time: prayer.athan_fajr, iqamah: prayer.iqa_fajr },
            { name: "dhuhr", time: prayer.athan_zuhr, iqamah: prayer.iqa_zuhr },
            { name: "asr", time: prayer.athan_asr, iqamah: prayer.iqa_asr },
            { name: "maghrib", time: prayer.athan_maghrib, iqamah: prayer.iqa_maghrib },
            { name: "isha", time: prayer.athan_isha, iqamah: prayer.iqa_isha },
        ];

        let newIndex = 0;

        // Check if we're after Isha (between Isha and next day's Fajr)
        const ishaDate = parseTime(prayers[4].time);

        if (isAfter(currentDate, ishaDate) || isBefore(currentDate, parseTime(prayers[0].time))) {
            // After Isha or before Fajr (early morning), show next day's Fajr
            newIndex = 5; // nextDayFajr index
        } else {
            // Find the current prayer based on time
            for (let i = 0; i < prayers.length; i++) {
                const prayerDate = parseTime(prayers[i].time);
                if (isBefore(currentDate, prayerDate)) {
                    newIndex = i;
                    break;
                }
            }
        }

        // Update if the index changed
        if (newIndex !== salahIndex) {
            setCurrentSalahIndex(newIndex);
            // onSetCurrentSalah will be called via useEffect dependency
        }
    }

    // Update current salah when salahIndex changes
    useEffect(() => {
        onSetCurrentSalah()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [salahIndex])

    // Compare time and update prayer whenever liveTime changes
    useEffect(() => {
        compareTime()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [liveTime, prayer, nextPrayer])

    // Set up interval to update time every second
    useEffect(() => {
        const timerId = setInterval(() => {
            refreshLiveTime()
        }, 1000)
        return function cleanup() {
            clearInterval(timerId)
        }
    }, [])
    return (
        <View>
            <Link href={"/prayersTable"} asChild>
                <Pressable>
                    <LinearGradient
                        colors={['#214E91', '#1a3d6f']} // Two background colors - adjust as needed
                        style={{ height: "100%", width: "100%", paddingTop: insets.top, paddingBottom: 80, justifyContent: "flex-end" }}
                    >
                        <ImageBackground
                            source={require("@/assets/images/LogoClear.png")}
                            style={{ height: "100%", width: "100%", position: "absolute", top: 0, left: 0 }}
                            resizeMode="contain"
                            imageStyle={{ opacity: .50, transform: [{ scale: 1.50 }], marginTop: 73 }}
                        />
                        {/* Top Section - Prayer Name and View All/Date */}
                        <View className='flex-row justify-between items-start px-5 mb-1'>
                            {/* Current Prayer and Time */}
                            <View className='flex-col items-start'>
                                <Text className='text-white font-bold text-4xl'>{currentTime}</Text>
                                {/* Next Iqamah Countdown */}
                                <View className='flex-row items-center mt-1'>
                                    <View style={{ marginRight: 4 }}>
                                        <Icon source="clock-outline" size={14} color="#FFFFFF" />
                                    </View>
                                    <Text className='text-white text-xs mr-2'>{currentSalah.salah} iqamah in</Text>
                                    <Text className='text-white font-bold text-base'>{timeToNextPrayer}</Text>
                                </View>
                            </View>

                            {/* Date and View All */}
                            <View className='flex-col items-end'>
                                <Text className='text-white font-bold text-base mb-1' numberOfLines={1}>{prayer.hijri_month} {prayer.hijri_date}</Text>
                                <AnimatedPressable
                                    onPress={handleViewAllPress}
                                    style={[
                                        {
                                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                            paddingHorizontal: 12,
                                            paddingVertical: 6,
                                            borderRadius: 16,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            marginTop: 4,
                                        },
                                        animatedButtonStyle
                                    ]}
                                >
                                    <Text className='text-white text-xs font-medium'>View all prayer times</Text>
                                    <View style={{ marginLeft: 4 }}>
                                        <Icon source="chevron-right" size={14} color="#FFFFFF" />
                                    </View>
                                </AnimatedPressable>
                            </View>
                        </View>

                        {/* All Prayer Times Grid */}
                        <View className='flex-row justify-around px-3 mt-12'>
                            {/* Fajr */}
                            <View className='items-center' style={{
                                backgroundColor: currentSalah.salah === 'Fajr' ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
                                paddingVertical: 8,
                                paddingHorizontal: 10,
                                borderRadius: 12,
                                transform: currentSalah.salah === 'Fajr' ? [{ scale: 1.05 }] : [{ scale: 1 }],
                                shadowColor: currentSalah.salah === 'Fajr' ? '#000' : 'transparent',
                                shadowOffset: currentSalah.salah === 'Fajr' ? { width: 0, height: 2 } : { width: 0, height: 0 },
                                shadowOpacity: currentSalah.salah === 'Fajr' ? 0.2 : 0,
                                shadowRadius: currentSalah.salah === 'Fajr' ? 4 : 0,
                                elevation: currentSalah.salah === 'Fajr' ? 3 : 0,
                            }}>
                                <Text className='text-white text-xs mb-1'>Fajr</Text>
                                <Icon source={'weather-night'} size={currentSalah.salah === 'Fajr' ? 26 : 24} color='#FFFFFF' />
                                <Text className='text-white font-semibold text-sm mt-1'>{prayer.athan_fajr}</Text>
                            </View>

                            {/* Dhuhr */}
                            <View className='items-center' style={{
                                backgroundColor: currentSalah.salah === 'Dhuhr' ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
                                paddingVertical: 8,
                                paddingHorizontal: 10,
                                borderRadius: 12,
                                transform: currentSalah.salah === 'Dhuhr' ? [{ scale: 1.05 }] : [{ scale: 1 }],
                                shadowColor: currentSalah.salah === 'Dhuhr' ? '#000' : 'transparent',
                                shadowOffset: currentSalah.salah === 'Dhuhr' ? { width: 0, height: 2 } : { width: 0, height: 0 },
                                shadowOpacity: currentSalah.salah === 'Dhuhr' ? 0.2 : 0,
                                shadowRadius: currentSalah.salah === 'Dhuhr' ? 4 : 0,
                                elevation: currentSalah.salah === 'Dhuhr' ? 3 : 0,
                            }}>
                                <Text className='text-white text-xs mb-1'>Dhuhr</Text>
                                <Icon source={'weather-sunny'} size={currentSalah.salah === 'Dhuhr' ? 26 : 24} color='#FFFFFF' />
                                <Text className='text-white font-semibold text-sm mt-1'>{prayer.athan_zuhr}</Text>
                            </View>

                            {/* Asr */}
                            <View className='items-center' style={{
                                backgroundColor: currentSalah.salah === 'Asr' ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
                                paddingVertical: 8,
                                paddingHorizontal: 10,
                                borderRadius: 12,
                                transform: currentSalah.salah === 'Asr' ? [{ scale: 1.05 }] : [{ scale: 1 }],
                                shadowColor: currentSalah.salah === 'Asr' ? '#000' : 'transparent',
                                shadowOffset: currentSalah.salah === 'Asr' ? { width: 0, height: 2 } : { width: 0, height: 0 },
                                shadowOpacity: currentSalah.salah === 'Asr' ? 0.2 : 0,
                                shadowRadius: currentSalah.salah === 'Asr' ? 4 : 0,
                                elevation: currentSalah.salah === 'Asr' ? 3 : 0,
                            }}>
                                <Text className='text-white text-xs mb-1'>Asr</Text>
                                <Icon source={'weather-partly-cloudy'} size={currentSalah.salah === 'Asr' ? 26 : 24} color='#FFFFFF' />
                                <Text className='text-white font-semibold text-sm mt-1'>{prayer.athan_asr}</Text>
                            </View>

                            {/* Maghrib */}
                            <View className='items-center' style={{
                                backgroundColor: currentSalah.salah === 'Maghrib' ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
                                paddingVertical: 8,
                                paddingHorizontal: 10,
                                borderRadius: 12,
                                transform: currentSalah.salah === 'Maghrib' ? [{ scale: 1.05 }] : [{ scale: 1 }],
                                shadowColor: currentSalah.salah === 'Maghrib' ? '#000' : 'transparent',
                                shadowOffset: currentSalah.salah === 'Maghrib' ? { width: 0, height: 2 } : { width: 0, height: 0 },
                                shadowOpacity: currentSalah.salah === 'Maghrib' ? 0.2 : 0,
                                shadowRadius: currentSalah.salah === 'Maghrib' ? 4 : 0,
                                elevation: currentSalah.salah === 'Maghrib' ? 3 : 0,
                            }}>
                                <Text className='text-white text-xs mb-1'>Maghrib</Text>
                                <Icon source={'weather-sunset'} size={currentSalah.salah === 'Maghrib' ? 26 : 24} color='#FFFFFF' />
                                <Text className='text-white font-semibold text-sm mt-1'>{prayer.athan_maghrib}</Text>
                            </View>

                            {/* Isha */}
                            <View className='items-center' style={{
                                backgroundColor: currentSalah.salah === 'Isha' ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
                                paddingVertical: 8,
                                paddingHorizontal: 10,
                                borderRadius: 12,
                                transform: currentSalah.salah === 'Isha' ? [{ scale: 1.05 }] : [{ scale: 1 }],
                                shadowColor: currentSalah.salah === 'Isha' ? '#000' : 'transparent',
                                shadowOffset: currentSalah.salah === 'Isha' ? { width: 0, height: 2 } : { width: 0, height: 0 },
                                shadowOpacity: currentSalah.salah === 'Isha' ? 0.2 : 0,
                                shadowRadius: currentSalah.salah === 'Isha' ? 4 : 0,
                                elevation: currentSalah.salah === 'Isha' ? 3 : 0,
                            }}>
                                <Text className='text-white text-xs mb-1'>Isha</Text>
                                <Icon source={'moon-waning-crescent'} size={currentSalah.salah === 'Isha' ? 26 : 24} color='#FFFFFF' />
                                <Text className='text-white font-semibold text-sm mt-1'>{prayer.athan_isha}</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </Pressable>
            </Link>
        </View>
    )
}