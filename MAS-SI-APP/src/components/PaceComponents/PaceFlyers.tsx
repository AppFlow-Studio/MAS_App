import { Image, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { TouchableOpacity } from 'react-native'
import { Link } from 'expo-router'
import { EventsType } from '@/src/types'
type PaceFlyersProp = {
  pace : EventsType
}
const PaceFlyers = ({pace} : PaceFlyersProp) => {
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
                          <Text style={{textAlign: "center"}}>By: {pace.event_speaker}</Text>
                      </View>
                </View>
               </TouchableOpacity>
               </Link>
    </View>
  )
}

export default PaceFlyers

const styles = StyleSheet.create({})