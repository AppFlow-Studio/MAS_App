import { View, Text, Pressable, ImageBackground, ScrollView, Animated, Image, Dimensions, PanResponder, LayoutAnimation, Platform, UIManager, Modal as RNModal } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Program, EventsType, Lectures, SheikDataType } from '../types';
import moment from 'moment';
import { Link, useRouter } from 'expo-router';
import { Icon, Modal, Portal, Button } from 'react-native-paper';
import { supabase } from '@/src/lib/supabase';
import { parse, isBefore, format } from 'date-fns';
import { useAuth } from '@/src/providers/AuthProvider';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { FlyerSkeleton } from './FlyerSkeleton';
import YoutubePlayer from "react-native-youtube-iframe";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { glassyToastConfig } from '@/src/lib/toastConfig';

// Use centralized glassy toast config
const toastConfig = glassyToastConfig;

// Helper function to extract video ID from YouTube URL
const getVideoIdFromUrl = (url: string) => {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? match[1] : null;
};

type UpcomingProgramWidgetProp = {
  // No props needed - will fetch data internally
}

type UpcomingItem = {
  id: string;
  name: string;
  time: string;
  image: string | null;
  description: string | null;
  type: 'program' | 'event';
  link: string;
}

// Helper function to set time to current date
function setTimeToCurrentDate(timeString: string) {
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  const timestampWithTimeZone = new Date();
  timestampWithTimeZone.setHours(hours, minutes, seconds || 0, 0);
  return timestampWithTimeZone;
}

// Helper function to schedule notifications
const schedule_notification = async (
  user_id: string,
  push_notification_token: string,
  message: string,
  notification_type: string,
  program_event_name: string,
  notification_time: Date
) => {
  const { error } = await supabase.from('program_notification_schedule').insert({
    user_id: user_id,
    push_notification_token: push_notification_token,
    message: message,
    notification_type: notification_type,
    program_event_name: program_event_name,
    notification_time: notification_time,
    title: program_event_name
  });
  if (error) {
    console.log(error);
  }
};

export default function UpcomingProgramWidget() {
  const router = useRouter();
  const { session } = useAuth();
  const [liveTime, setLiveTime] = useState(new Date());
  const [upcomingItem, setUpcomingItem] = useState<UpcomingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [itemInNotifications, setItemInNotifications] = useState(false);
  const [itemInPrograms, setItemInPrograms] = useState(false);
  const [programData, setProgramData] = useState<Program | null>(null);
  const [eventData, setEventData] = useState<EventsType | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;
  const [modalLectures, setModalLectures] = useState<Lectures[] | null>(null);
  const [modalSpeakerData, setModalSpeakerData] = useState<SheikDataType[]>([]);
  const [modalSpeakerString, setModalSpeakerString] = useState('');
  const [modalImageReady, setModalImageReady] = useState(false);
  const [modalVisibleState, setModalVisibleState] = useState(false);
  const [selectedLecture, setSelectedLecture] = useState<Lectures | null>(null);
  const [playing, setPlaying] = useState(false);
  const [watchedLectures, setWatchedLectures] = useState<Set<string>>(new Set());
  const [startedLectures, setStartedLectures] = useState<Set<string>>(new Set());
  const modalScrollRef = useRef<ScrollView>(null);
  const isScrolling = useRef(false);
  const scrollOffset = useRef(0);
  const previousScrollOffset = useRef(0);
  const panYValue = useRef(0);
  const isClosing = useRef(false);
  const [modalToast, setModalToast] = useState<{ type: string; props: any } | null>(null);
  const [notificationOptionsVisible, setNotificationOptionsVisible] = useState(false);
  const [selectedNotificationTimes, setSelectedNotificationTimes] = useState<number[]>([]);
  const notificationSlideAnim = useRef(new Animated.Value(0)).current;
  const notificationPanY = useRef(new Animated.Value(0)).current;
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const isSheetExpandedRef = useRef(false);
  const sheetHeightAnim = useRef(new Animated.Value(0)).current; // 0 = collapsed, 1 = expanded (legacy)

  // Pan responder for notification sheet drag-to-dismiss
  const notificationPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to downward gestures
        return gestureState.dy > 5 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderGrant: () => {
        notificationPanY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow downward movement
        if (gestureState.dy > 0) {
          notificationPanY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // If dragged down enough or with enough velocity, dismiss
        if (gestureState.dy > 80 || gestureState.vy > 0.5) {
          Animated.parallel([
            Animated.timing(notificationPanY, {
              toValue: 500,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(notificationSlideAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setNotificationOptionsVisible(false);
            notificationPanY.setValue(0);
          });
        } else {
          // Snap back
          Animated.spring(notificationPanY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 40,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;
  const { width, height } = Dimensions.get("window");

  // Get current day of the week
  const getCurrentDay = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  const currentDay = getCurrentDay();
  const currentTime = liveTime.toLocaleTimeString("en-US", { hour12: true, hour: "numeric", minute: "numeric" });

  // Helper function to convert time string to moment and format as 12-hour
  const parseTimeToMoment = (timeString: string) => {
    if (!timeString) return moment();

    try {
      // Try parsing as 12-hour format first (e.g., "2:30 PM" or "2:30:00 PM")
      const parsed12 = parse(timeString, 'h:mm a', new Date());
      if (!isNaN(parsed12.getTime())) {
        return moment(parsed12);
      }
    } catch (error) {
      // Continue to try other formats
    }

    try {
      // Try parsing as 24-hour format (e.g., "14:30" or "14:30:00")
      const parsed24 = parse(timeString, 'HH:mm', new Date());
      if (!isNaN(parsed24.getTime())) {
        return moment(parsed24);
      }
    } catch (error) {
      // Continue to try other formats
    }

    try {
      // Try parsing as 24-hour format with seconds (e.g., "14:30:00")
      const parsed24Sec = parse(timeString, 'HH:mm:ss', new Date());
      if (!isNaN(parsed24Sec.getTime())) {
        return moment(parsed24Sec);
      }
    } catch (error) {
      // Continue to try moment directly
    }

    // If all parsing fails, try moment directly with multiple formats
    const momentTime = moment(timeString, ['h:mm a', 'HH:mm', 'HH:mm:ss', 'h:mm:ss a'], true);
    if (momentTime.isValid()) {
      return momentTime;
    }

    // Last resort: return current time
    console.warn('Could not parse time:', timeString);
    return moment();
  };

  // Pan responder for slide-down gesture on full description sheet
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        // Only respond if ScrollView is at the top and not expanded
        return (scrollOffset.current === 0 && !isScrolling.current) || !isSheetExpandedRef.current;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to downward gestures when scroll is at top or not expanded
        if (isSheetExpandedRef.current && (scrollOffset.current > 0 || isScrolling.current)) return false;
        // Require significant downward movement to avoid conflicts
        return gestureState.dy > 5 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderGrant: () => {
        panY.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Only allow downward movement
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderTerminate: () => {
        // Snap back
        Animated.spring(panY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 40,
          friction: 8,
        }).start();
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Dismiss if dragged down enough or with enough velocity
        if (gestureState.dy > 80 || gestureState.vy > 0.5) {
          // Mark as closing to prevent re-renders
          isClosing.current = true;

          // Stop any ongoing animations
          slideAnim.stopAnimation();
          panY.stopAnimation();

          // Get current panY value from gesture
          const currentPanY = gestureState.dy;
          const remainingDistance = height - currentPanY;

          // Ensure panY is at current position before animating
          panY.setValue(currentPanY);

          // Animate panY from current position to height
          Animated.timing(panY, {
            toValue: height,
            duration: Math.max(150, Math.min(300, 300 * (remainingDistance / height))),
            useNativeDriver: true,
          }).start((finished) => {
            if (finished) {
              // Clean up after animation completes
              closeModal();
              panY.setValue(0);
              slideAnim.setValue(0);
              scrollOffset.current = 0;
              isScrolling.current = false;
              isClosing.current = false;
            }
          });
        } else {
          // Snap back to open position
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 9,
          }).start();
        }
      },
    })
  ).current;

  // Helper function to format time as 12-hour format
  const formatTime12Hour = (timeString: string): string => {
    if (!timeString) return 'TBD';

    try {
      const time = parseTimeToMoment(timeString);
      if (time.isValid()) {
        return time.format('h:mm A');
      }
    } catch (error) {
      console.error('Error formatting time:', error);
    }

    return timeString; // Return original if formatting fails
  };

  const fetchUpcomingPrograms = async () => {
    try {
      setLoading(true);
      const date = new Date();
      const isoString = date.toISOString();

      // Fetch all upcoming programs and events
      const { data: programs, error: programsError } = await supabase
        .from('programs')
        .select('*')
        .gte('program_end_date', isoString)
        .eq('is_kids', false);

      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .gte('event_end_date', isoString)
        .eq('pace', false);

      if (programsError || eventsError) {
        console.error('Error fetching programs/events:', programsError || eventsError);
        setUpcomingItem(null);
        setLoading(false);
        return;
      }

      // Filter for today's items - handle both array and string formats
      const todaysPrograms = programs?.filter(program => {
        if (!program.program_days) return false;
        // Handle array format
        if (Array.isArray(program.program_days)) {
          return program.program_days.some((day: string) =>
            day.toLowerCase().includes(currentDay.toLowerCase()) ||
            currentDay.toLowerCase().includes(day.toLowerCase())
          );
        }
        // Handle string format
        if (typeof program.program_days === 'string') {
          return program.program_days.toLowerCase().includes(currentDay.toLowerCase());
        }
        return false;
      }) || [];

      const todaysEvents = events?.filter(event => {
        if (!event.event_days) return false;
        // Handle array format
        if (Array.isArray(event.event_days)) {
          return event.event_days.some((day: string) =>
            day.toLowerCase().includes(currentDay.toLowerCase()) ||
            currentDay.toLowerCase().includes(day.toLowerCase())
          );
        }
        // Handle string format
        if (typeof event.event_days === 'string') {
          return event.event_days.toLowerCase().includes(currentDay.toLowerCase());
        }
        return false;
      }) || [];

      // Ensure programs and events are arrays
      const safePrograms = programs || [];
      const safeEvents = events || [];

      // If no programs today, look for next available program/event (any day)
      let allPrograms: UpcomingItem[] = [];
      let allEvents: UpcomingItem[] = [];

      if (todaysPrograms.length === 0 && todaysEvents.length === 0) {
        // Get all upcoming programs and events for the next 7 days
        allPrograms = safePrograms.map(p => ({
          id: p.program_id,
          name: p.program_name,
          time: p.program_start_time,
          image: p.program_img,
          description: p.program_desc,
          type: 'program' as const,
          link: `/menu/program/${p.program_id}` as any
        }));

        allEvents = safeEvents.map(e => ({
          id: e.event_id,
          name: e.event_name,
          time: e.event_start_time,
          image: e.event_img,
          description: e.event_desc,
          type: 'event' as const,
          link: `/menu/program/events/${e.event_id}` as any
        }));
      } else {
        // Use today's programs/events
        allPrograms = todaysPrograms.map(p => ({
          id: p.program_id,
          name: p.program_name,
          time: p.program_start_time,
          image: p.program_img,
          description: p.program_desc,
          type: 'program' as const,
          link: `/menu/program/${p.program_id}` as any
        }));

        allEvents = todaysEvents.map(e => ({
          id: e.event_id,
          name: e.event_name,
          time: e.event_start_time,
          image: e.event_img,
          description: e.event_desc,
          type: 'event' as const,
          link: `/menu/program/events/${e.event_id}` as any
        }));
      }

      // Combine and find the next upcoming item
      const allItems: UpcomingItem[] = [...allPrograms, ...allEvents];

      // Find the next upcoming item based on current time
      const now = moment();
      let nextItem: UpcomingItem | null = null;
      let smallestDuration = Infinity;

      allItems.forEach(item => {
        if (!item.time) return;

        try {
          const itemTime = parseTimeToMoment(item.time);
          if (!itemTime.isValid()) {
            console.error('Invalid time format for item:', item.name, item.time);
            return;
          }

          // Create a moment for today at the program time
          const today = moment().startOf('day');
          const programTimeToday = today.clone().hour(itemTime.hour()).minute(itemTime.minute()).second(0);

          // If program time has passed today, assume it's for tomorrow
          let targetTime = programTimeToday;
          if (programTimeToday.isBefore(now)) {
            targetTime = programTimeToday.clone().add(1, 'day');
          }

          const duration = targetTime.diff(now, 'minutes');

          // Consider items in the future or within the last 2 hours (still ongoing)
          if (duration >= -120 && duration < smallestDuration) {
            smallestDuration = duration;
            nextItem = item;
          }
        } catch (error) {
          console.error('Error parsing time for item:', item.name, item.time, error);
        }
      });

      // If still no item found, just show the first one
      if (!nextItem && allItems.length > 0) {
        nextItem = allItems[0];
      }

      setUpcomingItem(nextItem);

      // Store full program/event data for notifications
      if (nextItem) {
        if (nextItem.type === 'program') {
          const fullProgram = safePrograms.find(p => p.program_id === nextItem!.id);
          if (fullProgram) {
            setProgramData(fullProgram);
            setEventData(null);
          }
        } else {
          const fullEvent = safeEvents.find(e => e.event_id === nextItem!.id);
          if (fullEvent) {
            setEventData(fullEvent);
            setProgramData(null);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching upcoming programs:', error);
      setUpcomingItem(null);
    } finally {
      setLoading(false);
    }
  };

  // Check if item is already in notifications
  const checkNotificationStatus = async () => {
    if (!session?.user.id || !upcomingItem) return;

    try {
      if (upcomingItem.type === 'program') {
        const { data } = await supabase
          .from('added_notifications_programs')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('program_id', upcomingItem.id)
          .single();

        setItemInNotifications(!!data);
      } else {
        const { data } = await supabase
          .from('added_notifications_events')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('event_id', upcomingItem.id)
          .single();

        setItemInNotifications(!!data);
      }
    } catch (error) {
      console.error('Error checking notification status:', error);
    }
  };

  // Check if item is already in programs
  const checkProgramStatus = async () => {
    if (!session?.user.id || !upcomingItem || upcomingItem.type !== 'program') return;

    try {
      const { data } = await supabase
        .from('added_programs')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('program_id', upcomingItem.id)
        .single();

      setItemInPrograms(!!data);
    } catch (error) {
      console.error('Error checking program status:', error);
    }
  };

  // Open notification options modal
  const openNotificationOptions = () => {
    setSelectedNotificationTimes([]);
    setNotificationOptionsVisible(true);
    Animated.spring(notificationSlideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start();
  };

  // Toggle notification time selection (multi-select)
  const toggleNotificationTime = (minutes: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedNotificationTimes(prev => {
      if (prev.includes(minutes)) {
        return prev.filter(t => t !== minutes);
      } else {
        return [...prev, minutes];
      }
    });
  };

  // Handle confirm with multiple selected times
  const handleConfirmNotificationsWithTimes = async (minutesBeforeArray: number[]) => {
    if (!session?.user.id || !upcomingItem || minutesBeforeArray.length === 0) return;

    closeNotificationOptions();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const TodaysDate = new Date();
    const DaysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const getTimeLabel = (minutes: number) => {
      if (minutes === 120) return '2 hours';
      if (minutes === 60) return '1 hour';
      if (minutes === 30) return '30 minutes';
      return `${minutes} minutes`;
    };

    if (upcomingItem.type === 'program' && programData) {
      const { error } = await supabase
        .from('added_notifications_programs')
        .insert({
          user_id: session.user.id,
          program_id: upcomingItem.id,
          has_lectures: programData.has_lectures || false
        });

      if (!error) {
        const programDays = programData.program_days;
        const ProgramStartTime = setTimeToCurrentDate(programData.program_start_time || '');

        // Schedule notifications for all selected times
        for (const minutesBefore of minutesBeforeArray) {
          const timeLabel = getTimeLabel(minutesBefore);
          const NotificationTime = new Date(ProgramStartTime.getTime() - minutesBefore * 60 * 1000);

          if (programDays && isBefore(TodaysDate, NotificationTime)) {
            await Promise.all(
              (Array.isArray(programDays) ? programDays : [programDays]).map(async (day: string) => {
                const { data: user_push_token } = await supabase
                  .from('profiles')
                  .select('push_notification_token')
                  .eq('id', session.user.id)
                  .single();

                if ((TodaysDate.getDay() === DaysOfWeek.indexOf(day)) && user_push_token?.push_notification_token) {
                  await schedule_notification(
                    session.user.id,
                    user_push_token.push_notification_token,
                    `${programData.program_name} starts in ${timeLabel}!`,
                    `${timeLabel} Before`,
                    programData.program_name,
                    NotificationTime
                  );
                }
              })
            );
          }
        }

        setModalToast({
          type: 'addProgramToNotificationsToast',
          props: { props: programData, onPress: () => { setModalVisible(false); router.push('/myPrograms/notifications/NotificationEvents?initialTab=programs'); } }
        });
        setTimeout(() => setModalToast(null), 3000);
      }
    } else if (upcomingItem.type === 'event' && eventData) {
      const { error } = await supabase
        .from('added_notifications_events')
        .insert({
          user_id: session.user.id,
          event_id: upcomingItem.id
        });

      if (!error) {
        const eventDays = eventData.event_days;
        const EventStartTime = setTimeToCurrentDate(eventData.event_start_time || '');

        // Schedule notifications for all selected times
        for (const minutesBefore of minutesBeforeArray) {
          const timeLabel = getTimeLabel(minutesBefore);
          const NotificationTime = new Date(EventStartTime.getTime() - minutesBefore * 60 * 1000);

          if (eventDays && isBefore(TodaysDate, NotificationTime)) {
            await Promise.all(
              (Array.isArray(eventDays) ? eventDays : [eventDays]).map(async (day: string) => {
                const { data: user_push_token } = await supabase
                  .from('profiles')
                  .select('push_notification_token')
                  .eq('id', session.user.id)
                  .single();

                if ((TodaysDate.getDay() === DaysOfWeek.indexOf(day)) && user_push_token?.push_notification_token) {
                  await schedule_notification(
                    session.user.id,
                    user_push_token.push_notification_token,
                    `${eventData.event_name} starts in ${timeLabel}!`,
                    `${timeLabel} Before`,
                    eventData.event_name,
                    NotificationTime
                  );
                }
              })
            );
          }
        }

        setModalToast({
          type: 'addEventToNotificationsToast',
          props: { props: eventData, onPress: () => { setModalVisible(false); router.push('/myPrograms/notifications/NotificationEvents?initialTab=programs'); } }
        });
        setTimeout(() => setModalToast(null), 3000);
      }
    }

    setItemInNotifications(true);
  };

  // Close notification options modal
  const closeNotificationOptions = () => {
    Animated.timing(notificationSlideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setNotificationOptionsVisible(false);
    });
  };

  // Handle notification button press
  const handleNotificationPress = async () => {
    if (!session?.user.id || !upcomingItem) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (itemInNotifications) {
      // Remove from notifications
      if (upcomingItem.type === 'program') {
        const { error } = await supabase
          .from('added_notifications_programs')
          .delete()
          .eq('user_id', session.user.id)
          .eq('program_id', upcomingItem.id);

        if (programData) {
          const { error: settingsError } = await supabase
            .from('program_notifications_settings')
            .delete()
            .eq('user_id', session.user.id)
            .eq('program_id', upcomingItem.id);

          const { error: scheduleError } = await supabase
            .from('program_notification_schedule')
            .delete()
            .eq('user_id', session.user.id)
            .eq('program_event_name', programData.program_name);
        }
      } else {
        const { error } = await supabase
          .from('added_notifications_events')
          .delete()
          .eq('user_id', session.user.id)
          .eq('event_id', upcomingItem.id);

        if (eventData) {
          const { error: settingsError } = await supabase
            .from('event_notification_settings')
            .delete()
            .eq('user_id', session.user.id)
            .eq('event_id', upcomingItem.id);

          const { error: scheduleError } = await supabase
            .from('program_notification_schedule')
            .delete()
            .eq('user_id', session.user.id)
            .eq('program_event_name', eventData.event_name);
        }
      }

      setItemInNotifications(false);
    } else {
      // Close the description modal first if it's open, then show notification options
      if (modalVisible) {
        closeModal(true); // Skip animation for immediate close
        // Small delay to ensure modal is closed before opening notification options
        setTimeout(() => {
          openNotificationOptions();
        }, 100);
      } else {
        openNotificationOptions();
      }
    }
  };

  // Handle confirm notification selection (called from Save button)
  const handleConfirmNotifications = async () => {
    if (!session?.user.id || !upcomingItem || selectedNotificationTimes.length === 0) return;
    await handleConfirmNotificationsWithTimes(selectedNotificationTimes);
  };

  // Handle add to programs button press
  const handleAddToProgramsPress = async () => {
    if (!session?.user.id || !upcomingItem) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (itemInPrograms) {
      // Remove from programs
      if (upcomingItem.type === 'program') {
        const { error } = await supabase
          .from('added_programs')
          .delete()
          .eq('user_id', session.user.id)
          .eq('program_id', upcomingItem.id);
      }

      setItemInPrograms(false);
    } else {
      // Add to programs
      if (upcomingItem.type === 'program') {
        const { error } = await supabase
          .from('added_programs')
          .insert({
            user_id: session.user.id,
            program_id: upcomingItem.id
          });

        if (!error) {
          setItemInPrograms(true);

          // Show toast in modal
          setModalToast({
            type: 'ProgramAddedToPrograms',
            props: { props: programData, onPress: () => { } }
          });
          // Auto-hide modal toast after 3 seconds
          setTimeout(() => setModalToast(null), 3000);
        }
      }
    }
  };

  const getTimeToNextProgram = () => {
    if (!upcomingItem || !upcomingItem.time) {
      return 'No programs today';
    }

    try {
      // Get current time
      const now = moment();

      // Parse program time
      const programTime = parseTimeToMoment(upcomingItem.time);

      // Set both to today's date for accurate comparison
      const today = moment().startOf('day');
      const programTimeToday = today.clone().hour(programTime.hour()).minute(programTime.minute()).second(0);

      // If program time has passed today, assume it's for tomorrow
      let targetTime = programTimeToday;
      if (programTimeToday.isBefore(now)) {
        targetTime = programTimeToday.clone().add(1, 'day');
      }

      // Calculate duration
      const duration = moment.duration(targetTime.diff(now));
      const totalMinutes = Math.floor(duration.asMinutes());
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      // Handle if program has already started (within last 2 hours)
      if (totalMinutes < 0) {
        if (Math.abs(totalMinutes) < 120) {
          return 'Started';
        }
        return 'No upcoming programs';
      }

      if (totalMinutes === 0) {
        return 'Starting now';
      } else if (hours === 0) {
        return `${minutes} min`;
      } else {
        return `${hours}hr ${minutes} min`;
      }
    } catch (error) {
      console.error('Error calculating time to program:', error);
      return 'Time TBD';
    }
  };

  const refreshLiveTime = () => {
    setLiveTime(new Date());
  };

  // Fetch programs on mount and when day changes
  useEffect(() => {
    fetchUpcomingPrograms();
  }, []);

  // Check notification status when upcomingItem changes
  useEffect(() => {
    if (upcomingItem && session?.user.id) {
      checkNotificationStatus();
      checkProgramStatus();
    }
  }, [upcomingItem, session?.user.id]);

  // Fetch modal data when modal opens
  useEffect(() => {
    if (modalVisible && upcomingItem && (programData || eventData)) {
      fetchModalData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalVisible, upcomingItem, programData, eventData]);

  // Update time every second
  useEffect(() => {
    const timerId = setInterval(() => {
      refreshLiveTime();
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, []);

  // Re-check for next program when time updates
  useEffect(() => {
    if (!loading && upcomingItem) {
      try {
        const now = moment();
        const programTime = parseTimeToMoment(upcomingItem.time);

        if (!programTime.isValid()) {
          return;
        }

        // Create a moment for today at the program time
        const today = moment().startOf('day');
        const programTimeToday = today.clone().hour(programTime.hour()).minute(programTime.minute()).second(0);

        // If program time has passed today, assume it's for tomorrow
        let targetTime = programTimeToday;
        if (programTimeToday.isBefore(now)) {
          targetTime = programTimeToday.clone().add(1, 'day');
        }

        const duration = moment.duration(targetTime.diff(now));
        const totalMinutes = Math.floor(duration.asMinutes());

        // If current program has passed (more than 1 hour ago), refetch to find next one
        if (totalMinutes < -60) {
          fetchUpcomingPrograms();
        }
      } catch (error) {
        console.error('Error checking program time:', error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, loading, upcomingItem]);

  const timeToNextProgram = getTimeToNextProgram();

  const closeModal = useCallback((skipAnimation?: boolean) => {
    if (skipAnimation) {
      setModalVisible(false);
      setModalVisibleState(false);
      setIsSheetExpanded(false);
      isSheetExpandedRef.current = false;
      slideAnim.setValue(0);
      panY.setValue(0);
      panYValue.current = 0;
      sheetHeightAnim.setValue(0);
      setModalSpeakerData([]);
      setModalSpeakerString('');
      setModalImageReady(false);
      scrollOffset.current = 0;
      previousScrollOffset.current = 0;
      isScrolling.current = false;
      isClosing.current = false;
      return;
    }

    // Stop any ongoing animations
    slideAnim.stopAnimation();
    panY.stopAnimation();
    sheetHeightAnim.stopAnimation();

    // Animate closing
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(panY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      setModalVisibleState(false);
      setIsSheetExpanded(false);
      isSheetExpandedRef.current = false;
      setModalSpeakerData([]);
      setModalSpeakerString('');
      setModalImageReady(false);
      panY.setValue(0);
      panYValue.current = 0;
      sheetHeightAnim.setValue(0);
      scrollOffset.current = 0;
      previousScrollOffset.current = 0;
      isScrolling.current = false;
      isClosing.current = false;
    });
  }, [sheetHeightAnim]);

  // Toggle sheet expansion with smooth rise animation (like SignInAnonModal)
  const toggleSheetExpand = useCallback(() => {
    const newValue = !isSheetExpanded;
    
    // Use LayoutAnimation for smooth content-based height transition
    LayoutAnimation.configureNext({
      duration: 400,
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.scaleY,
        springDamping: 0.85,
      },
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });
    
    setIsSheetExpanded(newValue);
    isSheetExpandedRef.current = newValue;
  }, [isSheetExpanded]);

  const checkWatchedStatus = async (lecturesData: Lectures[]) => {
    try {
      const watchedKeys = lecturesData.map(lecture => `watched_lecture_${lecture.lecture_id}`);
      const startedKeys = lecturesData.map(lecture => `started_lecture_${lecture.lecture_id}`);
      const allKeys = [...watchedKeys, ...startedKeys];
      const allValues = await AsyncStorage.multiGet(allKeys);
      const watched = new Set<string>();
      const started = new Set<string>();
      allValues.forEach(([key, value]) => {
        if (value === 'true') {
          if (key.startsWith('watched_lecture_')) {
            const lectureId = key.replace('watched_lecture_', '');
            watched.add(lectureId);
          } else if (key.startsWith('started_lecture_')) {
            const lectureId = key.replace('started_lecture_', '');
            if (!watched.has(lectureId)) {
              started.add(lectureId);
            }
          }
        }
      });
      setWatchedLectures(watched);
      setStartedLectures(started);
    } catch (error) {
      console.log('Error checking watched status:', error);
    }
  };

  const onStateChange = useCallback((state: string) => {
    if (state === "ended") {
      setPlaying(false);
      if (selectedLecture) {
        AsyncStorage.setItem(`watched_lecture_${selectedLecture.lecture_id}`, 'true');
        setWatchedLectures(prev => new Set([...prev, selectedLecture.lecture_id]));
      }
    }
  }, [selectedLecture]);

  const fetchModalData = useCallback(async () => {
    if (!upcomingItem) return;

    // Handle programs - Only fetch speaker data for modal (no lectures/videos)
    if (upcomingItem.type === 'program' && programData) {
      // Fetch speaker data
      if (programData.program_speaker && Array.isArray(programData.program_speaker) && programData.program_speaker.length > 0) {
        const speakers: SheikDataType[] = [];
        const speakerArray = programData.program_speaker;
        let speaker_string: string[] = speakerArray.map(() => '');

        await Promise.all(
          speakerArray.map(async (speaker_id: string, index: number) => {
            const { data: speakerInfo } = await supabase
              .from('speaker_data')
              .select('*')
              .eq('speaker_id', speaker_id)
              .single();

            if (speakerInfo) {
              if (index === speakerArray.length - 1) {
                speaker_string[index] = speakerInfo.speaker_name;
              } else {
                speaker_string[index] = speakerInfo.speaker_name + ' & ';
              }
              speakers.push(speakerInfo);
            }
          })
        );

        setModalSpeakerData(speakers);
        setModalSpeakerString(speaker_string.join(''));
      }
    }
    // Handle events
    else if (upcomingItem.type === 'event') {
      // Events might have speakers too, but for now we'll leave it empty
      setModalSpeakerData([]);
      setModalSpeakerString('');
    }
  }, [upcomingItem, programData, eventData]);

  const openModal = useCallback(() => {
    setModalVisible(true);
    setModalVisibleState(false);
    setModalImageReady(false);
    panY.setValue(0); // Reset pan gesture
    panYValue.current = 0;
    scrollOffset.current = 0;
    previousScrollOffset.current = 0;
    isScrolling.current = false;
    isClosing.current = false;
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start();

    // Fetch modal data - will be handled by useEffect
  }, [slideAnim, panY]);

  const GetSheikData = () => {
    return (
      <View className='flex-1'>
        {modalSpeakerData?.map((speakerData, index) => (
          <View
            key={index}
            style={{
              borderRadius: 24,
              padding: 16,
              marginVertical: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 4,
              backgroundColor: '#374151',
              overflow: 'hidden',
            }}
          >
            <View className='flex-row items-center mb-4'>
              <View style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                overflow: 'hidden',
                borderWidth: 3,
                borderColor: '#E5E7EB',
                marginRight: 16,
              }}>
                <Image
                  source={speakerData?.speaker_img ? { uri: speakerData.speaker_img } : require("@/assets/images/MASHomeLogo.png")}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode='cover'
                />
              </View>
              <View className='flex-1'>
                <Text className='text-xs text-gray-300 font-medium mb-1'>SPEAKER</Text>
                <Text className='text-xl font-bold text-white' numberOfLines={2}>
                  {speakerData?.speaker_name}
                </Text>
              </View>
            </View>
            <View className='border-t border-gray-500 pt-4'>
              {speakerData?.speaker_name === "MAS" ? (
                <Text className='text-sm font-bold text-white mb-3'>Impact</Text>
              ) : (
                <Text className='text-sm font-bold text-white mb-3'>Credentials</Text>
              )}
              <View className='flex-col'>
                {speakerData?.speaker_creds?.map((cred, i) => (
                  <View key={i} className='flex-row items-start mb-2'>
                    <View style={{ marginRight: 8, marginTop: 2 }}>
                      <Icon source="cards-diamond-outline" size={16} color='#60A5FA' />
                    </View>
                    <Text className='text-sm text-gray-100 flex-1'>{cred}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View className="bg-white mx-3 pb-6 px-4" style={{
        marginTop: -60,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        minHeight: 120,
      }}>
        <View className="pt-6">
          <Text className="text-gray-400 text-sm">Loading programs...</Text>
        </View>
      </View>
    );
  }

  if (!upcomingItem) {
    return (
      <View className="bg-white mx-3 pb-6 px-4" style={{
        marginTop: -60,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        minHeight: 120,
      }}>
        <View className="pt-6">
          <View className="flex-row items-center mb-3">
            <Icon source="calendar-today" size={20} color="#0D509D" />
            <Text className="text-[#0D509D] font-bold text-lg ml-2">Upcoming Program</Text>
          </View>
          <Text className="text-gray-500 text-center py-4">
            No programs scheduled for {currentDay}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <>
      {/* Main Program Card */}
      <View className="bg-white pb-6 px-4" style={{
        marginHorizontal: 16,
        marginTop: -60,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        minHeight: 120,
        overflow: 'hidden',
      }}>
        <ImageBackground
          source={require("@/assets/images/CresentMoon.png")}
          style={{ height: "100%", width: "100%", position: "absolute", top: 0, right: -45, alignItems: 'flex-end', justifyContent: 'center' }}
          resizeMode="contain"
          imageStyle={{ opacity: 0.35, transform: [{ scale: 1.7 }, { translateX: 35 }, { translateY: 5 }] }}
        />
        <Pressable
          className="pt-6"
          style={{ position: 'relative', zIndex: 1 }}
          onPress={() => {
            // Always open modal like "read full description"
            openModal();
          }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Icon source="calendar-today" size={20} color="#0D509D" />
              <Text className="text-[#0D509D] font-bold text-lg ml-2">Upcoming Program</Text>
            </View>
            <Icon source="chevron-right" size={20} color="#0D509D" />
          </View>

          {/* Program Name and Time */}
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-1">
              <Text className="text-gray-800 font-bold text-xl" numberOfLines={2}>
                {upcomingItem.name}
              </Text>
            </View>
            <View className="ml-4">
              <Text className="text-[#0D509D] font-bold text-2xl">
                {formatTime12Hour(upcomingItem.time)}
              </Text>
            </View>
          </View>

          {/* Countdown */}
          <View className="flex-row items-center mb-3">
            <View style={{ marginRight: 6 }}>
              <Icon source="clock-outline" size={16} color="#0D509D" />
            </View>
            <Text className="text-gray-600 text-sm mr-2">Starts in</Text>
            <Text className="text-[#0D509D] font-bold text-lg">{timeToNextProgram}</Text>
          </View>
        </Pressable>
      </View>

      {/* Separate Description & Notification Card */}
      {upcomingItem.description && (
        <View style={{
          marginHorizontal: 16,
          marginTop: -30,
          backgroundColor: '#D1D5DB',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 5,
          padding: 1,
        }}>
          <View className="bg-white flex-row relative" style={{
            borderTopLeftRadius: 15,
            borderTopRightRadius: 15,
            borderBottomLeftRadius: 15,
            borderBottomRightRadius: 15,
          }}>
            <Pressable
              className="flex-1 bg-white p-2 items-center justify-center"
              style={{
                minHeight: 55,
                borderTopLeftRadius: 15,
                borderBottomLeftRadius: 15,
              }}
              onPress={openModal}
            >
              <Text
                className="text-[#0D509D] text-sm font-medium"
              >
                Read full description
              </Text>
            </Pressable>
            {/* Vertical divider line in the middle - rendered before notification card */}
            <View
              style={{
                width: 1,
                backgroundColor: '#9CA3AF',
                marginTop: 12,
                marginBottom: 12,
              }}
            />
            {/* Notification Bell Card */}
            <Pressable
              className="flex-1 bg-white p-2 items-center justify-center"
              style={{
                minHeight: 55,
                borderTopRightRadius: 15,
                borderBottomRightRadius: 15,
              }}
              onPress={handleNotificationPress}
            >
              <Icon
                source={itemInNotifications ? "bell-check" : "bell"}
                size={22}
                color={itemInNotifications ? "#57BA47" : "#0D509D"}
              />
              <Text
                className="text-xs text-center mt-1"
                numberOfLines={2}
                style={{
                  lineHeight: 14,
                  color: itemInNotifications ? '#000000' : '#0D509D'
                }}
              >
                {itemInNotifications ? 'Notifications on' : 'Get notified'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Full Description Modal - Program Detail Page Style */}
      {upcomingItem && (
        <RNModal
          visible={modalVisible || isClosing.current}
          transparent={true}
          animationType="none"
          statusBarTranslucent
          onRequestClose={() => closeModal()}
        >
          <Animated.View 
            style={{ 
              flex: 1, 
              justifyContent: 'flex-end',
            }}
          >
            <Animated.View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.15)',
                opacity: slideAnim,
              }}
            >
              <Pressable
                style={{ flex: 1 }}
                onPress={() => closeModal()}
              />
            </Animated.View>
            <Animated.View
              {...panResponder.panHandlers}
              style={{
                transform: [{
                  translateY: Animated.add(
                    slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [400, 0],
                    }),
                    panY
                  )
                }],
                marginHorizontal: 12,
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 32,
                  paddingTop: 16,
                  paddingBottom: 34,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 16,
                  elevation: 20,
                  minHeight: isSheetExpanded ? undefined : 220,
                  maxHeight: height * 0.85,
                }}
              >
                {/* Drag Handle */}
                <Pressable
                  onPress={toggleSheetExpand}
                  style={{
                    width: '100%',
                    paddingBottom: 8,
                    alignItems: 'center',
                  }}
                >
                  <View style={{
                    width: 36,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: '#D1D5DB',
                  }} />
                </Pressable>

                <ScrollView 
                  contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={isSheetExpanded}
                >
                  {/* Card Header: Image + Title/Time */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    {/* Thumbnail Image */}
                    <View style={{
                      width: isSheetExpanded ? 80 : 60,
                      height: isSheetExpanded ? 80 : 60,
                      borderRadius: 12,
                      overflow: 'hidden',
                      backgroundColor: '#F3F4F6',
                    }}>
                      <Image
                        source={upcomingItem.image ? { uri: upcomingItem.image } : require("@/assets/images/MASHomeLogo.png")}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                        onLoad={() => setModalImageReady(true)}
                      />
                    </View>

                    {/* Title and Time */}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Text style={{
                          fontSize: 16,
                          fontWeight: '700',
                          color: '#111827',
                          flex: 1,
                          marginRight: 8,
                        }} numberOfLines={2}>
                          {upcomingItem.type === 'program' && programData ? programData.program_name : upcomingItem.name}
                        </Text>
                        <View style={{
                          backgroundColor: 'rgba(98, 224, 144, 0.15)',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 12,
                        }}>
                          <Text style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color: '#2D8B5F',
                          }}>
                            {formatTime12Hour(upcomingItem.time)}
                          </Text>
                        </View>
                      </View>

                      {/* Speaker with green dot */}
                      {modalSpeakerString && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                          <View style={{
                            width: 16,
                            height: 16,
                            borderRadius: 8,
                            backgroundColor: '#62E090',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 6,
                          }}>
                            <Icon source="account" size={10} color="#FFFFFF" />
                          </View>
                          <Text style={{
                            fontSize: 13,
                            color: '#6B7280',
                            fontWeight: '500',
                          }} numberOfLines={1}>
                            {modalSpeakerString}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Short description when collapsed */}
                  {!isSheetExpanded && upcomingItem.description && (
                    <Text style={{
                      fontSize: 13,
                      color: '#6B7280',
                      lineHeight: 18,
                      marginTop: 10,
                    }} numberOfLines={2}>
                      {upcomingItem.description}
                    </Text>
                  )}

                  {/* View Full Details Button - Only when collapsed */}
                  {!isSheetExpanded && (
                    <Pressable
                      onPress={toggleSheetExpand}
                      style={{
                        backgroundColor: '#224F92',
                        borderRadius: 14,
                        paddingVertical: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 24,
                      }}
                    >
                      <Text style={{
                        fontSize: 16,
                        fontWeight: '700',
                        color: '#FFFFFF',
                      }}>
                        View Full Details
                      </Text>
                    </Pressable>
                  )}

                  {/* Expanded Content */}
                  {isSheetExpanded && (
                    <>
                      {/* Full Description Section */}
                      {upcomingItem.description && (
                        <View style={{ marginTop: 16 }}>
                          <Text style={{
                            fontSize: 15,
                            fontWeight: '600',
                            color: '#111827',
                            marginBottom: 8,
                          }}>
                            About This Program
                          </Text>
                          <Text style={{
                            fontSize: 14,
                            color: '#6B7280',
                            lineHeight: 22,
                          }}>
                            {upcomingItem.description}
                          </Text>
                        </View>
                      )}

                      {/* Action Buttons */}
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 20 }}>
                        {/* Set Reminder / Notification Button */}
                        <Pressable
                          onPress={handleNotificationPress}
                          style={{
                            flex: 1,
                            backgroundColor: '#62E090',
                            borderRadius: 12,
                            paddingVertical: 14,
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'row',
                            gap: 6,
                          }}
                        >
                          <Icon 
                            source={itemInNotifications ? "bell-check" : "bell-outline"} 
                            size={18} 
                            color="#FFFFFF" 
                          />
                          <Text style={{
                            fontSize: 14,
                            fontWeight: '600',
                            color: '#FFFFFF',
                          }}>
                            {itemInNotifications ? 'Reminder Set' : 'Set Reminder'}
                          </Text>
                        </Pressable>

                        {/* Save Button */}
                        <Pressable
                          onPress={handleAddToProgramsPress}
                          style={{
                            width: 48,
                            height: 48,
                            backgroundColor: '#F3F4F6',
                            borderRadius: 12,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon 
                            source={itemInPrograms ? "heart" : "heart-outline"} 
                            size={22} 
                            color={itemInPrograms ? '#62E090' : '#6B7280'} 
                          />
                        </Pressable>
                      </View>

                      {/* Register Button for paid programs */}
                      {((upcomingItem.type === 'program' && programData && programData.program_is_paid) ||
                        (upcomingItem.type === 'event' && eventData && eventData.is_paid)) && (
                        <Pressable
                          onPress={async () => {
                            const paidLink = (upcomingItem.type === 'program' && programData?.paid_link) ||
                              (upcomingItem.type === 'event' && eventData?.paid_link);
                            if (paidLink) {
                              // Open WebBrowser first, then close modal after browser is dismissed
                              // This prevents the visual drop and app freeze issues
                              await WebBrowser.openBrowserAsync(paidLink);
                              closeModal();
                            }
                          }}
                          style={{
                            backgroundColor: '#224F92',
                            borderRadius: 12,
                            paddingVertical: 14,
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'row',
                            gap: 6,
                            marginTop: 8,
                          }}
                        >
                          <Icon source="cart-outline" size={18} color="#FFFFFF" />
                          <Text style={{
                            fontSize: 14,
                            fontWeight: '600',
                            color: '#FFFFFF',
                          }}>
                            Register Now
                          </Text>
                        </Pressable>
                      )}
                    </>
                  )}
                </ScrollView>
              </View>
            </Animated.View>
          </Animated.View>

          {/* Speaker Modal */}
          <Portal>
            <Modal
              visible={modalVisibleState}
              onDismiss={() => setModalVisibleState(false)}
              contentContainerStyle={{
                backgroundColor: 'transparent',
                padding: 20,
                minHeight: 400,
                maxHeight: "70%",
                width: "95%",
                borderRadius: 35,
                alignSelf: "center"
              }}
            >
              <View className='flex-1'>
                <GetSheikData />
              </View>
            </Modal>
          </Portal>
          {/* Custom Toast Notification - Renders inside modal to appear on top */}
          {modalToast && (
            <View
              style={{
                position: 'absolute',
                top: 50,
                left: 0,
                right: 0,
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                zIndex: 999999,
                elevation: 9999,
                pointerEvents: 'box-none',
                paddingHorizontal: 16,
              }}
            >
              <View style={{ width: '100%', maxWidth: '100%' }}>
                <Pressable
                  onPress={() => {
                    if (modalToast.props.onPress) {
                      modalToast.props.onPress();
                    }
                    setModalToast(null);
                  }}
                  className='rounded-xl overflow-hidden'
                  style={{ width: '100%', maxWidth: '100%' }}
                >
                  <View style={{ maxWidth: '100%', overflow: 'hidden' }}>
                    {toastConfig[modalToast.type as keyof typeof toastConfig]?.({ props: modalToast.props } as any)}
                  </View>
                </Pressable>
              </View>
            </View>
          )}
        </RNModal>
      )}

      {/* Notification Options Slide-up Modal */}
      {notificationOptionsVisible && (
        <Portal>
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              opacity: notificationSlideAnim,
            }}
          >
            <Pressable 
              style={{ flex: 1 }} 
              onPress={closeNotificationOptions}
            />
          </Animated.View>
          <Animated.View
            {...notificationPanResponder.panHandlers}
            style={{
              position: 'absolute',
              bottom: Platform.OS === 'ios' ? 12 : 10,
              left: 10,
              right: 10,
              backgroundColor: '#0E519F',
              borderRadius: 32,
              paddingBottom: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.2,
              shadowRadius: 20,
              elevation: 20,
              overflow: 'hidden',
              transform: [
                {
                  translateY: notificationSlideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [500, 0],
                  })
                },
                { translateY: notificationPanY }
              ]
            }}
          >
            {/* Drag Handle */}
            <View 
              style={{ 
                width: '100%', 
                alignItems: 'center', 
                paddingTop: 12, 
                paddingBottom: 8 
              }}
            >
              <View style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.4)',
              }} />
            </View>

            {/* Header */}
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              paddingHorizontal: 20, 
              paddingTop: 4, 
              paddingBottom: 20 
            }}>
              <Text style={{ 
                fontSize: 20, 
                fontWeight: '700', 
                color: '#ffffff',
              }}>
                Notification settings
              </Text>
              <Pressable
                onPress={closeNotificationOptions}
                style={{
                  width: 36,
                  height: 36,
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon source="close" size={20} color="#ffffff" />
              </Pressable>
            </View>

            {/* Checkbox Options (Multi-select) */}
            <View style={{ paddingHorizontal: 20 }}>
              {/* 2 Hours Before */}
              <Pressable
                onPress={() => toggleNotificationTime(120)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  paddingVertical: 14,
                  backgroundColor: selectedNotificationTimes.includes(120) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  borderRadius: 12,
                  marginHorizontal: -12,
                  paddingHorizontal: 12,
                }}
              >
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: selectedNotificationTimes.includes(120) ? '#57BA47' : 'rgba(255, 255, 255, 0.4)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                  marginTop: 2,
                  backgroundColor: selectedNotificationTimes.includes(120) ? '#57BA47' : 'transparent',
                }}>
                  {selectedNotificationTimes.includes(120) && (
                    <Icon source="check" size={16} color="#ffffff" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ 
                    fontSize: 17, 
                    fontWeight: '600', 
                    color: '#ffffff',
                  }}>
                    2 Hours Before
                  </Text>
                  <Text style={{ 
                    fontSize: 14, 
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginTop: 2,
                  }}>
                    Get reminded with plenty of time to prepare
                  </Text>
                </View>
              </Pressable>

              {/* 1 Hour Before */}
              <Pressable
                onPress={() => toggleNotificationTime(60)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  paddingVertical: 14,
                  backgroundColor: selectedNotificationTimes.includes(60) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  borderRadius: 12,
                  marginHorizontal: -12,
                  paddingHorizontal: 12,
                }}
              >
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: selectedNotificationTimes.includes(60) ? '#57BA47' : 'rgba(255, 255, 255, 0.4)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                  marginTop: 2,
                  backgroundColor: selectedNotificationTimes.includes(60) ? '#57BA47' : 'transparent',
                }}>
                  {selectedNotificationTimes.includes(60) && (
                    <Icon source="check" size={16} color="#ffffff" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ 
                    fontSize: 17, 
                    fontWeight: '600', 
                    color: '#ffffff',
                  }}>
                    1 Hour Before
                  </Text>
                  <Text style={{ 
                    fontSize: 14, 
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginTop: 2,
                  }}>
                    Standard reminder time
                  </Text>
                </View>
              </Pressable>

              {/* 30 Minutes Before */}
              <Pressable
                onPress={() => toggleNotificationTime(30)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  paddingVertical: 14,
                  backgroundColor: selectedNotificationTimes.includes(30) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  borderRadius: 12,
                  marginHorizontal: -12,
                  paddingHorizontal: 12,
                }}
              >
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: selectedNotificationTimes.includes(30) ? '#57BA47' : 'rgba(255, 255, 255, 0.4)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                  marginTop: 2,
                  backgroundColor: selectedNotificationTimes.includes(30) ? '#57BA47' : 'transparent',
                }}>
                  {selectedNotificationTimes.includes(30) && (
                    <Icon source="check" size={16} color="#ffffff" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ 
                    fontSize: 17, 
                    fontWeight: '600', 
                    color: '#ffffff',
                  }}>
                    30 Minutes Before
                  </Text>
                  <Text style={{ 
                    fontSize: 14, 
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginTop: 2,
                  }}>
                    Last minute reminder before it starts
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* Save Button */}
            <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
              <Pressable
                onPress={handleConfirmNotifications}
                disabled={selectedNotificationTimes.length === 0}
                style={{
                  backgroundColor: selectedNotificationTimes.length > 0 ? '#57BA47' : 'rgba(255, 255, 255, 0.2)',
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                }}
              >
                <Icon source="bell-check" size={20} color="#ffffff" />
                <Text style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: '#ffffff',
                }}>
                  {selectedNotificationTimes.length === 0 
                    ? 'Select reminder times' 
                    : `Save ${selectedNotificationTimes.length} reminder${selectedNotificationTimes.length > 1 ? 's' : ''}`}
                </Text>
              </Pressable>
            </View>

          </Animated.View>
        </Portal>
      )}
    </>
  );
}


