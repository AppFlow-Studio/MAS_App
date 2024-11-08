import { View, Text, ScrollView, FlatList, Image, Pressable } from 'react-native'
import React, { useEffect, useState } from 'react'
import { supabase } from '@/src/lib/supabase'
import { EventsType, Program } from '@/src/types'
import { Link, Stack } from 'expo-router'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
const Upcoming = () => {
  const TabBarHeight = useBottomTabBarHeight()
  const [ upcoming, setUpcoming ] = useState<Program[]>([])
  const [ upcomingEvents, setUpcomingEvents ] = useState<EventsType[]>([])
  const GetUpcomingEvents = async () => {
    const { data : programs , error } = await supabase.from('programs').select('*')
    const { data : events , error : eventsError } = await supabase.from('events').select('*')
    if( programs ){
        setUpcoming(programs)
    } 
    if( events ){
        setUpcomingEvents(events)
    }
  }
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  useEffect(() => {
    GetUpcomingEvents()
  }, [])
  return (
    <ScrollView contentContainerStyle={{ paddingBottom : TabBarHeight + 30 }} className="bg-white h-full flex-1">
        <Stack.Screen options={{ 
            headerStyle : { backgroundColor : 'white' },
            headerTintColor : 'black'
        }}/>
        {
            days.map(( item ) => {
                const programs : Program [] = upcoming?.filter(program => program.program_days.includes(item))
                return(
                    <View className='flex-col p-2'>
                        <View>
                            <Text className='font-bold text-xl'>{item}</Text>
                        </View>
                        <View>  
                           <FlatList 
                                data={programs}
                                renderItem={({item}) => (
                                    <Link href={`/menu/program/${item.program_id}`} asChild>
                                        <Pressable className='flex-col'>
                                            <Image source={{ uri : item.program_img || undefined }} style={{ width : 150, height : 150, borderRadius : 8, margin : 5 }}/>
                                            <Text className='text-gray-500 font-medium' numberOfLines={1}>{item.program_name}</Text>
                                        </Pressable>
                                    </Link>
                                )}
                                horizontal
                           />
                        </View>
                    </View>
                )
            })
        }
    </ScrollView>
  )
}

export default Upcoming