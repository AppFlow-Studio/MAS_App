import { FlatList, StyleSheet, Text, TouchableOpacity, View, Image, Pressable, ScrollView, useWindowDimensions, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Link, router, Stack } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import { differenceInDays, format, toDate } from 'date-fns'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import Svg, { Path, Circle } from 'react-native-svg'
import Animated, { useAnimatedStyle, useSharedValue, withTiming }  from 'react-native-reanimated'
import { EventsType, Program } from '@/src/types'

const DeleteEventScreen = () => {
  const tabBar = useBottomTabBarHeight()
  const [ events, setevents ] = useState<any[]>([])
  const TodaysDate = new Date()
  const width = useWindowDimensions().width
  const getevents = async () => {
    const { data : Userevents, error  } = await supabase.from('events').select('*')

    if( Userevents ){
      setevents(Userevents)
    }

  }
  useEffect(() => {
    getevents()

    const listenforevents = supabase
    .channel('listen for events change')
    .on(
     'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: "events",
    },
    async (payload) => await getevents()
    )
    .subscribe()

    return () => { supabase.removeChannel( listenforevents )}
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
              <Text className=" text-[15px] text-black ">Delete A Program</Text>
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
      data={events}
      renderItem={({item}) =>(
      <DeleteSlider item={item} TodaysDate={TodaysDate} width={width}/>
      )}
      />
    </View>

  </View>
  )
}

const DeleteSlider = ({item, TodaysDate, width } : { item : EventsType, TodaysDate : Date, width : number }) => {
  const SliderWidth = useSharedValue(0)
  const DeleteOpacity = useSharedValue(0)
  const [visible, setVisible] = React.useState(false);

  const showDialog = () => setVisible(true);

  const hideDialog = () => setVisible(false);

  const Slider = useAnimatedStyle(() => {
      return {
          width : width - SliderWidth.value
      }
  })
  const DeleteSliderWidth = useAnimatedStyle(() => {
      return {
          width : SliderWidth.value,
          opacity : DeleteOpacity.value
      }   
  })
  const onPress = () => {
      if( SliderWidth.value == 60 ){
          SliderWidth.value = withTiming(0, { duration : 500 })
          DeleteOpacity.value = withTiming(0, { duration : 500 })
      }else{
          SliderWidth.value = withTiming(60, { duration : 500 })
          DeleteOpacity.value = withTiming(1, { duration : 500 })
      }
  }
  return (
      <View className='w-[100%] items-center flex flex-row'>
          <Animated.View style={[{marginHorizontal: 2}, Slider]}>
              <TouchableOpacity className='w-[100%]' onPress={onPress}>
                  <View className='mt-1 self-center justify-center bg-white p-2 flex-row' style={{ borderRadius: 20, width: '95%'}}>
                      <View className='justify-center w-[30%]'>
                          <Image source={{ uri : item.event_img }} style={{ borderRadius : 8, width : '100%', height : 95}}/>
                      </View>
                      <View className='w-[70%] pl-2 bg-[#F6F6F6] h-[95] rounded-tr-[20px] rounded-br-[20px]'>
                          <Text className='text-lg text-black font-bold ' numberOfLines={1}>{item.event_name}</Text>
                          <Text className='  text-sm text-[#A2A2A2]' numberOfLines={1}>Start Date: {format(item.event_start_date, 'P')}</Text>
                          <Text className='  text-sm text-[#A2A2A2]' numberOfLines={1}>Scheduled End Date: {format(item.event_end_date, 'P')} </Text>
                          { differenceInDays(item.event_end_date, TodaysDate) > 0 ? <Text className='text-gray-700'><Text className='text-green-500' >{differenceInDays(item.event_end_date, TodaysDate)} Days Left</Text> until Program ends</Text> : <Text className='text-red-500'>Program Has Ended</Text>}
                      </View>
                  </View>
              </TouchableOpacity>
          </Animated.View>
          <Animated.View style={[DeleteSliderWidth]} className='h-[95px] bg-white items-center justify-center' >
              <Pressable className='w-[100%] flex flex-col items-center justify-center gap-1' onPress={() => {
              Alert.alert('Are you sure you want to delete this event?', `Press Delete to remove ${item.event_name}`, [
                  {
                      text: 'Cancel',
                      onPress: () => {},
                  },
                  {
                  text: 'Delete', 
                  onPress: async () => await supabase.from('events').delete().eq('event_id', item.event_id),
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
          </Animated.View>
      </View>
  )
}

export default DeleteEventScreen