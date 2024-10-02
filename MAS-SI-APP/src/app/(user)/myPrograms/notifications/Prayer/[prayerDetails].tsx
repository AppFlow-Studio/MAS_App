import { Dimensions, Image, StatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import React, { useState } from 'react'
import { Stack, useLocalSearchParams } from 'expo-router'
import { defaultProgramImage } from '@/src/components/ProgramsListProgram';
import NotificationCard from './PrayerNotificationCard';


type PrayerDetailsParams = {
  prayerName?: string;
  prayerImage?: string  
};

const prayerDetails = () => {
  const { prayerName,prayerImage } = useLocalSearchParams<PrayerDetailsParams>();
  const { width } = Dimensions.get("window");
  const [ scrollY, setScrollY ] = useState(0);
  const [ selectedNotification, setSelectedNotification ] = useState<number[]>([])
  const layout = useWindowDimensions().width
  const layoutHeight = useWindowDimensions().height
  const NOTICARDHEIGHT  = layoutHeight / 12
  const NOTICARDWIDTH  = layout * 0.8
  console.log('====================================');
  console.log( prayerName,prayerImage);
  console.log('====================================');

  const notificationArray = [
    "Alert at Athan time",
    "Alert 30 mins before next prayer",
    "Mute"
  ]
  return (
    <View className='flex-1 bg-white' style={{flexGrow: 1, alignItems: "center"}}>
     <StatusBar barStyle={"dark-content"}/>
         <Stack.Screen options={{ title : prayerName, headerBackTitleVisible : false}}/>
         <View className='mt-4'>
            <Image
              source={ { uri: prayerImage || defaultProgramImage }}
              style={{width: width / 1.2, height: 300, borderRadius: 8 } }
              resizeMode='stretch'
            />
          </View>
          <View className='flex-col bg-white w-[100%]'>
            <Text className='font-bold text-2xl text-center m-4'>{prayerName}</Text>

            <View className='ml-2'>
              <Text>Notification Options</Text>
            </View>
          </View>
          <View className='bg-white w-[100%] items-center'>
            {
              notificationArray.map((item , index) => {
                return(
                  <View className='flex-col'>
                    <View className='flex-row items-center justify-center'>
                      <NotificationCard height={NOTICARDHEIGHT} width={NOTICARDWIDTH} item={item} index={index} scrollY={scrollY} setSelectedNotification={setSelectedNotification} selectedNotification={selectedNotification}/>
                    </View>
                    <View style={{height : 10}}/>
                  </View>
                )
              })
            }
          </View>
    </View>
  )
}

export default prayerDetails
