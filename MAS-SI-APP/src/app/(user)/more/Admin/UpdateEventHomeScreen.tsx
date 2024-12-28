import { FlatList, StyleSheet, Text, TouchableOpacity, View, Image, Pressable, ScrollView, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Link, router, Stack, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import { differenceInDays, format, toDate } from 'date-fns'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import Svg, { Circle, Path } from 'react-native-svg'

const UpdateEventHomeScreen = () => {
  const { event_id, event_img, has_lecture, event_name } = useLocalSearchParams()
  const [ lectures, setLectures ] = useState<any[]>()
  const tabBar = useBottomTabBarHeight()
  const getLectures = async () => {
    if( has_lecture ){
      const { data, error } = await supabase.from('events_lectures').select('*').eq('event_id', event_id).order('event_lecture_date', {ascending : false})
      if( data ){
        setLectures( data )
      }
    }
  }

  useEffect(() => {
    getLectures()
    const listenforlectures = supabase
    .channel('listen for lecture change')
    .on(
      'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: "events_lectures",
      filter: `event_id=eq.${event_id}`
    },
    async (payload) => await getLectures()
    )
    .subscribe()

    return () => { supabase.removeChannel( listenforlectures )}
  }, [])
  return (
    <View className='flex-1 grow bg-white pt-[220px] w-[100%]' style={{ paddingBottom : tabBar + 30 }}>
      <Stack.Screen 
        options={{
        headerTransparent : true,
        header : () => (
          <View className="relative">
            <View className="h-[110px] w-[100%] rounded-br-[65px] bg-[#5E636B] items-start justify-end pb-[5%] z-[1]">
              <Pressable className="flex flex-row items-center justify-between w-[31%]" onPress={() => router.dismiss(2) }>
                <Svg width="29" height="29" viewBox="0 0 29 29" fill="none">
                  <Path d="M18.125 7.25L10.875 14.5L18.125 21.75" stroke="#1B85FF" stroke-width="2"/>
                </Svg>
                <Text className=" text-[25px] text-white">Events</Text>
              </Pressable>
            </View>

            <View className="h-[120px] w-[100%] rounded-br-[65px] bg-[#BBBEC6] items-start justify-end pb-[5%] absolute top-[50]">
              <View className="w-[60%] items-center"> 
                <Text className=" text-[15px] text-black ">Edit Existing Events</Text>
              </View>
            </View>

            <View className="h-[120px] w-[100%] rounded-br-[65px] bg-[#E3E3E3] items-start justify-end pb-[5%] absolute top-[100] z-[-1]">
              <View className='w-[100%]'>
                <Pressable className="w-[100%] items-center flex flex-row px-2" onPress={() => router.back()}> 
                    <View className='w-[11%]'>
                      <Svg  width="16" height="9" viewBox="0 0 16 9" fill="none">
                        <Path d="M4.5 8.22607L1 4.61303M1 4.61303L4.5 0.999987M1 4.61303H15" stroke="#6077F5" stroke-linecap="round"/>
                      </Svg>
                    </View>
                    <View className='w-[80%] items-start '><Text className=" text-[15px] text-black " numberOfLines={1} >{event_name}</Text></View>
                </Pressable>
              </View>
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
            <View className='mx-3'>
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
              <View className='w-[100%] flex flex-row justify-between my-1'>    

                <Link href={{
                    pathname : '/more/Admin/UpdateEventLectures',
                    params : { lecture : item.event_lecture_id, event_name : event_name, event_img : event_img }
                  }} 
                  className='w-[55%] self-center' asChild>
                    <Pressable className='mr-[5] flex-row items-center ' >
                      <View className='w-[35] h-[25] items-center justify-center'>
                        <Text className='text-xl font-bold text-gray-400 ml-2' >{lectures.length - index}</Text>
                      </View>
                      <View className='flex-col justify-center' style={{width: '100%'}}>
                        <Text className='text-md font-bold ml-2 text-black' style={{flexShrink: 1, }} numberOfLines={1}>{item.event_lecture_name}</Text>
                        <Text className='text-md  ml-2 text-gray-400'>{format(item.event_lecture_date, 'PP')}</Text>
                      </View>
                    </Pressable>
                 </Link>

                 <Pressable className='w-[25%] flex flex-col items-center justify-center gap-1 self-end' onPress={() => {
                    Alert.alert('Are you sure you want to delete this program?', `Press Delete to remove ${item.event_lecture_name}`, [
                        {
                            text: 'Cancel',
                            onPress: () => {},
                        },
                        {
                        text: 'Delete', 
                        onPress: async () => await supabase.from('events_lectures').delete().eq('event_lecture_id', item.event_lecture_id),
                        style: 'destructive',
                        },

                        ]
                    );
                    }} >
                        <Svg  width="34" height="34" viewBox="0 0 34 34" fill="none">
                            <Circle cx="17" cy="17" r="12.15" stroke="#7E869E" stroke-opacity="0.25" stroke-width="1.2"/>
                            <Path d="M22.6673 11.3335L11.334 22.6668" stroke="#FF0000" stroke-width="1.2" stroke-linecap="square" stroke-linejoin="round"/>
                            <Path d="M11.3327 11.3335L22.666 22.6668" stroke="#FF0000" stroke-width="1.2" stroke-linecap="square" stroke-linejoin="round"/>
                        </Svg>
                        <Text className='text-red-500 text-sm' numberOfLines={1}>Delete</Text>
                   </Pressable>
                </View>
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