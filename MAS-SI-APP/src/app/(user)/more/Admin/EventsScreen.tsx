import { FlatList, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Link } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import { toDate } from 'date-fns'

const EventsScreen = () => {
  const [ events, setevents ] = useState<any[]>([])
  
  const getevents = async () => {
    const { data : Userevents, error  } = await supabase.from('added_notifications_events').select('event_id')

    if( Userevents.length > 0 && Userevents ){
    const filteredUserevents = Userevents?.filter((obj1, i, arr) => 
      arr.findIndex(obj2 => (obj2.event_id === obj1.event_id)) === i)
    const Allevents : any[] = []
    await Promise.all(filteredUserevents?.map( async (id) => {
      const { data : program, error } = await supabase.from('events').select('*').eq('event_id', id.event_id).single()
        if( program ){
          Allevents.push(program)
        }
      })
    )
    setevents(Allevents)


    }

  }
  useEffect(() => {
    getevents()
  }, [])

  return (
    <View className='flex-1'>
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
          <Link  href={{pathname: '/(user)/more/Admin/EventsNotificationScreen', params: {event_id: item.event_id}}}

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

