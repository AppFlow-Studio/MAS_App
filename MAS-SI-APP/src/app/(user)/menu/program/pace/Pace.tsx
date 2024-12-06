import { View, Text, FlatList, Image, TouchableOpacity, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Divider } from 'react-native-paper'
import RenderEvents from '@/src/components/EventsComponets/RenderEvents'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import PaceFlyers from '@/src/components/PaceComponents/PaceFlyers'
import { supabase } from '@/src/lib/supabase'
import { EventsType } from '@/src/types'
import { Link } from 'expo-router'

const Pace = () => {
  const [ pace, setPace ] = useState<EventsType[]>([])
  const [ prevPace , setPrevPace ] = useState<EventsType[]>() 
  const getPace = async () => {
    const date = new  Date()
    const isoString = date.toISOString()
    const { data : CurrentPace , error } = await supabase.from('events').select('*').eq('pace', true).gte('event_end_date', isoString)
    const { data : PrevPace, error : prevError}  = await supabase.from('events').select('*').eq('pace', true).eq('has_lecture', true).lte('event_end_date', isoString)
    if( CurrentPace ){
      setPace(CurrentPace)
    }
    if( PrevPace ){
      setPrevPace(PrevPace)
    }
    if( error ){
      console.log(error)
    }
  }
  const tabBarHeight = useBottomTabBarHeight() + 35
  useEffect(() => {
    getPace()
  }, [])
  return (
    <View className='bg-[#0D509D] flex-1 '>
      <ScrollView style={{borderTopLeftRadius: 40, borderTopRightRadius: 40, height : '100%', backgroundColor : 'white'}} contentContainerStyle={{
      paddingTop : 2, backgroundColor : 'white',  paddingBottom : tabBarHeight + 30}}>      
         <View className='mt-5 w-[100%]'>
          <Text className='font-bold text-black text-lg ml-3 mb-8'>Current Pace Events</Text>
          <View className='flex-row flex flex-wrap gap-y-5'>
            {
              pace?.map((item) => (
                <View style={{ width: "50%"}}>
                  <Link  href={ `/menu/program/events/${item.event_id}`}
                      asChild >
                      <TouchableOpacity className='items-center'>
                          <View style={{flexDirection: "column",alignItems: "center", justifyContent: "center"}}>
                              <View style={{justifyContent: "center", alignItems: "center", backgroundColor: "white", borderRadius: 15}}>
                                  <Image 
                                      source={{ uri: item.event_img || require('@/assets/images/MASHomeLogo.png') }}
                                      style={{width: 150, height: 150, objectFit: "cover", borderRadius: 15}}                                    
                                  />
                              </View>
                              <View>
                                  <View className='mt-2 items-center justify-center bg-white w-[80%] self-center'>
                                      <Text style={{textAlign: "center"}} className='text-md text-center' numberOfLines={1} >{item.event_name}</Text>
                                  </View>
                              </View>
                          </View>
                      </TouchableOpacity>
                  </Link>
              </View>
              ))
            }
          </View>

          <Text className='font-bold text-black text-lg ml-3 mb-8'>Previous Recorded Pace Events</Text>
          <View className='flex-row flex flex-wrap gap-y-5'>
            {
              prevPace?.map((item) => (
                <View style={{ width: "50%"}}>
                  <Link  href={ `/menu/program/events/${item.event_id}`}
                      asChild >
                      <TouchableOpacity className='items-center'>
                          <View style={{flexDirection: "column",alignItems: "center", justifyContent: "center"}}>
                              <View style={{justifyContent: "center", alignItems: "center", backgroundColor: "white", borderRadius: 15}}>
                                  <Image 
                                      source={{ uri: item.event_img || require('@/assets/images/MASHomeLogo.png') }}
                                      style={{width: 150, height: 150, objectFit: "cover", borderRadius: 15}}                                    
                                  />
                              </View>
                              <View>
                                  <View className='mt-2 items-center justify-center bg-white w-[80%] self-center'>
                                      <Text style={{textAlign: "center"}} className='text-md text-center' numberOfLines={1} >{item.event_name}</Text>
                                  </View>
                              </View>
                          </View>
                      </TouchableOpacity>
                  </Link>
              </View>
              ))
            }
          </View>

          </View>
          </ScrollView>
          </View>
          
  )
}

export default Pace