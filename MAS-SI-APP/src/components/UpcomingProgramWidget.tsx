import { View, Text, Pressable, ImageBackground, ScrollView, Animated, Image } from 'react-native';
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Program, EventsType } from '../types';
import moment from 'moment';
import { Link, useRouter } from 'expo-router';
import { Icon, Modal, Portal } from 'react-native-paper';
import { supabase } from '@/src/lib/supabase';
import { parse, isBefore } from 'date-fns';
import { useAuth } from '@/src/providers/AuthProvider';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

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
  const [programData, setProgramData] = useState<Program | null>(null);
  const [eventData, setEventData] = useState<EventsType | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Get current day of the week
  const getCurrentDay = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  const currentDay = getCurrentDay();
  const currentTime = liveTime.toLocaleTimeString("en-US", {hour12: true, hour: "numeric", minute:"numeric"});

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
          const fullProgram = safePrograms.find(p => p.program_id === nextItem.id);
          if (fullProgram) {
            setProgramData(fullProgram);
            setEventData(null);
          }
        } else {
          const fullEvent = safeEvents.find(e => e.event_id === nextItem.id);
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
      // Add to notifications
      const TodaysDate = new Date();
      const DaysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
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
          
          if (programDays && isBefore(TodaysDate, ProgramStartTime)) {
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
                    `${programData.program_name} is Starting Now!`,
                    'When Program Starts',
                    programData.program_name,
                    ProgramStartTime
                  );
                }
              })
            );
          }
          
          // Show toast
          const goToProgram = () => {
            router.push(`/myPrograms/notifications/ClassesAndLectures/${upcomingItem.id}`);
          };
          
          Toast.show({
            type: 'addProgramToNotificationsToast',
            props: { props: programData, onPress: goToProgram },
            position: 'top',
            topOffset: 50,
          });
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
          
          if (eventDays && isBefore(TodaysDate, EventStartTime)) {
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
                    `${eventData.event_name} is Starting Now!`,
                    'When Program Starts',
                    eventData.event_name,
                    EventStartTime
                  );
                }
              })
            );
          }
          
          // Show toast
          const goToEvent = () => {
            router.push(`/myPrograms/notifications/${upcomingItem.id}`);
          };
          
          Toast.show({
            type: 'addEventToNotificationsToast',
            props: { props: eventData, onPress: goToEvent },
            position: 'top',
            topOffset: 50,
          });
        }
      }
      
      setItemInNotifications(true);
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
    }
  }, [upcomingItem, session?.user.id]);

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

  const closeModal = useCallback(() => {
    setModalVisible(false);
    slideAnim.setValue(0);
  }, []);

  const openModal = useCallback(() => {
    setModalVisible(true);
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start();
  }, []);

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
          onPress={() => router.push(upcomingItem.link as any)}
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

      {/* Full Description Modal */}
      {upcomingItem && (
        <Portal>
          <Modal
            visible={modalVisible}
            onDismiss={closeModal}
            dismissable={true}
            contentContainerStyle={{
              backgroundColor: 'white',
              marginHorizontal: 24,
              marginVertical: 16,
              borderRadius: 20,
              padding: 0,
              maxHeight: '100%',
              borderWidth: 0,
            }}
            style={{ justifyContent: 'center' }}
          >
            <Animated.View
              style={{
                opacity: slideAnim,
                overflow: 'hidden',
                borderRadius: 20,
              }}
            >
                  {/* Program Image - Always show with fallback */}
                  <View style={{
                    width: '100%',
                    height: 300,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    overflow: 'hidden',
                  }}>
                    <Image
                      source={upcomingItem.image ? { uri: upcomingItem.image } : require("@/assets/images/MASHomeLogo.png")}
                      style={{
                        width: '100%',
                        height: '100%',
                      }}
                      resizeMode="cover"
                    />
                  </View>
                  
                  <ScrollView 
                    showsVerticalScrollIndicator={true}
                    style={{ maxHeight: 300 }}
                    contentContainerStyle={{ paddingBottom: 10, borderWidth: 0}}
                  >
                    <View className="px-5 pt-4" style={{ borderWidth: 0 }}>
                      {/* Header with Time */}
                      <View className="flex-row items-center mb-3">
                        <View className="flex-row items-center">
                          <Icon source="clock-outline" size={18} color="#0D509D" />
                          <Text className="text-[#0D509D] font-semibold text-base ml-2">
                            {formatTime12Hour(upcomingItem.time)}
                          </Text>
                        </View>
                      </View>

                    {/* Program Name */}
                    <Text className="text-[#0D509D] font-bold text-xl mb-4">
                      {upcomingItem.name}
                    </Text>

                    {/* Full Description */}
                    {upcomingItem.description ? (
                      <Text className="text-gray-800 text-sm leading-6">
                        {upcomingItem.description}
                      </Text>
                    ) : (
                      <Text className="text-gray-500 text-sm italic">
                        No description available.
                      </Text>
                    )}
                  </View>
                </ScrollView>
            </Animated.View>
          </Modal>
        </Portal>
      )}
    </>
  );
}

