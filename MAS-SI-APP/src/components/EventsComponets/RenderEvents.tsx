import { View, Text, TouchableOpacity, Image, Button, StyleSheet } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { EventsType } from '@/src/types'
import { Link } from "expo-router"
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
  return (
    <View style={{ width: "50%"}}>
    <Link  href={ `/menu/program/events/${event.event_id}`}
        asChild >
        <TouchableOpacity className='items-center'>
            <View style={{flexDirection: "column",alignItems: "center", justifyContent: "center"}}>
                <View style={{justifyContent: "center", alignItems: "center", backgroundColor: "white", borderRadius: 15}}>
                    <Image 
                        source={{ uri: event.event_img || require('@/assets/images/MASHomeLogo.png') }}
                        style={{width: 150, height: 150, objectFit: "cover", borderRadius: 15}}                                    
                    />
                </View>
                <View>
                    <View className='mt-2 items-center justify-center bg-white'>
                        <Text style={{textAlign: "center"}} className='text-md' numberOfLines={1}>{event.event_name}</Text>
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