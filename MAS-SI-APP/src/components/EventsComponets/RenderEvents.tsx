import { View, Text, TouchableOpacity, Image, Button, StyleSheet } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { EventsType } from '@/src/types'
import { Link } from "expo-router"
import { defaultProgramImage } from '../ProgramsListProgram'
import { Swipeable } from 'react-native-gesture-handler'
import { useAuth } from '@/src/providers/AuthProvider'
import { supabase } from '@/src/lib/supabase'
type RenderEventsProp = {
    event : EventsType
}
const RenderEvents = ( {event} : RenderEventsProp ) => {
  const { session } = useAuth()
  const [ isSwiped, setIsSwiped ] = useState(false) 
  const [ speakerString, setSpeakerString ] = useState()
  
  const swipeableRef = useRef<Swipeable>(null)
  const [ index, setIndex ] = useState(0)
  const addToNotifications = async () => {
    const { error } = await supabase.from("added_notifications").insert({user_id : session?.user.id, event_id: event.event_id})
    if( error ){
      throw error
    }
  }
  const closeSwipeable = () => {
    if (swipeableRef.current) {
      swipeableRef.current.close();
    }
  };

  const getSpeakers = async () => {
    const speakers : any[] = []
    let speaker_string : string[] = event.event_speaker.map(() => {return ''})
    await Promise.all(
      event.event_speaker.map( async ( speaker_id : string, index : number) => {
        const {data : speakerInfo, error : speakerInfoError } = await supabase.from('speaker_data').select('*').eq('speaker_id', speaker_id).single()
        if ( speakerInfo ){
          if (index == event.event_speaker.length - 1 ){
            speaker_string[index]=speakerInfo.speaker_name
          }
          else {
            speaker_string[index]= speakerInfo.speaker_name + ' & '
          }
        }
      })
    )
    setSpeakerString(speaker_string.join(''))
    console.log('speakers', speaker_string)
  }

  useEffect(() =>{
    getSpeakers()
  },[])
  return (
    <View className='h-[120] w-[100%]' style={{marginHorizontal: 10}}>
        <Link  href={`/menu/program/events/${event.event_id}`} asChild>
            <TouchableOpacity>
                <View className='flex-row item-center justify-center'>
                    <View style={{justifyContent: "center", alignItems: "center", backgroundColor: "white", borderRadius: 15}} className=''>
                                <Image 
                                    source={{ uri: event.event_img || defaultProgramImage }}
                                    style={{width: 130, height: 100, objectFit: "fill", borderRadius: 8}}
                                    
                                />
                    </View>
                    <View>
                      <View className='mt-2 items-center justify-center bg-white' style={{height: "80%", borderRadius: 20, marginLeft: "10%", width: 200}}>
                          <Text style={{textAlign: "center", fontWeight: "bold"}}>{event.event_name}</Text>
                          <Text style={{textAlign: "center"}}>By: {speakerString}</Text>
                      </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Link>
    </View>
  )
}


const styles = StyleSheet.create({
    dot: {
      width: 4,
      height: 4,
      borderRadius: 5,
      backgroundColor: '#bbb',
      margin: 5,
    },
    activeDot: {
      backgroundColor: '#000',
    },
  });

export default RenderEvents