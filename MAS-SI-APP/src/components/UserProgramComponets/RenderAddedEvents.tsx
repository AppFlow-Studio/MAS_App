import { View, Text, TouchableOpacity, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Program } from '../../types'
import { Link } from "expo-router"
import { useProgram } from '../../providers/programProvider'
import { defaultProgramImage } from '../ProgramsListProgram'
import RenderMyLibraryProgramLectures from './RenderMyLibraryProgramLectures'
import { useAuth } from "@/src/providers/AuthProvider"
import { supabase } from '@/src/lib/supabase'
import { EventsType } from '../../types'
type RenderEventProp = {
    event_id: string
}
const RenderAddedEvents = ( {event_id} : RenderEventProp ) => {
  const { session } = useAuth()
  const [ event, setEvent] = useState<EventsType>()
  async function fetchUserProgram(){
    const { data, error } = await supabase.from("events").select("*").eq("event_id ",  event_id).single()
    if(error){
      console.log(error)
    }
    if(data){
    setEvent(data)
    }
  }

  useEffect(() => {
    fetchUserProgram()
  }, [])


  return (
    <View style={{ justifyContent: "center", alignItems: "center", marginHorizontal: 8 }} className=''>
        <Link  href={`/myPrograms/notifications/${event?.event_id}`}  asChild>
            <TouchableOpacity>
              <View style={{width: 170, height: 170}}>
                      <Image source={{uri: event?.event_img || defaultProgramImage }} style={{width : "100%", height: "100%",borderRadius: 8}}/>
              </View>
              <View className='flex-col w-[170] h-[40] flex-shrink'>
                  <Text className='text-black font-bold'  numberOfLines={1}>{event?.event_name}</Text>
              </View>
            </TouchableOpacity>
        </Link>
    </View>
  )
}

export default RenderAddedEvents