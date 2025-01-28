import { View, Text, TouchableOpacity, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Program } from '../../types'
import { Link } from "expo-router"
import { useProgram } from '../../providers/programProvider'
import RenderMyLibraryProgramLectures from './RenderMyLibraryProgramLectures'
import { useAuth } from "@/src/providers/AuthProvider"
import { supabase } from '@/src/lib/supabase'
import { EventsType } from '../../types'
type RenderEventProp = {
    event_id: string
}
const RenderAddedEvents = ( {eventsInfo} : { eventsInfo : EventsType} ) => {
  return (
    <View style={{ justifyContent: "center", alignItems: "center", marginHorizontal: 8 }} className=''>
        <Link  href={`/myPrograms/notifications/${eventsInfo?.event_id}`}  asChild>
            <TouchableOpacity>
              <View style={{width: 170, height: 170}}>
                      <Image source={ eventsInfo?.event_img ? {uri: eventsInfo?.event_img } : require("@/assets/images/MASHomeLogo.png")} style={{width : "100%", height: "100%",borderRadius: 8}}/>
              </View>
              <View className='flex-col w-[170] h-[40] flex-shrink'>
                  <Text className='text-black font-bold'  numberOfLines={1}>{eventsInfo?.event_name}</Text>
              </View>
            </TouchableOpacity>
        </Link>
    </View>
  )
}

export default RenderAddedEvents