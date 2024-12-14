import { FlatList, StyleSheet, Text, TouchableOpacity, View, Image, Pressable } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Link, router, Stack } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import { differenceInDays, format, toDate } from 'date-fns'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import Svg, { Path } from 'react-native-svg'

const EventsScreen = () => {
  const tabBar = useBottomTabBarHeight()
  const [ events, setevents ] = useState<any[]>([])
  const TodaysDate = new Date()

  const getevents = async () => {
    const { data : Userevents, error  } = await supabase.from('events').select('*')

    if( Userevents ){
      setevents(Userevents)
    }

  }
  useEffect(() => {
    getevents()
  }, [])

  return (
    <View className='flex-1 bg-white grow' style={{ paddingBottom : tabBar + 30 }}>
      <Stack.Screen 
        options={{
          headerTransparent : true,
          header : () => (
            <View className="relative">
              <View className="h-[110px] w-[100%] rounded-br-[65px] bg-[#5E636B] items-start justify-end pb-[5%] z-[1]">
                <Pressable className="flex flex-row items-center justify-between w-[40%]" onPress={() => router.back()}>
                  <Svg width="29" height="29" viewBox="0 0 29 29" fill="none">
                    <Path d="M18.125 7.25L10.875 14.5L18.125 21.75" stroke="#1B85FF" stroke-width="2"/>
                  </Svg>
                  <Text className=" text-[25px] text-white">Events</Text>
                </Pressable>
              </View>
              <View className="h-[120px] w-[100%] rounded-br-[65px] bg-[#BBBEC6] items-start justify-end pb-[5%] absolute top-[50]">
               <View className="w-[65%] items-center"> 
                <Text className=" text-[15px] text-black ">Edit Existing Events</Text>
              </View>
              </View>
            </View>
          )
        }}
      />
      <View className='flex-1 pt-[170px]'>
        <FlatList 
        style={{ flex : 1 }}
        data={events}
        renderItem={({item}) =>(
          <View style={{marginHorizontal: 2}}>
          <Link  href={{pathname: '/(user)/more/Admin/UpdateEventHomeScreen', params: {event_id: item.event_id, has_lecture : item.has_lecture, event_img : item.event_img, event_name: item.event_name}}}

              asChild >
              <TouchableOpacity>
                <View className='mt-1 self-center justify-center bg-white p-2 flex-row' style={{ borderRadius: 20, width: '95%'}}>
                  
                  <View className='justify-center w-[30%]'>
                    <Image source={{ uri : item.event_img }} style={{ borderRadius : 8, width : '100%', height : 95}}/>
                  </View>
                  <View className='w-[70%] pl-2'>
                    <Text className='text-lg text-black font-bold ' numberOfLines={1}>{item.event_name}</Text>
                    <Text className='my-2  text-sm text-black font-bold' numberOfLines={1}>{item.event_desc}</Text>
                    <Text className='my-2  text-sm text-black' numberOfLines={1}>Start Date: {format(item.event_start_date, 'P')}</Text>
                    <Text className='my-2  text-sm text-black' numberOfLines={1}>Scheduled End Date: {format(item.event_end_date, 'P')}</Text>
                    { differenceInDays(item.event_end_date, TodaysDate) > 0 ? <Text className='text-gray-700'><Text className='text-black'>{differenceInDays(item.event_end_date, TodaysDate)} Days</Text> until Event ends</Text> : <Text className='text-red-600'>Event Has Ended</Text>}
                  </View>
                </View>
              </TouchableOpacity>
          </Link>
      </View>
        )}
        />
      </View>

    </View>
  )
}

export default EventsScreen

