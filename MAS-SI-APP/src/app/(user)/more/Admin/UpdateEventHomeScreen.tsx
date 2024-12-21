import { FlatList, StyleSheet, Text, TouchableOpacity, View, Image, Pressable, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Link, router, Stack, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import { differenceInDays, format, toDate } from 'date-fns'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import Svg, { Path } from 'react-native-svg'

const UpdateEventHomeScreen = () => {
  const { event_id, event_img, has_lecture, event_name } = useLocalSearchParams()
  const [ lectures, setLectures ] = useState<any[]>()
  const tabBar = useBottomTabBarHeight()
  const getLectures = async () => {
    if( has_lecture ){
      const { data, error } = await supabase.from('events_lectures').select('*').eq('event_id', event_id).order('created_at', {ascending : false})
      if( data ){
        setLectures( data )
      }
    }
  }

  useEffect(() => {
    getLectures()
  }, [])
  return (
    <View className='flex-1 grow bg-white pt-[220px] w-[100%]' style={{ paddingBottom : tabBar + 30 }}>
      <Stack.Screen 
        options={{
        headerTransparent : true,
        header : () => (
          <View className="relative">
            <View className="h-[110px] w-[100%] rounded-br-[65px] bg-[#5E636B] items-start justify-end pb-[5%] z-[1]">
              <Pressable className="flex flex-row items-center justify-between w-[40%]" onPress={() => router.replace('/more/Admin/AdminScreen')}>
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

            <View className="h-[120px] w-[100%] rounded-br-[65px] bg-[#E3E3E3] items-start justify-end pb-[5%] absolute top-[100] z-[-1]">
              <Pressable className="w-[50%] items-center justify-between flex flex-row px-6" onPress={() => router.back()}> 
                  <Svg  width="16" height="9" viewBox="0 0 16 9" fill="none">
                    <Path d="M4.5 8.22607L1 4.61303M1 4.61303L4.5 0.999987M1 4.61303H15" stroke="#6077F5" stroke-linecap="round"/>
                  </Svg>
                  <Text className=" text-[15px] text-black " numberOfLines={1} adjustsFontSizeToFit>{event_name}</Text>
              </Pressable>
            </View>
          </View>
          )
        }}
      />
      <ScrollView style={{ }}>
        <Image 
          src={event_img}
          className='w-[200px] h-[200px] self-center rounded-[15px] my-4'
        />

      <Link href={{ 
        pathname : `/more/Admin/UpdateEventScreen`,
        params : { event_id : event_id, event_name : event_name }
        }} asChild>
        <Pressable className='bg-[#57BA49] h-[35px] w-[55%] self-center items-center justify-center rounded-[15px] mb-4'>
          <Text className='text-white font-bold text-lg'>Edit Program Info</Text>
        </Pressable>
      </Link>
        {
          has_lecture == 'true' ? 
          (
            <View className='mx-8'>
              <Text className='text-[13px] font-bold text-black'>Edit Lecture Content</Text>
              <View className='flex flex-row items-center justify-between'>
                <Text className='text-black text-10 my-2'>Select The Lecture To Edit</Text>
                <Link href={{
                  pathname : '/more/Admin/UploadEventLectures',
                  params : { event_id : event_id, event_name : event_name, event_img : event_img }
                }}asChild>
                  <Pressable className=''>
                    <Text className='underline text-[#1B85FF]'>Add New Lecture</Text>
                  </Pressable>
                </Link>
              </View>        
             {
              lectures?.map((item, index) => (
                <Link href={{
                  pathname : '/more/Admin/UpdateEventLectures',
                  params : { lecture : item.event_lecture_id, event_name : event_name, event_img : event_img }
                }} asChild>
                  <Pressable className='mr-[5] flex-row items-center ' >
                    <View className='w-[35] h-[25] items-center justify-center'>
                      <Text className='text-xl font-bold text-gray-400 ml-2' >{index + 1}</Text>
                    </View>
                    <View className='flex-col justify-center' style={{width: '100%'}}>
                      <Text className='text-md font-bold ml-2 text-black' style={{flexShrink: 1, }} numberOfLines={1}>{item.event_lecture_name}</Text>
                      <Text className='text-md  ml-2 text-gray-400'>{item.event_lecture_date}</Text>
                    </View>
                  </Pressable>
                </Link>
              ))
             }
            </View>
          ) : 
          (
            <></>
          )
        }
      </ScrollView>
    </View>
  )
}

export default UpdateEventHomeScreen