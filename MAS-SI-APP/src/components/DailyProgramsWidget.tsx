import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, Image, RefreshControl, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '@/src/lib/supabase';
import { Program, EventsType } from '@/src/types';
import { FlyerSkeleton } from './FlyerSkeleton';
import { Icon } from 'react-native-paper';
import { format, parse } from 'date-fns';

const DailyProgramsWidget = () => {
  const [todayPrograms, setTodayPrograms] = useState<Program[]>([]);
  const [todayEvents, setTodayEvents] = useState<EventsType[]>([]);
  const [todayKidsPrograms, setTodayKidsPrograms] = useState<Program[]>([]);
  const [todayPaceEvents, setTodayPaceEvents] = useState<EventsType[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Get current day of the week
  const getCurrentDay = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  const currentDay = getCurrentDay();

  // Helper function to convert 24-hour time to 12-hour format
  const formatTimeTo12Hour = (timeString: string) => {
    try {
      // Parse the time string (assuming format like "14:30" or "14:30:00")
      const time = parse(timeString, 'HH:mm', new Date());
      return format(time, 'h:mm a');
    } catch (error) {
      // If parsing fails, try with seconds
      try {
        const time = parse(timeString, 'HH:mm:ss', new Date());
        return format(time, 'h:mm a');
      } catch (secondError) {
        // If all parsing fails, return the original string
        return timeString;
      }
    }
  };

  const fetchTodaysPrograms = async () => {
    try {
      setRefreshing(true);
      setLoading(true);
      
      const date = new Date();
      const isoString = date.toISOString();
      
      // Fetch all upcoming programs and events
      const { data: programs, error: programsError } = await supabase
        .from('programs')
        .select('*')
        .gte('program_end_date', isoString);
      
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .gte('event_end_date', isoString);

      if (programsError) {
        console.error('Error fetching programs:', programsError);
        return;
      }

      if (eventsError) {
        console.error('Error fetching events:', eventsError);
        return;
      }

      // Filter for today's programs and events
      const todaysPrograms = programs?.filter(program => 
        program.program_days.includes(currentDay)
      ) || [];

      const todaysEvents = events?.filter(event => 
        event.event_days.includes(currentDay) && !event.pace
      ) || [];

      const todaysKidsPrograms = todaysPrograms.filter(program => program.is_kids);
      const regularPrograms = todaysPrograms.filter(program => !program.is_kids);
      const todaysPaceEvents = events?.filter(event => 
        event.event_days.includes(currentDay) && event.pace
      ) || [];

      setTodayPrograms(regularPrograms);
      setTodayEvents(todaysEvents);
      setTodayKidsPrograms(todaysKidsPrograms);
      setTodayPaceEvents(todaysPaceEvents);

    } catch (error) {
      console.error('Error fetching today\'s programs:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodaysPrograms();
  }, []);

  const ProgramItem = ({ item }: { item: Program }) => {
    const [imageReady, setImageReady] = useState(false);
    const [isNotified, setIsNotified] = useState(false);
    
    return (
      <Link href={`/menu/program/${item.program_id}`} asChild>
        <Pressable className="flex-col relative mr-3">
          {!imageReady && (
            <FlyerSkeleton 
              width={120} 
              height={120} 
              style={{ position: 'absolute', top: 0, zIndex: 2 }}
            />
          )}
          <Image 
            source={{ uri: item.program_img || undefined }} 
            style={{ width: 120, height: 120, borderRadius: 8 }}  
            onLoad={() => setImageReady(true)}
            onError={() => setImageReady(false)}
          />
            <Text 
              className="text-gray-600 font-medium text-[10px] w-[120px] text-center mt-1" 
              numberOfLines={2}
            >
              {item.program_name}
            </Text>
            {item.program_start_time && (
              <Text className="text-gray-500 text-[9px] text-center">
                {formatTimeTo12Hour(item.program_start_time)}
              </Text>
            )}
            <Pressable 
              className="items-center mt-4"
              onPress={() => setIsNotified(!isNotified)}
            >
              <Icon 
                source={isNotified ? "bell" : "bell-outline"} 
                size={16} 
                color={isNotified ? "#57BA47" : "#0D509D"} 
              />
            </Pressable>
        </Pressable>
      </Link>
    );
  };

  const EventItem = ({ item }: { item: EventsType }) => {
    const [imageReady, setImageReady] = useState(false);
    const [isNotified, setIsNotified] = useState(false);
    
    return (
      <Link href={`/menu/program/events/${item.event_id}`} asChild>
        <Pressable className="flex-col relative mr-3">
          {!imageReady && (
            <FlyerSkeleton 
              width={120} 
              height={120} 
              style={{ position: 'absolute', top: 0, zIndex: 2 }}
            />
          )}
          <Image 
            source={{ uri: item.event_img || undefined }} 
            style={{ width: 120, height: 120, borderRadius: 8 }}  
            onLoad={() => setImageReady(true)}
            onError={() => setImageReady(false)}
          />
          <Text 
            className="text-gray-600 font-medium text-[10px] w-[120px] text-center mt-1" 
            numberOfLines={2}
          >
            {item.event_name}
          </Text>
          {item.event_start_time && (
            <Text className="text-gray-500 text-[9px] text-center">
              {formatTimeTo12Hour(item.event_start_time)}
            </Text>
          )}
          <Pressable 
            className="items-center mt-4"
            onPress={() => setIsNotified(!isNotified)}
          >
            <Icon 
              source={isNotified ? "bell" : "bell-outline"} 
              size={16} 
              color={isNotified ? "#57BA47" : "#0D509D"} 
            />
          </Pressable>
        </Pressable>
      </Link>
    );
  };

  const hasAnyPrograms = todayPrograms.length > 0 || todayEvents.length > 0 || 
                        todayKidsPrograms.length > 0 || todayPaceEvents.length > 0;

  if (loading) {
    return (
      <View className="bg-white rounded-2xl p-4 mx-3 my-2 shadow-sm">
        <View className="flex-row items-center mb-3">
          <Icon source="calendar-today" size={20} color="#0D509D" />
          <Text className="text-[#0D509D] font-bold text-lg ml-2">Today's Programs</Text>
        </View>
        <Text className="text-gray-500">Loading...</Text>
      </View>
    );
  }

  if (!hasAnyPrograms) {
    return (
      <View className="bg-white rounded-2xl p-4 mx-3 my-2 shadow-sm">
        <View className="flex-row items-center mb-3">
          <Icon source="calendar-today" size={20} color="#0D509D" />
          <Text className="text-[#0D509D] font-bold text-lg ml-2">Today's Programs</Text>
        </View>
        <Text className="text-gray-500 text-center py-4">
          No programs scheduled for {currentDay}
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-2xl p-4 mx-3 my-2 shadow-sm">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Icon source="calendar-today" size={20} color="#0D509D" />
          <Text className="text-[#0D509D] font-bold text-lg ml-2">Today's Programs</Text>
        </View>
        <Pressable onPress={fetchTodaysPrograms}>
          <Icon source="refresh" size={18} color="#0D509D" />
        </Pressable>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchTodaysPrograms} />
        }
      >
        {/* Kids Programs */}
        {todayKidsPrograms.length > 0 && (
          <View className="mb-4">
            <Text className="text-gray-700 font-semibold text-sm mb-2">Kids Programs</Text>
            <FlatList
              data={todayKidsPrograms}
              renderItem={({ item }) => <ProgramItem item={item} />}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.program_id}
            />
          </View>
        )}

        {/* Regular Programs */}
        {todayPrograms.length > 0 && (
          <View className="mb-4">
            <Text className="text-gray-700 font-semibold text-sm mb-2">Programs</Text>
            <FlatList
              data={todayPrograms}
              renderItem={({ item }) => <ProgramItem item={item} />}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.program_id}
            />
          </View>
        )}

        {/* Events */}
        {todayEvents.length > 0 && (
          <View className="mb-4">
            <Text className="text-gray-700 font-semibold text-sm mb-2">Events</Text>
            <FlatList
              data={todayEvents}
              renderItem={({ item }) => <EventItem item={item} />}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.event_id}
            />
          </View>
        )}

        {/* PACE Events */}
        {todayPaceEvents.length > 0 && (
          <View className="mb-4">
            <Text className="text-gray-700 font-semibold text-sm mb-2">PACE</Text>
            <FlatList
              data={todayPaceEvents}
              renderItem={({ item }) => <EventItem item={item} />}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.event_id}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default DailyProgramsWidget;
