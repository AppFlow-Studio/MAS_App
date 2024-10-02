import { View, Text, Dimensions, ScrollView, StatusBar, useWindowDimensions } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Program } from '@/src/types'
import { useAuth } from '@/src/providers/AuthProvider'
import { supabase } from '@/src/lib/supabase'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import Animated, { interpolate, useAnimatedRef, useAnimatedStyle, useScrollViewOffset } from 'react-native-reanimated'
import { defaultProgramImage } from '@/src/components/ProgramsListProgram'
import { Icon } from 'react-native-paper'
import NotificationCard from "@/src/app/(user)/myPrograms/notifications/NotificationCard"
const ClassesAndLecturesSettings = () => {
  const { program_id } = useLocalSearchParams()
  const { session } = useAuth()
  const [ program, setProgram ] = useState<Program>() 
  const [ scrollY, setScrollY ] = useState(0)
  const layout = useWindowDimensions().width
  const layoutHeight = useWindowDimensions().height
  const [ selectedNotification, setSelectedNotification ] = useState<number[]>([])
  const NOTICARDHEIGHT  = layoutHeight / 12
  const NOTICARDWIDTH  = layout * 0.8
  const getProgram = async( ) => {
    const { data, error } = await supabase.from('programs').select("*").eq("program_id", program_id ).single()
    if( data ){
      setProgram(data)
    }
  }

  const tabBarHeight = useBottomTabBarHeight() + 30
  const { width } = Dimensions.get("window")
  const scrollRef = useAnimatedRef<Animated.ScrollView>()
  const scrollOffset = useScrollViewOffset(scrollRef)
  const imageAnimatedStyle = useAnimatedStyle(() => {
    return{
      transform: [
        {
          translateY : interpolate(
          scrollOffset.value,
          [-250, 0, 250 ],
          [-250/2, 0, 250 * 0.75]
          )
        },
        {
          scale: interpolate(scrollOffset.value, [-250, 0, 250], [2, 1, 1])
        }
      ]
    }
  })

  useEffect(() => {
    getProgram()
  },[])
  const array = [1, 2, 3]
  return (
    <View className='flex-1 bg-white' style={{flexGrow: 1}}>
     <StatusBar barStyle={"dark-content"}/>
     <Stack.Screen options={{ title : '', headerBackTitleVisible : false, headerStyle : {backgroundColor : "white"}}}/>
      <Animated.ScrollView ref={scrollRef}  scrollEventThrottle={16} contentContainerStyle={{justifyContent: "center", alignItems: "center", marginTop: "2%", paddingBottom : tabBarHeight }}  >
          <View>
            <Animated.Image 
              source={ { uri: program?.program_img || defaultProgramImage }}
              style={ [{width: width / 1.2, height: 300, borderRadius: 8 }, imageAnimatedStyle] }
              resizeMode='stretch'
            />
          </View>
          <View className='flex-col bg-white w-[100%]'>
            <Text className='font-bold text-2xl text-center'>{program?.program_name}</Text>
            <Text className='font-bold text-gray-400 text-center'>{program?.program_speaker}</Text>

            <View className='ml-2'>
              <Text>Notification Options</Text>
            </View>
          </View>
          <View className='bg-white w-[100%] items-center'>
            {
              array.map((item , index) => {
                return(
                  <View className='flex-col' key={index}>
                    <View className='flex-row items-center justify-center'>
                      <NotificationCard height={NOTICARDHEIGHT} width={NOTICARDWIDTH} index={index} scrollY={scrollY} setSelectedNotification={setSelectedNotification} selectedNotification={selectedNotification} program_id={program_id}/>
                    </View>
                    <View style={{height : 10}}/>
                  </View>
                )
              })
            }
          </View>

        </Animated.ScrollView>
    </View>
  )
}

export default ClassesAndLecturesSettings