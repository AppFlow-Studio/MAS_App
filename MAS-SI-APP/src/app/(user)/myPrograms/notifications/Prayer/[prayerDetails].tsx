import { Dimensions, Image, ScrollView, StatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import React, { useState } from 'react'
import { Stack, useLocalSearchParams } from 'expo-router'
import { defaultProgramImage } from '@/src/components/ProgramsListProgram';
import NotificationCard from './PrayerNotificationCard';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { format } from 'date-fns';
import { Button } from 'react-native-paper';
import { supabase } from '@/src/lib/supabase';
import { err } from 'react-native-svg';


type PrayerDetailsParams = {
  prayerName?: string;
  prayerImage?: string  
};
const getCurrDate = new Date();
getCurrDate.setDate(getCurrDate.getDate())
const getWeekDate = new Date();
const currDate = format(getCurrDate, "yyyy-MM-dd");
getWeekDate.setDate(getCurrDate.getDate() + 6)
const weekDate = format(getWeekDate, "yyyy-MM-dd");
const MASJID_TIMES_API = `https://masjidal.com/api/v1/time/range?masjid_id=3OA8V3Kp&from_date=${currDate}&to_date=${weekDate}`;
const forEachValue = async (value : string, value2 : string) => {
  if( value == 'fajr' || value == 'asr' || value == 'zuhr' || value == 'isha' || value == 'maghrib'){
    console.log(value)
    const timeString = value2
    const date = new Date();

    // Extract hours and minutes from the time string
    const [time, period] = timeString.split(/(AM|PM)/);
    let [hours, minutes] = time.split(":").map(Number);

    // Convert to 24-hour format based on AM/PM
    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    // Set the hours and minutes on the Date object
    date.setHours(hours, minutes, 0, 0);

    // Convert to ISO string (or another format)
    const timestampz = date.toISOString();

    console.log(timestampz); // Outputs the ISO timestamp with timezone
  }
}
const prayerDetails = () => {

  const onPress = async () => {
  const response = await fetch(MASJID_TIMES_API);
  const data = await response.json();

    // Logging the data to the console
    const times = data.data.salah
    const iqamahTimes = data.data.iqamah
    console.log(times[0])
    const todays_prayer_times = times[0]
    const todays_iqamah_times = iqamahTimes[0]
    Object.keys(todays_prayer_times).map( async (value) => {
      if( value == 'fajr' || value == 'asr' || value == 'zuhr' || value == 'isha' || value == 'maghrib'){
        console.log(value)
        const timeString = todays_prayer_times[value]
        const iqamahTimeString = todays_iqamah_times[value]
        const date = new Date();
        const iqaDate = new Date();
        // Extract hours and minutes from the time string
        const [time, period] = timeString.split(/(AM|PM)/);
        let [hours, minutes] = time.split(":").map(Number);

        const [iqa_time, iqa_period] = iqamahTimeString.split(/(AM|PM)/);
        let [iqa_hours, iqa_minutes] = iqa_time.split(":").map(Number);

        // Convert to 24-hour format based on AM/PM
        if (period === "PM" && hours < 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;

        if (iqa_period === "PM" && iqa_hours < 12) iqa_hours += 12;
        if (iqa_period === "AM" && iqa_hours === 12) iqa_hours = 0;
        // Set the hours and minutes on the Date object
        date.setHours(hours, minutes, 0, 0);
        iqaDate.setHours(iqa_hours,iqa_minutes, 0 , 0);
        // Convert to ISO string (or another format)
        const timestampz = date.toISOString();
        const iqa_timestampz = iqaDate.toISOString()
        console.log(timestampz); // Outputs the ISO timestamp with timezone
        const { error } = await supabase.from('todays_prayers').insert({ prayer_name : value, athan_time : timestampz, iqamah_time : iqa_timestampz })
        if( error ){
          console.log( error)
        }
      }
    })
       
  }
  const { prayerName , prayerImage } = useLocalSearchParams<PrayerDetailsParams>();
  const { width } = Dimensions.get("window");
  const [ scrollY, setScrollY ] = useState(0);
  const [ selectedNotification, setSelectedNotification ] = useState<number[]>([])
  const layout = useWindowDimensions().width
  const layoutHeight = useWindowDimensions().height
  const NOTICARDHEIGHT  = layoutHeight / 12
  const NOTICARDWIDTH  = layout * 0.8
  const tabBarHeight = useBottomTabBarHeight() + 30
  const notificationArray = [
    "Alert at Athan time",
    "Alert 30 mins before next prayer",
    "Alert at Iqamah time",
    "Mute"
  ]
  return (
    <ScrollView className='flex-1 bg-white' style={{flexGrow: 1}} contentContainerStyle={{alignItems: "center" , paddingBottom : tabBarHeight}}>
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
            <Button onPress={onPress}>Test</Button>
            <View className='ml-2'>
              <Text>Notification Options</Text>
            </View>
          </View>
          <View className='bg-white w-[100%] items-center'>
            {
              notificationArray.map((item , index) => {
                return(
                  <View className='flex-col' key={index}>
                    <View className='flex-row items-center justify-center'>
                      <NotificationCard height={NOTICARDHEIGHT} width={NOTICARDWIDTH} item={item} index={index} scrollY={scrollY} setSelectedNotification={setSelectedNotification} selectedNotification={selectedNotification} prayerName={prayerName!}/>
                    </View>
                    <View style={{height : 10}}/>
                  </View>
                )
              })
            }
          </View>
    </ScrollView>
  )
}

export default prayerDetails
