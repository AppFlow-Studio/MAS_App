import { View, Text, ScrollView, FlatList, Image, Pressable, RefreshControl } from 'react-native'
import React, { useEffect, useState } from 'react'
import { supabase } from '@/src/lib/supabase'
import { EventsType, Program } from '@/src/types'
import { Link, Stack } from 'expo-router'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { AccordionItem } from './_Accordion'
import { useSharedValue } from 'react-native-reanimated'
import { Button, Divider } from 'react-native-paper'
import Days from './_Days'
const UpcomingEvents = () => {
  const TabBarHeight = useBottomTabBarHeight()
  const [ upcoming, setUpcoming ] = useState<Program[]>([])
  const [ upcomingEvents, setUpcomingEvents ] = useState<EventsType[]>([])
  const [refreshing, setRefreshing] = React.useState(false);
  const TodaysDate = new Date().getDay()
  const GetUpcomingEvents = async () => {
    setRefreshing(true)
    const date = new Date()
    const isoString = date.toISOString(); // "2024-04-27T14:20:30.000Z"
    const { data : programs , error } = await supabase.from('programs').select('*').gte('program_end_date', isoString)
    const { data : events , error : eventsError } = await supabase.from('events').select('*').gte('event_end_date', isoString)
    if( programs ){
        setUpcoming(programs)
    } 
    if( events ){
        setUpcomingEvents(events)
    }
    setRefreshing(false)
  }
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  useEffect(() => {
    GetUpcomingEvents()
  }, [])
  return (
    <View className=' bg-[#0D509D] flex-1'>
      <ScrollView contentContainerStyle={{ paddingBottom : TabBarHeight + 30, gap : 20, marginTop : 15 }} 
      className="bg-white h-full flex-1 w-full"
      style={{borderTopLeftRadius: 40, borderTopRightRadius: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={ async () => { await GetUpcomingEvents() } }/>}
      >
          <Stack.Screen options={{ 
              headerStyle : { backgroundColor : 'white' },
              headerTintColor : 'black'
          }}/>
          {
            days.map(( item, index ) => {
              const program = upcoming.filter(programs => programs.program_days.includes(item))
              const DaysKidsPrograms = program.filter(programs => programs.is_kids == true)
              const event = upcomingEvents.filter(events => events.event_days.includes(item) && events.pace == false)
              const pace = upcomingEvents.filter(events => events.event_days.includes(item) && events.pace == true)
              return(
                <>
                  <Days Programs={program} Day={item} Kids={DaysKidsPrograms} Events={event} Pace={pace} TodaysDate={TodaysDate} index={index}/>
                  <Divider className='h-[0.5px] w-[70%] self-center'/>
                </>
              )
            })
          }
        
      </ScrollView>
   </View>
  )
}

export default UpcomingEvents