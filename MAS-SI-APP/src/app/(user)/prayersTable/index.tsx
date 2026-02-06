import { View, Text, FlatList, Image, Pressable, StatusBar, Dimensions, ImageBackground, StyleSheet } from 'react-native';
import Paginator from '@/src/components/paginator';
import Table from "@/src/components/prayerTimeTable";
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { usePrayerTimes, useCurrentPrayer, useUpcomingPrayer, useTimeToNextPrayer } from '@/src/hooks/usePrayerTimes';
import { gettingPrayerData } from '@/src/types';
import { Divider, Icon } from 'react-native-paper';
import { Link } from 'expo-router';
import ApprovedAds from '@/src/components/BusinessAdsComponets/ApprovedAds';
import { BlurView } from 'expo-blur';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { usePrayerNotificationSettings } from '@/src/hooks/usePrayerSettings';
import { ScrollView } from 'react-native';
import { format, isAfter, isBefore } from 'date-fns';
import Svg, { Path, Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  interpolate,
  Easing,
  FadeIn,
  FadeInDown,
  SlideInUp,
} from 'react-native-reanimated';
import { TaraweehSessionBottomSheet, TaraweehSessionBottomSheetRef, TaraweehSessionData } from '@/src/components/TaraweehSessionBottomSheet';
import { TaraweehNotificationBottomSheet, TaraweehNotificationBottomSheetRef } from '@/src/components/TaraweehNotificationBottomSheet';
import { CapacityStatusLight, CapacityStatus } from '@/src/components/CapacityStatusLight';

// ============================================
// TARAWEEH TIMELINE COMPONENT
// ============================================
interface TaraweehImam {
  id?: string;
  imam_name: string;
  imam_img?: string;
}

interface TaraweehSpeaker {
  id?: string;
  speaker_name: string;
  speaker_img?: string;
}

interface TaraweehTimelineProps {
  sessionOneStart: Date;
  sessionOneEnd: Date | number;
  sessionTwoStart: Date | number;
  sessionTwoEnd: Date | number;
  currentSurah: {
    surah: number;
    ayah_num: number;
    ayah: string;
    surah_name: string;
  };
  sessionOneLineup?: {
    firstFourImam?: TaraweehImam;
    speaker?: TaraweehSpeaker;
    secondFourImam?: TaraweehImam;
    witrImam?: TaraweehImam;
    capacity_status?: CapacityStatus;
  };
  sessionTwoLineup?: {
    firstFourImam?: TaraweehImam;
    speaker?: TaraweehSpeaker;
    secondFourImam?: TaraweehImam;
    witrImam?: TaraweehImam;
    capacity_status?: CapacityStatus;
  };
}

type TaraweehState = 'before' | 'session_one' | 'break' | 'session_two' | 'completed';

const TaraweehTimeline = ({ sessionOneStart, sessionOneEnd, sessionTwoStart, sessionTwoEnd, currentSurah, sessionOneLineup, sessionTwoLineup }: TaraweehTimelineProps) => {
  const sessionBottomSheetRef = useRef<TaraweehSessionBottomSheetRef>(null);
  const notificationBottomSheetRef = useRef<TaraweehNotificationBottomSheetRef>(null);
  const { session } = useAuth();
  const [now, setNow] = useState(new Date());
  const [taraweeh1NotifEnabled, setTaraweeh1NotifEnabled] = useState(false);
  const [taraweeh2NotifEnabled, setTaraweeh2NotifEnabled] = useState(false);
  
  // Update time every minute for live countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  // Load and listen for notification settings
  useEffect(() => {
    if (!session?.user.id) return;

    const loadNotificationSettings = async () => {
      const { data } = await supabase
        .from('prayer_notification_settings')
        .select('prayer, notification_settings')
        .eq('user_id', session.user.id)
        .in('prayer', ['taraweeh 1', 'taraweeh 2']);

      if (data) {
        data.forEach((item) => {
          const isMuted = item.notification_settings?.includes('Mute');
          const hasValidOptions = item.notification_settings && 
            item.notification_settings.length > 0 && 
            !isMuted;
          
          if (item.prayer === 'taraweeh 1') {
            setTaraweeh1NotifEnabled(hasValidOptions);
          } else if (item.prayer === 'taraweeh 2') {
            setTaraweeh2NotifEnabled(hasValidOptions);
          }
        });
      }
    };

    loadNotificationSettings();

    // Listen for changes to notification settings
    const subscription = supabase
      .channel('taraweeh-notification-settings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prayer_notification_settings',
          filter: `user_id=eq.${session.user.id}`,
        },
        () => loadNotificationSettings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [session?.user.id]);
  
  // ⚠️ DEMO MODE - Change to null after testing to use real time
  // Options: 'before', 'session_one', 'break', 'session_two', 'completed', or null for real time
  const DEMO_STATE = null as TaraweehState | null;
  
  // Determine current state
  const getCurrentState = (): TaraweehState => {
    if (DEMO_STATE) return DEMO_STATE; // Demo override
    if (isBefore(now, sessionOneStart)) return 'before';
    if (isAfter(now, sessionOneStart) && isBefore(now, new Date(sessionOneEnd))) return 'session_one';
    if (isAfter(now, new Date(sessionOneEnd)) && isBefore(now, new Date(sessionTwoStart))) return 'break';
    if (isAfter(now, new Date(sessionTwoStart)) && isBefore(now, new Date(sessionTwoEnd))) return 'session_two';
    return 'completed';
  };
  
  const currentState = getCurrentState();
  
  // Calculate progress percentage
  const getProgress = (): number => {
    // Demo progress values for testing
    if (DEMO_STATE) {
      switch (DEMO_STATE) {
        case 'before': return 0;
        case 'session_one': return 35;
        case 'break': return 50;
        case 'session_two': return 75;
        case 'completed': return 100;
      }
    }
    
    const totalDuration = new Date(sessionTwoEnd).getTime() - sessionOneStart.getTime();
    const elapsed = now.getTime() - sessionOneStart.getTime();
    
    if (currentState === 'before') return 0;
    if (currentState === 'completed') return 100;
    
    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  };
  
  const progress = getProgress();
  
  // Animations
  const progressWidth = useSharedValue(0);
  const pulseOpacity = useSharedValue(1);
  const node1Scale = useSharedValue(1);
  const node2Scale = useSharedValue(1);
  const node3Scale = useSharedValue(1);
  
  useEffect(() => {
    // Animate progress bar
    progressWidth.value = withTiming(progress, { duration: 1000, easing: Easing.out(Easing.cubic) });
    
    // Pulse animation for active state
    if (currentState === 'session_one' || currentState === 'session_two') {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
    
    // Node animations based on state
    const activeNodeAnimation = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    
    if (currentState === 'session_one') {
      node1Scale.value = activeNodeAnimation;
    } else if (currentState === 'break') {
      node2Scale.value = activeNodeAnimation;
    } else if (currentState === 'session_two') {
      node3Scale.value = activeNodeAnimation;
    }
  }, [currentState, progress]);
  
  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));
  
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));
  
  const node1Style = useAnimatedStyle(() => ({
    transform: [{ scale: node1Scale.value }],
  }));
  
  const node2Style = useAnimatedStyle(() => ({
    transform: [{ scale: node2Scale.value }],
  }));
  
  const node3Style = useAnimatedStyle(() => ({
    transform: [{ scale: node3Scale.value }],
  }));

  // Helper to get countdown text
  const getCountdownInfo = (): { label: string; time: string } | null => {
    if (currentState === 'completed') return null;
    
    let targetTime: Date;
    let label: string;
    
    switch (currentState) {
      case 'before':
        targetTime = sessionOneStart;
        label = 'Session One starts in';
        break;
      case 'session_one':
        targetTime = new Date(sessionOneEnd);
        label = 'Session One ends in';
        break;
      case 'break':
        targetTime = new Date(sessionTwoStart);
        label = 'Session Two starts in';
        break;
      case 'session_two':
        targetTime = new Date(sessionTwoEnd);
        label = 'Session Two ends in';
        break;
      default:
        return null;
    }
    
    const diff = targetTime.getTime() - now.getTime();
    if (diff <= 0) return null;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    let timeStr = '';
    if (hours > 0) timeStr += `${hours}h `;
    timeStr += `${minutes}m`;
    
    return { label, time: timeStr };
  };
  
  const countdownInfo = getCountdownInfo();

  // Handler to open session bottom sheet
  const handleSessionPress = (sessionNumber: 1 | 2) => {
    const lineup = sessionNumber === 1 ? sessionOneLineup : sessionTwoLineup;
    
    const sessionData: TaraweehSessionData = {
      sessionNumber,
      sessionTitle: sessionNumber === 1 ? 'Session One' : 'Session Two',
      startTime: format(sessionNumber === 1 ? sessionOneStart : new Date(sessionTwoStart), 'h:mm a'),
      endTime: format(sessionNumber === 1 ? new Date(sessionOneEnd) : new Date(sessionTwoEnd), 'h:mm a'),
      lineup: [],
    };

    // All sessions have 4 sections: Rakats 1-4, Speaker, Rakats 5-8, Witr
    
    // 1. Rakats 1-4
    sessionData.lineup.push({
      type: 'rakats',
      imam_name: lineup?.firstFourImam?.imam_name || 'TBA',
      imam_img: lineup?.firstFourImam?.imam_img,
      rakats: 4,
      label: 'RAKATS 1-4',
    });

    // 2. Speaker
    sessionData.lineup.push({
      type: 'speaker',
      speaker_name: lineup?.speaker?.speaker_name || 'TBA',
      speaker_img: lineup?.speaker?.speaker_img,
    });

    // 3. Rakats 5-8
    sessionData.lineup.push({
      type: 'rakats',
      imam_name: lineup?.secondFourImam?.imam_name || 'TBA',
      imam_img: lineup?.secondFourImam?.imam_img,
      rakats: 4,
      label: 'RAKATS 5-8',
    });

    // 4. Witr
    const witrImam = (lineup as typeof sessionTwoLineup)?.witrImam;
    sessionData.lineup.push({
      type: 'witr',
      imam_name: witrImam?.imam_name || 'TBA',
      imam_img: witrImam?.imam_img,
      rakats: 3,
      label: 'WITR',
    });

    sessionBottomSheetRef.current?.open(sessionData);
  };

  // Quran progress calculation for compact tracker
  const totalVerses = 6236;
  const versesBeforeSurah = [
    0, 7, 293, 493, 669, 789, 954, 1160, 1235, 1364, 1473, 1596, 1707, 1750, 1802,
    1901, 2029, 2140, 2250, 2348, 2483, 2595, 2673, 2791, 2855, 2932, 3159, 3252,
    3340, 3409, 3469, 3503, 3533, 3606, 3660, 3705, 3788, 3970, 4058, 4133, 4218,
    4272, 4325, 4414, 4473, 4510, 4545, 4583, 4612, 4630, 4675, 4735, 4784, 4846,
    4901, 4979, 5075, 5104, 5126, 5150, 5163, 5177, 5188, 5199, 5217, 5229, 5241,
    5271, 5323, 5375, 5419, 5447, 5475, 5495, 5531, 5566, 5616, 5656, 5672, 5698,
    5743, 5765, 5801, 5829, 5848, 5884, 5909, 5931, 5948, 5967, 5993, 6023, 6043,
    6058, 6079, 6090, 6098, 6106, 6125, 6130, 6138, 6146, 6157, 6168, 6176, 6179,
    6188, 6193, 6197, 6204, 6207, 6213, 6221, 6227, 6231
  ];
  const currentVerseNumber = (versesBeforeSurah[currentSurah.surah - 1] || 0) + currentSurah.ayah_num;
  const quranProgressPercent = Math.min(100, Math.round((currentVerseNumber / totalVerses) * 100));
  const juzNumber = Math.min(30, Math.ceil((currentVerseNumber / totalVerses) * 30));

  // Helper to determine node state
  const getNodeState = (nodeIndex: number): 'completed' | 'active' | 'upcoming' => {
    if (nodeIndex === 1) {
      if (currentState === 'before') return 'upcoming';
      if (currentState === 'session_one') return 'active';
      return 'completed';
    }
    if (nodeIndex === 2) {
      if (currentState === 'before' || currentState === 'session_one') return 'upcoming';
      if (currentState === 'break') return 'active';
      return 'completed';
    }
    // nodeIndex === 3
    if (currentState === 'completed') return 'completed';
    if (currentState === 'session_two') return 'active';
    return 'upcoming';
  };

  return (
    <Animated.View 
      entering={FadeInDown.delay(200).duration(600).springify()}
      style={styles.timelineContainer}
    >
      {/* Header */}
      <View style={styles.timelineHeader}>
        <View style={styles.timelineHeaderLeft}>
          <View style={styles.timelineMoonIcon}>
            <Icon source="moon-waning-crescent" size={18} color="#1d4681" />
          </View>
          <Text style={styles.timelineTitle}>Taraweeh Schedule</Text>
        </View>
        {currentState !== 'before' && currentState !== 'completed' && (
          <Animated.View style={[styles.liveIndicator, pulseStyle]}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </Animated.View>
        )}
      </View>

      {/* Capacity Legend - only show if any status is set */}
      {(sessionOneLineup?.capacity_status || sessionTwoLineup?.capacity_status) && (
        <View style={styles.taraweehCapacityLegend}>
          <View style={styles.taraweehLegendItem}>
            <View style={[styles.taraweehLegendDot, { backgroundColor: '#22C55E' }]} />
            <Text style={styles.taraweehLegendText}>Space</Text>
          </View>
          <View style={styles.taraweehLegendItem}>
            <View style={[styles.taraweehLegendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.taraweehLegendText}>Filling</Text>
          </View>
          <View style={styles.taraweehLegendItem}>
            <View style={[styles.taraweehLegendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.taraweehLegendText}>Full</Text>
          </View>
        </View>
      )}

      {/* Session Cards */}
      <View style={styles.sessionCardsContainer}>
        {/* Session One Card */}
        <Pressable 
          style={[
            styles.sessionCard,
            currentState === 'session_one' && styles.sessionCardActive
          ]}
          onPress={() => handleSessionPress(1)}
        >
          <View style={styles.sessionCardHeader}>
            <Text style={styles.sessionNumber}>1</Text>
            <Text style={styles.sessionLabel}>Session One</Text>
          </View>
          <CapacityStatusLight status={sessionOneLineup?.capacity_status} size={10} style={styles.capacityLight} />
          <Text style={[
            styles.sessionTime,
            currentState === 'session_one' && styles.sessionTimeActive
          ]}>
            {format(sessionOneStart, 'h:mm a')}
          </Text>
          <Text style={styles.sessionEndTime}>
            ends {format(sessionOneEnd, 'h:mm a')}
          </Text>
          <View style={styles.sessionActionRow}>
            <View style={styles.viewLineupBtn}>
              <Icon source="account-group-outline" size={14} color="#1d4681" />
              <Text style={styles.viewLineupBtnText}>Lineup</Text>
            </View>
            <Pressable 
              style={styles.sessionNotificationBtn} 
              onPress={(e) => {
                e.stopPropagation();
                notificationBottomSheetRef.current?.open('Taraweeh 1');
              }}
            >
              <Icon source={taraweeh1NotifEnabled ? "bell" : "bell-outline"} size={14} color="#1d4681" />
            </Pressable>
          </View>
        </Pressable>

        {/* Session Two Card */}
        <Pressable 
          style={[
            styles.sessionCard,
            currentState === 'session_two' && styles.sessionCardActive
          ]}
          onPress={() => handleSessionPress(2)}
        >
          <View style={styles.sessionCardHeader}>
            <Text style={styles.sessionNumber}>2</Text>
            <Text style={styles.sessionLabel}>Session Two</Text>
          </View>
          <CapacityStatusLight status={sessionTwoLineup?.capacity_status} size={10} style={styles.capacityLight} />
          <Text style={[
            styles.sessionTime,
            currentState === 'session_two' && styles.sessionTimeActive
          ]}>
            {format(sessionTwoStart, 'h:mm a')}
          </Text>
          <Text style={styles.sessionEndTime}>
            ends {format(sessionTwoEnd, 'h:mm a')}
          </Text>
          <View style={styles.sessionActionRow}>
            <View style={styles.viewLineupBtn}>
              <Icon source="account-group-outline" size={14} color="#1d4681" />
              <Text style={styles.viewLineupBtnText}>Lineup</Text>
            </View>
            <Pressable 
              style={styles.sessionNotificationBtn} 
              onPress={(e) => {
                e.stopPropagation();
                notificationBottomSheetRef.current?.open('Taraweeh 2');
              }}
            >
              <Icon source={taraweeh2NotifEnabled ? "bell" : "bell-outline"} size={14} color="#1d4681" />
            </Pressable>
          </View>
        </Pressable>
      </View>

      {/* Taraweeh Session Bottom Sheet */}
      <TaraweehSessionBottomSheet ref={sessionBottomSheetRef} />

      {/* Taraweeh Notification Bottom Sheet */}
      <TaraweehNotificationBottomSheet ref={notificationBottomSheetRef} />

      {/* Compact Quran Tracker */}
      <LinearGradient
        colors={['#FFFFFF', '#D4F5E9', '#D4F5E9', '#FFFFFF']}
        locations={[0, 0.20, 0.80, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.compactQuranContainer}
      >
        <View style={styles.compactQuranHeader}>
          <View style={styles.compactQuranTitleRow}>
            <Icon source="book-open-page-variant" size={14} color="#1d4681" />
            <Text style={styles.compactQuranTitle}>Currently Reading</Text>
          </View>
          <View style={styles.compactJuzBadge}>
            <Text style={styles.compactJuzBadgeText}>Juz {juzNumber}</Text>
          </View>
        </View>
        <View style={styles.compactQuranProgressRow}>
          <View style={styles.compactProgressBarBg}>
            <LinearGradient
              colors={['#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.compactProgressBarFill, { width: `${quranProgressPercent}%` }]}
            />
          </View>
          <Text style={styles.compactProgressText}>{quranProgressPercent}%</Text>
        </View>
        <Text style={styles.compactSurahText}>
          {currentSurah.surah_name} {currentSurah.surah}:{currentSurah.ayah_num}
        </Text>
        <View style={styles.compactAyahContainer}>
          <Text style={styles.compactAyahText}>{currentSurah.ayah}</Text>
        </View>
      </LinearGradient>

      {/* Timeline Track */}
      <View style={styles.timelineTrack}>
        {/* Background line */}
        <View style={styles.timelineLineBg} />
        
        {/* Progress line */}
        <Animated.View style={[styles.timelineLineProgress, progressAnimatedStyle]}>
          <LinearGradient
            colors={['#10b981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.timelineLineGradient}
          />
        </Animated.View>
        
        {/* Node 1 - Session One Start */}
        <View style={[styles.timelineNodeContainer, { left: '0%' }]}>
          <Animated.View style={[
            styles.timelineNode,
            getNodeState(1) === 'completed' && styles.timelineNodeCompleted,
            getNodeState(1) === 'active' && styles.timelineNodeActive,
            node1Style
          ]}>
            {getNodeState(1) === 'completed' && <Icon source="check" size={10} color="#fff" />}
            {getNodeState(1) === 'active' && <View style={styles.nodeInnerDot} />}
          </Animated.View>
          <Text style={styles.timelineNodeLabel}>Start</Text>
        </View>
        
        {/* Node 2 - Break/Session Two Start */}
        <View style={[styles.timelineNodeContainer, { left: '50%', marginLeft: -12 }]}>
          <Animated.View style={[
            styles.timelineNode,
            getNodeState(2) === 'completed' && styles.timelineNodeCompleted,
            getNodeState(2) === 'active' && styles.timelineNodeActive,
            node2Style
          ]}>
            {getNodeState(2) === 'completed' && <Icon source="check" size={10} color="#fff" />}
            {getNodeState(2) === 'active' && <View style={styles.nodeInnerDot} />}
          </Animated.View>
          <Text style={styles.timelineNodeLabel}>Break</Text>
        </View>
        
        {/* Node 3 - End */}
        <View style={[styles.timelineNodeContainer, { right: '0%' }]}>
          <Animated.View style={[
            styles.timelineNode,
            getNodeState(3) === 'completed' && styles.timelineNodeCompleted,
            getNodeState(3) === 'active' && styles.timelineNodeActive,
            node3Style
          ]}>
            {getNodeState(3) === 'completed' && <Icon source="check" size={10} color="#fff" />}
            {getNodeState(3) === 'active' && <View style={styles.nodeInnerDot} />}
          </Animated.View>
          <Text style={styles.timelineNodeLabel}>End</Text>
        </View>
      </View>

      {/* Countdown Pill */}
      {countdownInfo && (
        <View style={styles.taraweehCountdownPill}>
          <Icon source="clock-outline" size={18} color="#1d4681" />
          <Text style={styles.taraweehCountdownText}>
            {countdownInfo.label} <Text style={styles.taraweehCountdownTime}>{countdownInfo.time}</Text>
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

// ============================================
// SUHOOR/IFTAR TIMER COMPONENT WITH SUN ARC
// ============================================
interface SuhoorIftarTimerProps {
  todayFajrAthan: string;
  tomorrowFajrAthan: string;
  todayMaghribAthan: string;
  tomorrowMaghribAthan: string;
}

// Helper to parse time string (e.g., "5:57 AM") to today's Date
const parseTimeToDate = (timeStr: string, addDays: number = 0): Date => {
  const today = new Date();
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return today;
  
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  
  const date = new Date(today);
  date.setDate(date.getDate() + addDays);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

// Format countdown duration
const formatCountdown = (targetTime: Date, now: Date): string => {
  const diffMs = targetTime.getTime() - now.getTime();
  if (diffMs <= 0) return 'Now';
  
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours === 0) {
    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  }
  return `${hours} hr ${minutes} min${minutes !== 1 ? 's' : ''}`;
};

const SuhoorIftarTimer = ({ todayFajrAthan, tomorrowFajrAthan, todayMaghribAthan, tomorrowMaghribAthan }: SuhoorIftarTimerProps) => {
  const screenWidth = Dimensions.get('window').width * 0.95;
  const arcWidth = screenWidth - 40;
  const arcHeight = 80;
  
  // Use state for current time to enable live countdown
  const [now, setNow] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000); // Update every second for accurate countdown
    
    return () => clearInterval(interval);
  }, []);
  
  // Parse all relevant times
  const todayFajr = parseTimeToDate(todayFajrAthan);
  const tomorrowFajr = parseTimeToDate(tomorrowFajrAthan, 1);
  const todayMaghrib = parseTimeToDate(todayMaghribAthan);
  const tomorrowMaghrib = parseTimeToDate(tomorrowMaghribAthan, 1);
  
  // Determine the fasting state and countdown target
  // Suhoor ends at Fajr athan, Iftar begins at Maghrib athan
  const isBeforeTodayFajr = now < todayFajr;
  const isAfterTodayMaghrib = now >= todayMaghrib;
  const isFastingTime = !isBeforeTodayFajr && !isAfterTodayMaghrib; // Between Fajr and Maghrib
  
  // Determine which countdown to show and the target time
  let isSuhoorCountdown: boolean;
  let countdownTarget: Date;
  let displaySuhoorTime: string;
  let displayIftarTime: string;
  
  if (isBeforeTodayFajr) {
    // Before Fajr: Show countdown to Suhoor ending (today's Fajr)
    isSuhoorCountdown = true;
    countdownTarget = todayFajr;
    displaySuhoorTime = todayFajrAthan;
    displayIftarTime = todayMaghribAthan;
  } else if (isFastingTime) {
    // Between Fajr and Maghrib: Show countdown to Iftar (today's Maghrib)
    isSuhoorCountdown = false;
    countdownTarget = todayMaghrib;
    displaySuhoorTime = tomorrowFajrAthan;
    displayIftarTime = todayMaghribAthan;
  } else {
    // After Maghrib: Show countdown to next Suhoor ending (tomorrow's Fajr)
    isSuhoorCountdown = true;
    countdownTarget = tomorrowFajr;
    displaySuhoorTime = tomorrowFajrAthan;
    displayIftarTime = tomorrowMaghribAthan;
  }
  
  const countdownText = formatCountdown(countdownTarget, now);
  
  // For sun arc visualization, use today's times
  const sunriseTime = todayFajr;
  const sunsetTime = todayMaghrib;
  
  // Determine current state based on actual time for the arc visualization
  const isBeforeSunrise = now < sunriseTime;
  const isAfterSunset = now >= sunsetTime;
  const isDaytime = !isBeforeSunrise && !isAfterSunset;
  
  // Calculate sun position along the arc (0 = sunrise, 1 = sunset)
  const getSunPosition = (): number => {
    if (isBeforeSunrise) return 0;
    if (isAfterSunset) return 1;
    
    // Calculate position based on actual time between sunrise and sunset
    const totalDayDuration = sunsetTime.getTime() - sunriseTime.getTime();
    const elapsed = now.getTime() - sunriseTime.getTime();
    
    return Math.min(1, Math.max(0, elapsed / totalDayDuration));
  };
  
  const sunPosition = getSunPosition();
  
  // Animation values
  const sunScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.5);
  const starOpacity = useSharedValue(1);
  
  useEffect(() => {
    // Sun pulsing glow
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    
    // Subtle sun scale animation
    sunScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    
    // Stars twinkle
    starOpacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);
  
  const sunScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sunScale.value }],
  }));
  
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));
  
  const starStyle = useAnimatedStyle(() => ({
    opacity: starOpacity.value,
  }));

  // Calculate point on arc
  const getPointOnArc = (t: number) => {
    const padding = 20;
    const x = padding + t * (arcWidth - 40);
    const y = arcHeight - Math.sin(t * Math.PI) * (arcHeight - 25);
    return { x, y };
  };
  
  const sunPos = getPointOnArc(sunPosition);
  
  // Generate arc path
  const generateArcPath = () => {
    const points = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const { x, y } = getPointOnArc(t);
      points.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
    }
    return points.join(' ');
  };

  return (
    <Animated.View 
      entering={FadeInDown.delay(400).duration(600).springify()}
      style={styles.sunArcContainer}
    >
      <LinearGradient
        colors={['#0d3a5c', '#1d4681', '#0f2d4a']}
        style={styles.sunArcGradient}
      >
        {/* Stars background */}
        <View style={styles.starsContainer}>
          {[...Array(15)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.star,
                {
                  left: `${8 + (i * 6) % 85}%`,
                  top: `${10 + (i * 11) % 45}%`,
                  width: i % 3 === 0 ? 3 : 2,
                  height: i % 3 === 0 ? 3 : 2,
                },
                i % 2 === 0 && starStyle,
              ]}
            />
          ))}
        </View>


        {/* Time Labels - Top Row */}
        <View style={styles.timeLabelsTop}>
          {/* Suhoor - Top Left */}
          <View style={styles.timeLabelLeft}>
            <Text style={styles.timeLabelTitle}>Suhoor Ends</Text>
            <Text style={styles.timeLabelValue}>{displaySuhoorTime}</Text>
          </View>
          
          {/* Iftar - Top Right */}
          <View style={styles.timeLabelRight}>
            <Text style={styles.timeLabelTitle}>Iftar</Text>
            <Text style={styles.timeLabelValue}>{displayIftarTime}</Text>
          </View>
        </View>

        {/* Sun Arc Visualization */}
        <View style={styles.arcContainer}>
          <Svg width={arcWidth} height={arcHeight + 30}>
            <Defs>
              <SvgLinearGradient id="arcGradientDark" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
                <Stop offset="50%" stopColor="#34d399" stopOpacity="1" />
                <Stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
              </SvgLinearGradient>
              <SvgLinearGradient id="arcBgGradientDark" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#94a3b8" stopOpacity="0.4" />
                <Stop offset="100%" stopColor="#94a3b8" stopOpacity="0.2" />
              </SvgLinearGradient>
            </Defs>
            
            {/* Background arc (full path) */}
            <Path
              d={generateArcPath()}
              stroke="url(#arcBgGradientDark)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="6 4"
            />
            
            {/* Colored arc (progress) */}
            {isDaytime && (
              <Path
                d={generateArcPath()}
                stroke="url(#arcGradientDark)"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${sunPosition * 300} 1000`}
              />
            )}
            
            {/* Sunrise point */}
            <Circle cx={20} cy={arcHeight} r={8} fill="#10b981" opacity={0.5} />
            <Circle cx={20} cy={arcHeight} r={5} fill="#10b981" />
            
            {/* Sunset point */}
            <Circle cx={arcWidth - 20} cy={arcHeight} r={8} fill="#10b981" opacity={0.5} />
            <Circle cx={arcWidth - 20} cy={arcHeight} r={5} fill="#10b981" />
          </Svg>
          
          {/* Sun indicator */}
          {isDaytime && (
            <Animated.View 
              style={[
                styles.sunIndicator,
                { left: sunPos.x - 16, top: sunPos.y - 16 },
                sunScaleStyle
              ]}
            >
              <Animated.View style={[styles.sunGlow, glowStyle]} />
              <View style={styles.sunCore} />
            </Animated.View>
          )}
        </View>

        {/* Countdown Pill - Bottom */}
        <View style={styles.countdownPillContainer}>
          <View style={styles.countdownPill}>
            <Icon 
              source={isSuhoorCountdown ? "weather-night" : "white-balance-sunny"} 
              size={22} 
              color="#10b981" 
            />
            <Text style={styles.countdownPillText}>
              {isSuhoorCountdown ? 'Suhoor ends in ' : 'Iftar in '}
              <Text style={styles.countdownPillTime}>{countdownText}</Text>
            </Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

// ============================================
// QURAN TRACKER COMPONENT
// ============================================
interface QuranTrackerProps {
  currentSurah: {
    surah: number;
    ayah_num: number;
    ayah: string;
    surah_name: string;
  };
  showInfo: boolean;
  onToggleInfo: () => void;
}

const QuranTracker = ({ currentSurah, showInfo, onToggleInfo }: QuranTrackerProps) => {
  const infoHeight = useSharedValue(0);
  const shimmerPosition = useSharedValue(-1);
  
  // Calculate Quran progress (rough estimate based on surah number)
  // Total 114 surahs, but we'll use a more accurate verse-based estimate
  const totalVerses = 6236;
  const versesBeforeSurah = [
    0, 7, 293, 493, 669, 789, 954, 1160, 1235, 1364, 1473, 1596, 1707, 1750, 1802,
    1901, 2029, 2140, 2250, 2348, 2483, 2595, 2673, 2791, 2855, 2932, 3159, 3252,
    3340, 3409, 3469, 3503, 3533, 3606, 3660, 3705, 3788, 3970, 4058, 4133, 4218,
    4272, 4325, 4414, 4473, 4510, 4545, 4583, 4612, 4630, 4675, 4735, 4784, 4846,
    4901, 4979, 5075, 5104, 5126, 5150, 5163, 5177, 5188, 5199, 5217, 5229, 5241,
    5271, 5323, 5375, 5419, 5447, 5475, 5495, 5531, 5566, 5616, 5656, 5672, 5698,
    5743, 5765, 5801, 5829, 5848, 5884, 5909, 5931, 5948, 5967, 5993, 6023, 6043,
    6058, 6079, 6090, 6098, 6106, 6125, 6130, 6138, 6146, 6157, 6168, 6176, 6179,
    6188, 6193, 6197, 6204, 6207, 6213, 6221, 6227, 6231
  ];
  
  const currentVerseNumber = (versesBeforeSurah[currentSurah.surah - 1] || 0) + currentSurah.ayah_num;
  const progressPercent = Math.min(100, Math.round((currentVerseNumber / totalVerses) * 100));
  
  // Juz calculation (approximate)
  const juzNumber = Math.min(30, Math.ceil((currentVerseNumber / totalVerses) * 30));

  useEffect(() => {
    infoHeight.value = withSpring(showInfo ? 60 : 0, {
      damping: 15,
      stiffness: 100,
    });
  }, [showInfo]);

  // Shimmer animation on mount
  useEffect(() => {
    shimmerPosition.value = withDelay(
      800,
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
    );
  }, []);

  const infoStyle = useAnimatedStyle(() => ({
    height: infoHeight.value,
    opacity: interpolate(infoHeight.value, [0, 60], [0, 1]),
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmerPosition.value, [-1, 1], [-200, 200]) }],
  }));

  return (
    <Animated.View 
      entering={FadeInDown.delay(600).duration(600).springify()}
      style={styles.quranTrackerContainer}
    >
      <View style={styles.quranTrackerCard}>
        {/* Left section - Content */}
        <View style={styles.quranTrackerLeft}>
          {/* Header */}
          <View style={styles.quranTrackerHeader}>
            <View style={styles.quranTrackerTitleRow}>
              <Icon source="book-open-page-variant" size={18} color="#1d4681" />
              <Text style={styles.quranTrackerTitle}>Ramadan Quran Tracker</Text>
            </View>
            <View style={styles.juzBadge}>
              <Text style={styles.juzBadgeText}>Juz {juzNumber}</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBg}>
              <LinearGradient
                colors={['#10b981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
              />
              {/* Shimmer effect */}
              <Animated.View style={[styles.progressShimmer, shimmerStyle]} />
            </View>
            <Text style={styles.progressText}>{progressPercent}% Complete</Text>
          </View>

          {/* Arabic Ayah */}
          <View style={styles.ayahContainer}>
            <Text style={styles.ayahText} numberOfLines={2}>
              {currentSurah?.ayah}
            </Text>
          </View>

          {/* Current position */}
          <View style={styles.currentPositionContainer}>
            <Text style={styles.currentPositionLabel}>Currently Reading:</Text>
            <Text style={styles.currentPositionValue}>
              {currentSurah.surah_name} - {currentSurah.surah}:{currentSurah.ayah_num}
            </Text>
          </View>
        </View>

        {/* Right section - Image with gradient */}
        <View style={styles.quranTrackerRight}>
          <Image
            source={require('@/assets/images/QuranImg.png')}
            style={styles.quranImage}
          />
          {/* Gradient overlay on left edge */}
          <LinearGradient
            colors={['#ffffff', 'rgba(255, 255, 255, 0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.quranImageGradient}
          />
          <Pressable 
            style={styles.infoButton}
            onPress={onToggleInfo}
            hitSlop={10}
          >
            <View style={[styles.infoButtonInner, showInfo && styles.infoButtonActive]}>
              <Icon
                source={showInfo ? 'close' : 'information-outline'}
                size={18}
                color={showInfo ? '#fff' : '#1d4681'}
              />
            </View>
          </Pressable>
        </View>
      </View>

      {/* Info panel - animated */}
      <Animated.View style={[styles.infoPanelContainer, infoStyle]}>
        <LinearGradient
          colors={['#f1f5f9', '#e2e8f0']}
          style={styles.infoPanel}
        >
          <Icon source="information" size={16} color="#64748b" />
          <Text style={styles.infoPanelText}>
            Updated after Taraweeh One, Taraweeh Two, and Fajr prayers automatically.
          </Text>
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
};


export default function Index() {
  // ALL hooks must be called unconditionally at the top
  const { data: prayerTimesWeek, isLoading } = usePrayerTimes();
  const currentPrayer = useCurrentPrayer();
  const upcomingPrayer = useUpcomingPrayer();
  const timeToNextPrayer = useTimeToNextPrayer();
  const { session } = useAuth();
  const [isRendered, setIsRendered] = useState(false);
  const [currentSurah, setCurrentSurah] = useState({ surah: 1, ayah_num: 1, ayah: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ', surah_name: 'Surah Al-Fatiha' });
  const [showRamadanTrackerInfo, setShowRamadanTrackerInfo] = useState(false);
  const [tableIndex, setTableIndex] = useState(0);
  const { data: UserSettings } = usePrayerNotificationSettings(session?.user.id);
  const [taraweehLineup, setTaraweehLineup] = useState<{
    sessionOne?: {
      firstFourImam?: { imam_name: string; imam_img?: string };
      speaker?: { speaker_name: string; speaker_img?: string };
      secondFourImam?: { imam_name: string; imam_img?: string };
      witrImam?: { imam_name: string; imam_img?: string };
      capacity_status?: CapacityStatus;
    };
    sessionTwo?: {
      firstFourImam?: { imam_name: string; imam_img?: string };
      speaker?: { speaker_name: string; speaker_img?: string };
      secondFourImam?: { imam_name: string; imam_img?: string };
      witrImam?: { imam_name: string; imam_img?: string };
      capacity_status?: CapacityStatus;
    };
  } | null>(null);
  const { height } = Dimensions.get('window');
  const tableWidth = Dimensions.get('screen').width * .95;
  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;
  const flatlistRef = useRef<FlatList>(null);

  const GetRamadanTracker = async () => {
    const { data, error } = await supabase.from('ramadan_quran_tracker').select('*').eq('id', 1).single();
    if (data) {
      setCurrentSurah(data);
    }
  };

  const getTaraweehLineup = async () => {
    // Fetch today's taraweeh lineup from supabase
    const today = format(new Date(), 'yyyy-MM-dd');
    const { data, error } = await supabase
      .from('taraweeh_lineup')
      .select('*')
      .eq('date', today)
      .single();
    
    if (data) {
      setTaraweehLineup(data.lineup);
    } else {
      // If no data in database, use placeholder/default data
      // This can be removed once the database is populated
      setTaraweehLineup({
        sessionOne: {
          firstFourImam: { imam_name: 'TBA' },
          speaker: { speaker_name: 'TBA' },
          secondFourImam: { imam_name: 'TBA' },
          witrImam: { imam_name: 'TBA' },
        },
        sessionTwo: {
          firstFourImam: { imam_name: 'TBA' },
          speaker: { speaker_name: 'TBA' },
          secondFourImam: { imam_name: 'TBA' },
          witrImam: { imam_name: 'TBA' },
        },
      });
    }
  };

  // ALL useEffect hooks must be called before early returns
  useEffect(() => {
    flatlistRef.current?.scrollToIndex({
      index: tableIndex,
      animated: true
    });
  }, [tableIndex]);

  useEffect(() => {
    if (!session?.user.id) return;

    GetRamadanTracker();
    getTaraweehLineup();

    const listenForQuranTrackerChanges = supabase.channel('Listen for Quran Tracker Changes').on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'ramadan_quran_tracker',
        filter: `id=eq.${1}`
      },
      async (payload) => await GetRamadanTracker()
    ).subscribe();

    const listenForTaraweehLineupChanges = supabase.channel('Listen for Taraweeh Lineup Changes').on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'taraweeh_lineup',
      },
      async (payload) => await getTaraweehLineup()
    ).subscribe();

    return () => {
      supabase.removeChannel(listenForQuranTrackerChanges);
      supabase.removeChannel(listenForTaraweehLineupChanges);
    };
  }, [session?.user.id]);

  // Early returns AFTER all hooks
  if (isLoading) {
    return (
      <View className='flex flex-1 h-screen justify-center items-center bg-white'>
        <Text className='text-lg font-semibold text-gray-600'>Loading prayer times...</Text>
      </View>
    );
  }

  if (!prayerTimesWeek || prayerTimesWeek.length === 0) {
    return (
      <View className='flex flex-1 h-screen justify-center items-center bg-white'>
        <Text className='text-lg font-semibold text-gray-600'>No prayer times available</Text>
      </View>
    );
  }

  // Component logic and handlers
  const todaysDate = new Date();
  const handleScroll = (event: any) => {
    const scrollPositon = event.nativeEvent.contentOffset.x;
    const index = Math.floor(scrollPositon / tableWidth);
    setTableIndex(index);
  };



  const FirstTaraweehTime = setTimeToCurrentDate(convertTo24Hour(prayerTimesWeek[0].iqa_isha))
  const FirstTaraweehEndTime = new Date(FirstTaraweehTime).setHours(FirstTaraweehTime.getHours() + 1)
  const SecondTaraweehTime = new Date(FirstTaraweehTime).setHours(FirstTaraweehTime.getHours() + 1, FirstTaraweehTime.getMinutes() + 20)
  const SecondTaraweehEndTime = new Date(FirstTaraweehTime).setHours(FirstTaraweehTime.getHours() + 2, FirstTaraweehTime.getMinutes() + 20)
  return (
    <LinearGradient
      colors={['#e8f4fc', '#f5fafd']}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBar barStyle={"dark-content"} />
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 80 }} bounces={false}>
        {/* Header */}
        <View style={{ paddingTop: 10, paddingBottom: 8, alignItems: 'center' }}>
          <Text style={{ color: '#1d4681', fontSize: 24, fontWeight: '700' }}>Prayer Times</Text>
        </View>

        <View style={{ flex: 1 }}
        >
          {/* Weekly Prayer Times */}
          <FlatList
            data={prayerTimesWeek}
            renderItem={({ item, index }) => <Table prayerData={item} setTableIndex={setTableIndex} tableIndex={tableIndex} index={index} userSettings={UserSettings} />}
            horizontal
            bounces={false}
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            scrollEventThrottle={32}
            viewabilityConfig={viewConfig}
            contentContainerStyle={{ justifyContent: "center", alignItems: "center" }}
            ref={flatlistRef}
            className='h-[100%] p-0'
          />
          {/* Business Ads */}
          <ApprovedAds setRenderedFalse={() => setIsRendered(false)} setRenderedTrue={() => setIsRendered(true)} />
          
          {/* ==================== RAMADAN COMPONENTS ==================== */}
          
          {/* Taraweeh Timeline - Unified Widget */}
          <TaraweehTimeline
            sessionOneStart={FirstTaraweehTime}
            sessionOneEnd={FirstTaraweehEndTime}
            sessionTwoStart={SecondTaraweehTime}
            sessionTwoEnd={SecondTaraweehEndTime}
            currentSurah={currentSurah}
            sessionOneLineup={taraweehLineup?.sessionOne}
            sessionTwoLineup={taraweehLineup?.sessionTwo}
          />

          {/* Suhoor & Iftar Timer - Redesigned */}
          <SuhoorIftarTimer
            todayFajrAthan={prayerTimesWeek[0].athan_fajr}
            tomorrowFajrAthan={prayerTimesWeek[1]?.athan_fajr || prayerTimesWeek[0].athan_fajr}
            todayMaghribAthan={prayerTimesWeek[0].athan_maghrib}
            tomorrowMaghribAthan={prayerTimesWeek[1]?.athan_maghrib || prayerTimesWeek[0].athan_maghrib}
          />

          {/* Ramadan Quran Tracker - Redesigned */}
          {/* <QuranTracker
            currentSurah={currentSurah}
            showInfo={showRamadanTrackerInfo}
            onToggleInfo={() => setShowRamadanTrackerInfo(!showRamadanTrackerInfo)}
          /> */}
             
              


        </View>
        {/* <ApprovedAds setRenderedFalse={() => setIsRendered(false)} setRenderedTrue={() => setIsRendered(true) }/> */}
      </ScrollView>
    </LinearGradient>
  )
}



{/* <View className='h-[100%]  bg-white'>
<StatusBar barStyle={"dark-content"} />
<View className='items-center justify-center '>
<ImageBackground
  source={require('@/assets/images/PrayerTimesHeader.jpg')}
  style={{ height : isRendered ? height / 1.85 : height / 1.3 , justifyContent : 'flex-end' }}
  imageStyle={{ height : isRendered ? height / 4.5 : height / 3.5 , opacity : 0.9, borderBottomLeftRadius : 10, borderBottomRightRadius : 10}}
  className='border-2 border-orange-500'
>
  <View className='items-center justify-center border border-black h-[100%]'>
    <FlatList 
      data={prayerTimesWeek}
      renderItem={({item, index}) => <Table prayerData={item} setTableIndex={setTableIndex} tableIndex={tableIndex} index={index} userSettings={UserSettings}/>}
      horizontal
      bounces={false}
      showsHorizontalScrollIndicator={false}
      pagingEnabled
      scrollEventThrottle={32}
      viewabilityConfig={viewConfig}
      contentContainerStyle={{justifyContent: "center", alignItems: "center"}}
      ref={flatlistRef}
    />
  </View>
  </ImageBackground>



</View>
</View> */}

{
  /*
  
   <View className='flex-row items-center justify-between  flex-wrap mt-[10]'>
              <View className='flex-col items-center justify-center ml-[10]'>
                  <View className='w-[95] h-[80] items-center justify-center bg-white' style={{shadowColor: "black", shadowOffset: {width : 0, height: 0}, shadowOpacity: 1, shadowRadius: 3, borderRadius: 8}}>
                    <Image source={{ uri : "https://cdn-icons-png.freepik.com/512/10073/10073987.png" || undefined}} style={{width: 50, height: 50, objectFit: "contain"}} />
                  </View>
                    <Text className='text-xl font-bold'> Qibla </Text>
                </View>

                <View className='flex-col items-center justify-center '>
                  <View className='w-[95] h-[80] items-center justify-center bg-white' style={{shadowColor: "black", shadowOffset: {width : 0, height: 0}, shadowOpacity: 1, shadowRadius: 3, borderRadius: 8}}>
                    <Image source={{ uri : "https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678116-calendar-512.png" || undefined}} style={{width: 50, height: 50, objectFit: "contain"}} />
                  </View>
                    <Text className='text-xl font-bold'> Calender </Text>
                </View>

                <View className='flex-col items-center justify-center mr-[10]'>
                  <View className='w-[95] h-[80] items-center justify-center bg-white' style={{shadowColor: "black", shadowOffset: {width : 0, height: 0}, shadowOpacity: 1, shadowRadius: 3, borderRadius: 8}}>
                    <Image source={{ uri : "https://cdn-icons-png.flaticon.com/512/5195/5195218.png" || undefined}} style={{width: 50, height: 50, objectFit: "contain"}} />
                  </View>
                    <Text className='text-xl font-bold'> 99 Names</Text>
                </View>
            </View>
  */
}
{/* <ApprovedAds setRenderedFalse={() => setIsRendered(false)} setRenderedTrue={() => setIsRendered(true) }/>
        <View className='flex flex-row space-x-2 items-center justify-center w-full '>
          <ImageBackground source={require('@/assets/images/TaraweehCard.png')} 
          style={{height: 130, width: 190, padding: 15}} imageStyle={{borderRadius: 15}}
          className='flex flex-col '
          >
            <Text className='text-black text-xs text-start'>Starting</Text>
            <Text className='text-[#06F] text-md text-start'>Tarawih One</Text>
            <Text className='text-black font-bold text-lg mt-4'>{format(FirstTaraweehTime, 'p')}</Text>
            <Text className='text-xs'>End Time: <Text className='font-bold text-md'>{format(FirstTaraweehEndTime, 'p')}</Text></Text>
          </ImageBackground>
          <ImageBackground source={require('@/assets/images/TaraweehCard.png')} 
          style={{height: 130, width: 190, padding: 15 }} imageStyle={{borderRadius: 15}}
          >
            <Text className='text-black text-xs text-start'>Following</Text>
            <Text className='text-[#06F] text-md text-start'>Tarawih Two</Text>
            <Text className='text-black font-bold text-lg mt-4'>{format(SecondTaraweehTime, 'p')}</Text>
            <Text className='text-xs'>End Time: <Text className='font-bold text-md'>{format(SecondTaraweehEndTime, 'p')}</Text></Text>
          </ImageBackground>
        </View> */}

function setTimeToCurrentDate(timeString: string) {

  const currentDate = new Date(); // Get current date

  // Split the time string into hours, minutes, and seconds
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  // Create a new Date object with the current date
  const timestampWithTimeZone = new Date();

  // Set the time with setHours (adjust based on local timezone or UTC as needed)
  timestampWithTimeZone.setHours(hours, minutes, seconds, 0); // No milliseconds

  // Convert to ISO format with timezone (to ensure it's interpreted as a TIMESTAMPTZ)
  const timestampISO = timestampWithTimeZone // This gives a full timestamp with timezone in UTC

  return timestampISO
}

function convertTo24Hour(timeStr: string) {
  // Extract the period ("AM"/"PM") and the time part ("7:15")
  const period = timeStr.slice(-2).toUpperCase();
  const [hourStr, minuteStr] = timeStr.slice(0, -2).split(":");
  let hour = parseInt(hourStr, 10);

  // Adjust hour based on period
  if (period === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period === 'AM' && hour === 12) {
    hour = 0;
  }

  // Format hour and minute to two digits and add seconds ":00"
  const hh = hour.toString().padStart(2, '0');
  const mm = minuteStr.padStart(2, '0');
  return `${hh}:${mm}:00`;
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  // Taraweeh Timeline Styles
  timelineContainer: {
    width: '95%',
    alignSelf: 'center',
    marginVertical: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 28,
    shadowColor: '#1d4681',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  timelineHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineMoonIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(29, 70, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1d4681',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
    marginRight: 5,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ef4444',
    letterSpacing: 0.5,
  },
  timelineTrack: {
    height: 50,
    position: 'relative',
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  timelineLineBg: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    height: 4,
    backgroundColor: 'rgba(29, 70, 129, 0.2)',
    borderRadius: 2,
  },
  timelineLineProgress: {
    position: 'absolute',
    top: 10,
    left: 12,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  timelineLineGradient: {
    flex: 1,
  },
  timelineNodeContainer: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
  },
  timelineNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(29, 70, 129, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(29, 70, 129, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineNodeCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  timelineNodeActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
    borderWidth: 2,
  },
  nodeInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  timelineNodeLabel: {
    marginTop: 4,
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  sessionCardsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  sessionCard: {
    flex: 1,
    backgroundColor: 'rgba(241, 245, 249, 0.95)',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(29, 70, 129, 0.15)',
    position: 'relative',
  },
  sessionCardActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10b981',
    borderWidth: 1.5,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sessionNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1d4681',
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
    marginRight: 6,
    overflow: 'hidden',
  },
  sessionLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  sessionTime: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1d4681',
    marginBottom: 2,
  },
  sessionTimeActive: {
    color: '#10b981',
  },
  sessionEndTime: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  sessionArrow: {
    paddingHorizontal: 8,
  },
  nowBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10b981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  capacityLight: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  taraweehCapacityLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 16,
    backgroundColor: 'rgba(29, 70, 129, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignSelf: 'center',
  },
  taraweehLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taraweehLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  taraweehLegendText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  nowBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  sessionActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 8,
  },
  viewLineupBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(29, 70, 129, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 4,
  },
  viewLineupBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1d4681',
  },
  sessionNotificationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(29, 70, 129, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 4,
  },
  sessionNotificationBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1d4681',
  },
  taraweehCountdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(29, 70, 129, 0.08)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 50,
    gap: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(29, 70, 129, 0.15)',
  },
  taraweehCountdownText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  taraweehCountdownTime: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1d4681',
  },

  // Compact Quran Tracker Styles (inside Taraweeh container)
  compactQuranContainer: {
    marginHorizontal: -16,
    padding: 16,
    marginBottom: 16,
  },
  compactQuranHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  compactQuranTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactQuranTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  compactJuzBadge: {
    backgroundColor: 'rgba(29, 70, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  compactJuzBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1d4681',
  },
  compactQuranProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  compactProgressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(29, 70, 129, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  compactProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  compactProgressText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
    minWidth: 32,
  },
  compactSurahText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1d4681',
  },
  compactAyahContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  compactAyahText: {
    fontSize: 18,
    color: '#1e293b',
    textAlign: 'right',
    lineHeight: 30,
  },

  // Suhoor/Iftar Sun Arc Styles
  sunArcContainer: {
    width: '95%',
    alignSelf: 'center',
    marginVertical: 8,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  sunArcGradient: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 16,
    minHeight: 180,
    position: 'relative',
  },
  starsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 2,
    opacity: 0.5,
  },
  moonContainer: {
    position: 'absolute',
    top: 12,
    right: 20,
  },
  moon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#e2e8f0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  moonShadow: {
    position: 'absolute',
    top: -10,
    left: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1d4681',
  },
  arcContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  sunIndicator: {
    position: 'absolute',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunGlow: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  sunCore: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#34d399',
    borderWidth: 3,
    borderColor: '#10b981',
  },
  timeLabelsTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  timeLabelLeft: {
    alignItems: 'flex-start',
  },
  timeLabelRight: {
    alignItems: 'flex-end',
  },
  timeLabelIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  timeLabelTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
    marginTop: 2,
  },
  timeLabelValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
    marginTop: 2,
  },
  countdownPillContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  countdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 50,
    gap: 10,
    width: '100%',
  },
  countdownPillText: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  countdownPillTime: {
    fontSize: 17,
    fontWeight: '700',
    color: '#10b981',
  },

  // Quran Tracker Styles
  quranTrackerContainer: {
    width: '95%',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  quranTrackerCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#1d4681',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  quranTrackerLeft: {
    flex: 1,
    padding: 14,
  },
  quranTrackerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  quranTrackerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quranTrackerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1d4681',
    marginLeft: 6,
  },
  juzBadge: {
    backgroundColor: 'rgba(29, 70, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  juzBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1d4681',
  },
  progressBarContainer: {
    marginBottom: 10,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(29, 70, 129, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    width: 60,
  },
  progressText: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: '600',
  },
  ayahContainer: {
    backgroundColor: 'rgba(29, 70, 129, 0.04)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    minHeight: 50,
    justifyContent: 'center',
  },
  ayahText: {
    fontSize: 16,
    color: '#1e293b',
    textAlign: 'right',
    fontFamily: 'System',
    lineHeight: 26,
  },
  currentPositionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  currentPositionLabel: {
    fontSize: 11,
    color: '#64748b',
    marginRight: 4,
  },
  currentPositionValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F6D169',
  },
  quranTrackerRight: {
    width: 120,
    position: 'relative',
    overflow: 'hidden',
  },
  quranImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  quranImageGradient: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 40,
  },
  infoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  infoButtonInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoButtonActive: {
    backgroundColor: '#1d4681',
  },
  infoPanelContainer: {
    overflow: 'hidden',
    marginTop: 8,
  },
  infoPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  infoPanelText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    marginLeft: 8,
    lineHeight: 18,
  },
});