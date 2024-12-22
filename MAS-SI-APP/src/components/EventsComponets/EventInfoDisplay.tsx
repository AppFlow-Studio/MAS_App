import { View, Text, Dimensions, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Stack, router } from "expo-router"
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import Animated,{ interpolate, useAnimatedRef, useAnimatedStyle, useScrollViewOffset } from 'react-native-reanimated';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { defaultProgramImage }  from '@/src/components/ProgramsListProgram';
import { Divider, Portal, Modal, IconButton, Icon, Button } from 'react-native-paper';
import { Lectures, SheikDataType, Program } from '@/src/types';
import { EventsType } from '@/src/types';
import { EventLectureType } from '@/src/types';
import RenderEventsLectures from './RenderEventLectures';
import RenderEventLectures from "./RenderEventLectures"
type EventInfoDisplayProp = {
    event_img : string | undefined
    event_speaker : string | undefined
    event_name : string | undefined
    event_desc : string | undefined
}
const EventInfoDisplay = ({ event_img, event_speaker, event_name, event_desc} : EventInfoDisplayProp) => {
    const [ visible, setVisible ] = useState(false);
    const showModal = () => setVisible(true);
    const hideModal = () => setVisible(false);
    const Tab = useBottomTabBarHeight()
  
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

    const GetSheikData = (  ) => {
        return(
          <View></View>
        )
      } 
  return (
    <View className='flex-1 bg-white' style={{flexGrow: 1}}>
    <Stack.Screen options={ { title : "Detail", headerTransparent: true } }/>
     <Animated.ScrollView ref={scrollRef}  scrollEventThrottle={16} contentContainerStyle={{justifyContent: "center", alignItems: "center", marginTop: "14%" }} >
         
         <Animated.Image 
           source={ { uri: event_img || defaultProgramImage } }
           style={ [{width: width / 1.2, height: 300, borderRadius: 8 }, imageAnimatedStyle] }
           resizeMode='stretch'
         />

         <View className='bg-white' style={{paddingBottom : Tab * 3, width: width}}>
           <Text className='text-center mt-2 text-xl text-black font-bold'>{event_name}</Text>
           <Text className='text-center mt-2  text-[#0D509D]' onPress={showModal}>{event_speaker}</Text>
             <View className='ml-3'>
                <Text>{event_desc}</Text>
             </View>
         </View>

         <Portal>
           <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={{backgroundColor: 'white', padding: 20, height: "35%", width: "90%", borderRadius: 35, alignSelf: "center"}} >
             <GetSheikData />
           </Modal>
         </Portal>
     </Animated.ScrollView>
     </View>
  )
}

export default EventInfoDisplay