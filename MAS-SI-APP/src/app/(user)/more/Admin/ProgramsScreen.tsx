import { FlatList, StyleSheet, Text, TouchableOpacity, View, Image, Pressable } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Link, router, Stack } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import { differenceInDays, format, toDate } from 'date-fns'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import Svg, { Path } from 'react-native-svg'
const ProgramsScreen = () => {
  const tabBar = useBottomTabBarHeight()
  const [ programs, setPrograms ] = useState<any[]>([])
  const [ speakers, setSpeakers ] = useState<any[] | null>([])
  const TodaysDate = new Date()
  const getPrograms = async () => {
    const { data : UserPrograms, error  } = await supabase.from('programs').select('*')
    const { data : SpeakerInfo, error : SpeakerError } = await supabase.from('speaker_data').select('*')
    if( UserPrograms ){
    setPrograms(UserPrograms)
    setSpeakers(SpeakerInfo)
    }

  }
  useEffect(() => {
    getPrograms()
  }, [])

  return (
    <View className='flex-1 grow bg-white' style={{ paddingBottom : tabBar + 30 }}>
      <Stack.Screen 
        options={{
          headerTransparent : true,
          header : () => (
            <View className="relative">
              <View className="h-[110px] w-[100%] rounded-br-[65px] bg-[#5E636B] items-start justify-end pb-[5%] z-[1]">
                <Pressable className="flex flex-row items-center justify-between w-[40%]" onPress={() => router.back()}>
                  <Svg width="29" height="29" viewBox="0 0 29 29" fill="none">
                    <Path d="M18.125 7.25L10.875 14.5L18.125 21.75" stroke="#1B85FF" stroke-width="2"/>
                  </Svg>
                  <Text className=" text-[25px] text-white">Programs</Text>
                </Pressable>
              </View>
              <View className="h-[120px] w-[100%] rounded-br-[65px] bg-[#BBBEC6] items-start justify-end pb-[5%] absolute top-[50]">
               <View className="w-[65%] items-center"> 
                <Text className=" text-[15px] text-black ">Edit Existing Programs</Text>
              </View>
              </View>
            </View>
          )
        }}
      />
      
      <View className='flex-1 grow pt-[170px]'>
        <Text className='ml-4 font-bold text-lg my-6'>Select a Program</Text>
        <FlatList 
        style={{flex : 1 }}
        data={programs}
        renderItem={({item}) =>{
          const ProgramLeaders = item.program_speaker.map((id) => {
            const person = speakers?.filter( person => person.speaker_id == id)[0]
            return person?.speaker_name
          }) 
          return (
          <View style={{marginHorizontal: 2,  marginVertical : 6}}>
          <Link  href={{pathname: '/(user)/more/Admin/UpdateProgramHomeScreen', params: {program_id: item.program_id, has_lectures : item.has_lectures, program_img : item.program_img, program_name : item.program_name }}}

              asChild >
              <TouchableOpacity>
              <View className='mt-1 self-center justify-center bg-[#F6F6F6] flex-row ' style={{ borderRadius: 20, width: '95%'}}>
                    
                    <View className='justify-center w-[30%]'>
                      <Image source={{ uri : item.program_img }} style={{ borderRadius : 8, width : '100%', height : 100}}/>
                    </View>

                    <View className='w-[70%] pl-2 bg-[#F6F6F6] rounded-r-[15px] h-[100px] py-1'>
                    <Text className='text-[14px] font-[400] text-black' numberOfLines={1}>{item.program_name}</Text>
                    <Text className='text-sm text-[#A2A2A2] font-[400]' numberOfLines={1}>By: { ProgramLeaders.join(',')}</Text>
                    <Text className='mt-[18px]  text-sm text-black' numberOfLines={1}>Start Date: {format(item.program_start_date, 'P')}</Text>
                    { differenceInDays(item.program_end_date, TodaysDate) > 0 ? <Text className='text-gray-700'><Text className='text-green-500'>{differenceInDays(item.program_end_date, TodaysDate)} Days</Text> until Event ends</Text> : <Text className='text-red-600'>Event Has Ended</Text>}
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

export default ProgramsScreen

