import { View, Text, TouchableOpacity, Image, Pressable, FlatList } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { supabase } from '@/src/lib/supabase'
import { Link, router, Stack } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import Toast from 'react-native-toast-message'

const SpeakersScreen = () => {
    const [ speakers, setSpeakers ] = useState<any[]>([])
    const tabHeight = useBottomTabBarHeight() + 30
    const getSpeakers = async () => {
        const { data, error } = await supabase.from('speaker_data').select('*')
        if( data ){
        setSpeakers(data)
        }
    }

   useEffect(() => {
      getSpeakers()
      const listenforspeakers = supabase
      .channel('listen for speakers change')
      .on(
        'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: "speaker_data",
      },
      async (payload) => await getSpeakers()
      )
      .subscribe()
  
      return () => { supabase.removeChannel( listenforspeakers )}
    }, [])
  return (
     <View className='flex-1 grow bg-white' style={{ paddingBottom : tabHeight }}>
          <Stack.Screen 
            options={{
              headerTransparent : true,
              header : () => (
                <View className="relative">
                  <View className="h-[110px] w-[100%] rounded-br-[65px] bg-[#5E636B] items-start justify-end pb-[5%] z-[1]">
                    <Pressable className="flex flex-row items-center justify-between w-[65%]" onPress={() => router.back()}>
                      <Svg width="29" height="29" viewBox="0 0 29 29" fill="none">
                        <Path d="M18.125 7.25L10.875 14.5L18.125 21.75" stroke="#1B85FF" stroke-width="2"/>
                      </Svg>
                      <Text className=" text-[25px] text-white">Speakers & Sheiks</Text>
                    </Pressable>
                  </View>
                  <View className="h-[120px] w-[100%] rounded-br-[65px] bg-[#BBBEC6] items-start justify-end pb-[5%] absolute top-[50]">
                   <View className="w-[75%] items-center"> 
                    <Text className=" text-[15px] text-black ">Edit Speaker & Sheik Info</Text>
                  </View>
                  </View>
                </View>
              )
            }}
          />
          
          <View className='flex-1 grow pt-[170px]'>
            <Text className='ml-4 font-bold text-lg my-6'>Select a Speaker or Sheik</Text>
            <FlatList 
            style={{flex : 1 }}
            data={speakers}
            renderItem={({item}) =>{
              return (
              <View style={{marginHorizontal: 2,  marginVertical : 6}}>
              <Link  
              href={{
                pathname: '/(user)/more/Admin/EditSpeakerInfo', 
                params : { speaker_id : item.speaker_id, speaker_name : item.speaker_name, speaker_img : item.speaker_img, speaker_creds : item.speaker_creds}
              }}
    
                  asChild >
                  <TouchableOpacity>
                  <View className='mt-1 self-center justify-center bg-[#F6F6F6] flex-row h-[100px]' style={{ borderRadius: 20, width: '95%'}}>
                        <View className='justify-center w-[30%]'>
                          <Image source={{ uri : item.speaker_img }} style={{ borderRadius : 8, width : '100%', height : 100}}/>
                        </View>
                        <View className='w-[70%] pl-2 bg-[#F6F6F6] rounded-r-[15px] h-[100px]'>
                            <Text className='text-[14px] font-[400] text-black pt-1' numberOfLines={1} >{item.speaker_name}</Text>
                            <Text className='text-sm text-[#A2A2A2] font-[400] pt-1' numberOfLines={3}>{item.speaker_creds && item.speaker_creds.length > 0 ? item.speaker_creds.join(',') : 'No Credentials Added...'}</Text>
                        </View>
                    </View>
                  </TouchableOpacity>
              </Link>
          </View>
            )}}
            />
          </View>
    
        </View>
  )
}

export default SpeakersScreen