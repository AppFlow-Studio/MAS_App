import { FlatList, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Link } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import { toDate } from 'date-fns'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'

const EventsScreen = () => {
  const tabBar = useBottomTabBarHeight()
  const [ events, setevents ] = useState<any[]>([])
  
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
    <View className='flex-1' style={{ paddingBottom : tabBar + 30 }}>
      <Text className="font-bold text-2xl p-3 ">Events</Text>
      <Link  href={'/(user)/more/Admin/AddNewEventScreen'} asChild >
          <TouchableOpacity className="bg-[#57BA47] w-[35%] px-3 py-2 ml-3 mb-2 rounded-md items-center">
            <Text className="font-bold text-sm text-white">Add New Event</Text>
          </TouchableOpacity>
      </Link>
      <View className='flex-1 grow'>
        <FlatList 
        style={{ flex : 1 }}
        data={events}
        renderItem={({item}) =>(
          <View style={{marginHorizontal: 2}}>
          <Link  href={{pathname: '/(user)/more/Admin/EventsNotificationScreen', params: {event_id: item.event_id, has_lecture : item.has_lecture}}}

              asChild >
              <TouchableOpacity>
                <View className='mt-1 self-center justify-center bg-white p-2 flex-row' style={{ borderRadius: 20, width: '95%'}}>
                  
                  <View className='justify-center w-[30%]'>
                    <Image source={{ uri : item.event_img }} style={{ borderRadius : 8, width : '100%', height : 95}}/>
                  </View>
                  <View className='w-[70%] pl-2'>
                    <Text className='text-lg text-black font-bold ' numberOfLines={1}>{item.event_name}</Text>
                    <Text className='my-2  text-sm text-black font-bold' numberOfLines={1}>{item.event_desc}</Text>
                    <Text className='my-2  text-sm text-black' numberOfLines={1}>Start Date: {}</Text>
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

