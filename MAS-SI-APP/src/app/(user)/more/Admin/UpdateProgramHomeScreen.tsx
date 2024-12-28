import { FlatList, StyleSheet, Text, TouchableOpacity, View, Image, Pressable, ScrollView, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Link, router, Stack, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import { differenceInDays, format, toDate } from 'date-fns'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import Svg, { Circle, Path } from 'react-native-svg'
import { useNavigation } from 'expo-router'
const UpdateProgramHomeScreen = () => {
  const { program_id, program_img, has_lectures, program_name } = useLocalSearchParams()
  const [ lectures, setLectures ] = useState<any[]>()
  const tabBar = useBottomTabBarHeight()
  const navigation = useNavigation()
  const getLectures = async () => {
    if( has_lectures ){
      const { data, error } = await supabase.from('program_lectures').select('*').eq('lecture_program', program_id).order('lecture_date', {ascending : false})
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
      table: "program_lectures",
      filter: `lecture_program=eq.${program_id}`
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
              <Pressable className="flex flex-row items-center justify-between w-[40%]" onPress={() => { router.dismiss(2) }}>
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
              <View className='w-[100%]'>
                <Pressable className="w-[50%] items-center justify-between flex flex-row px-2" onPress={() => router.back()}> 
                    <View className='w-[23%] '>
                      <Svg  width="16" height="9" viewBox="0 0 16 9" fill="none">
                        <Path d="M4.5 8.22607L1 4.61303M1 4.61303L4.5 0.999987M1 4.61303H15" stroke="#6077F5" stroke-linecap="round"/>
                      </Svg>
                    </View>
                    <View className='w-[80%] items-start'>
                      <Text className=" text-[15px] text-black " numberOfLines={1} adjustsFontSizeToFit>{program_name}</Text>
                    </View>                
                    </Pressable>
              </View>
            </View>
          </View>
          )
        }}
      />
      <ScrollView style={{ }}

      >
        <Image 
          src={program_img}
          className='w-[200px] h-[200px] self-center rounded-[15px] my-4'
        />

      <Link href={{ 
        pathname : `/more/Admin/UpdateProgramScreen`,
        params : { program_id : program_id, program_name : program_name }
        }} asChild>
        <Pressable className='bg-[#57BA49] h-[35px] w-[55%] self-center items-center justify-center rounded-[15px] mb-4'>
          <Text className='text-white font-bold text-lg'>Edit Program Info</Text>
        </Pressable>
      </Link>
        {
          has_lectures == 'true' ? 
          (
            <View className='mx-3'>
              <Text className='text-[13px] font-bold text-black'>Edit Lecture Content</Text>
              <View className='flex flex-row items-center justify-between'>
                <Text className='text-black text-10 my-2'>Select The Lecture To Edit</Text>
                <Link href={{
                  pathname : '/more/Admin/UploadProgramLectures',
                  params : { program_id : program_id, program_name : program_name, program_img : program_img }
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
                    pathname : '/more/Admin/UpdateProgramLectures',
                    params : { lecture : item.lecture_id, program_name : program_name, program_img : program_img }
                  }} 
                  className='w-[55%] self-center' asChild>
                    <Pressable className='flex-row items-center ' >
                      <View className='w-[35] h-[25] items-center justify-center'>
                        <Text className='text-xl font-bold text-gray-400 ml-2' >{lectures.length - index}</Text>
                      </View>
                      <View className='flex-col justify-center' style={{width: '100%'}}>
                        <Text className='text-md font-bold ml-2 text-black' style={{flexShrink: 1, }} numberOfLines={1}>{item.lecture_name}</Text>
                        <Text className='text-md  ml-2 text-gray-400'>{format(item.lecture_date, 'PP')}</Text>
                        <Text className='text-blue-500 text-[12px] ml-2'>Edit...</Text>
                      </View>
                    </Pressable>
                  </Link>

                  <Pressable className='w-[25%] flex flex-col items-center justify-center gap-1 self-end' onPress={() => {
                    Alert.alert('Are you sure you want to delete this program?', `Press Delete to remove ${item.lecture_name}`, [
                        {
                            text: 'Cancel',
                            onPress: () => {},
                        },
                        {
                        text: 'Delete', 
                        onPress: async () => await supabase.from('program_lectures').delete().eq('lecture_id', item.lecture_id),
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

export default UpdateProgramHomeScreen