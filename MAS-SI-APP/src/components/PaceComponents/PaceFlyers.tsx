import { Image, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { TouchableOpacity } from 'react-native'
import { Link } from 'expo-router'
import { EventsType } from '@/src/types'
import { supabase } from '@/src/lib/supabase'
type PaceFlyersProp = {
  pace : EventsType
}
const PaceFlyers = ({pace} : PaceFlyersProp) => {
  const [ speakerString, setSpeakerString ] = useState('')
  const getSpeakers = async () => {
    const speakers : any[] = []
    let speaker_string : string[] = pace.event_speaker.map(() => {return ''})
    await Promise.all(
      pace.event_speaker.map( async ( speaker_id : string, index : number) => {
        const {data : speakerInfo, error : speakerInfoError } = await supabase.from('speaker_data').select('*').eq('speaker_id', speaker_id).single()
        if ( speakerInfo ){
          if (index == pace.event_speaker.length - 1 ){
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
    <View>
      <Link  href={`/menu/program/pace/${pace.event_id}`} asChild>
        <TouchableOpacity>
            <View className='flex-row item-center justify-center'>
                    <Image source={{uri: pace.event_img}}     
                    style={{width: 130, height: 100, objectFit: "fill", borderRadius: 8}}
               />
                      <View className='mt-2 items-center justify-center bg-white' style={{ borderRadius: 20, marginLeft: "10%", width: 200}}>
                          <Text style={{textAlign: "center", fontWeight: "bold"}}>{pace.event_name}</Text>
                          <Text style={{textAlign: "center"}}>By: {speakerString}</Text>
                      </View>
                </View>
               </TouchableOpacity>
               </Link>
    </View>
  )
}

export default PaceFlyers

const styles = StyleSheet.create({})