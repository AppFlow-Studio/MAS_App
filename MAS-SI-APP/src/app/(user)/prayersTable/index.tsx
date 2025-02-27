import { View, Text, Animated, FlatList, Image, FlatListProps, Pressable, StatusBar, Dimensions, ImageBackground } from 'react-native';
import Paginator from '@/src/components/paginator';
import Table from "@/src/components/prayerTimeTable";
import React, {useEffect, useRef, useState } from 'react';
import { usePrayer } from '@/src/providers/prayerTimesProvider';
import { gettingPrayerData } from '@/src/types';
import { Divider } from 'react-native-paper';
import { Link } from 'expo-router';
import ApprovedAds from '@/src/components/BusinessAdsComponets/ApprovedAds';
import { BlurView } from 'expo-blur';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { ScrollView } from 'react-native';
import { format } from 'date-fns';


export default function Index() {
  const { prayerTimesWeek } = usePrayer();
  if( prayerTimesWeek.length == 0 ){
    return
  }
  const { session } = useAuth()
  const [isRendered, setIsRendered ] = useState(false)
  const { height } = Dimensions.get('window')
  const tableWidth = Dimensions.get('screen').width * .95
  const [ tableIndex, setTableIndex ] = useState(0)
  const  [ UserSettings, setUserSettings ] = useState<{ prayer : string, notification_settings : string[] }[]>()
  const viewConfig = useRef({ viewAreaCoveragePercentThreshold : 50}).current;
  const handleScroll = (event : any) => {
    const scrollPositon = event.nativeEvent.contentOffset.x;
    const index = Math.floor(scrollPositon / tableWidth);
    setTableIndex(index)
  }
  const flatlistRef = useRef<FlatList>(null)
  useEffect(() => {
    flatlistRef.current?.scrollToIndex({
      index : tableIndex,
      animated : true
    })  
  }, [tableIndex])
    
  const getUserSetting = async () => {
      const { data , error } = await supabase.from('prayer_notification_settings').select('*').eq('user_id', session?.user.id)
      if( data ){
        setUserSettings(data)
      }
    if( error ){
      console.log(error)
    }
  }
  useEffect(() => {
    getUserSetting()
    const listenForSettings = supabase.channel('Listen for user settings change').on(
      'postgres_changes',
      {
        event : '*',
        schema : 'public',
        table : 'prayer_notification_settings',
        filter : `user_id=eq.${session?.user.id}`
      },
      async (payload) => await getUserSetting()
    ).subscribe()

    return () => { supabase.removeChannel(listenForSettings) }
  }, [])

  const FirstTaraweehTime = setTimeToCurrentDate(convertTo24Hour(prayerTimesWeek[0].iqa_isha))
  const FirstTaraweehEndTime = new Date(FirstTaraweehTime).setHours(FirstTaraweehTime.getHours() + 1)
  const SecondTaraweehTime = new Date(FirstTaraweehTime).setHours(FirstTaraweehTime.getHours() + 1, FirstTaraweehTime.getMinutes() + 20)
  const SecondTaraweehEndTime = new Date(FirstTaraweehTime).setHours(FirstTaraweehTime.getHours() + 2,  FirstTaraweehTime.getMinutes() + 20)

  return (
    <ScrollView className='h-[100%]  bg-white flex flex-col space-y-0'>
    <StatusBar barStyle={"dark-content"} />
    <ImageBackground
      source={require('@/assets/images/PrayerTimesHeader.jpg')}
      style={{ justifyContent : 'flex-start', height: '100%' }}
      imageStyle={{ height : isRendered ? height / 4.5 : height / 3.5 , opacity : 0.9, borderBottomLeftRadius : 10, borderBottomRightRadius : 10 , width : '100%'}}
      className='flex flex-col'
    >
      {/* Weekly Prayer Times */}
        <FlatList 
          data={prayerTimesWeek}
          renderItem={({item, index}) => <Table prayerData={item} setTableIndex={setTableIndex} tableIndex={tableIndex} index={index} userSettings={UserSettings}/>}
          horizontal
          bounces={false}
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          scrollEventThrottle={32}
          viewabilityConfig={viewConfig}
          contentContainerStyle={{justifyContent: "center", alignItems: "center"}}
          ref={flatlistRef}
          className='h-[100%] mt-[50%] p-0'
        />
        {/* Taraweeh Times */}
        <View className='flex flex-row space-x-2 items-center justify-center w-full'>
          <ImageBackground source={require('@/assets/images/TaraweehCard.png')} 
          style={{height: 130, width: 190, padding: 15}} imageStyle={{borderRadius: 15}}
          className='flex flex-col '
          >
            <Text className='text-black text-[10px] text-start'>Starting</Text>
            <Text className='text-[#06F] text-md text-start'>Tarawih One</Text>
            <Text className='text-black font-bold text-lg mt-4'>{format(FirstTaraweehTime, 'p')}</Text>
            <Text className='text-xs'>End Time: <Text className='font-bold text-md'>{format(FirstTaraweehEndTime, 'p')}</Text></Text>
          </ImageBackground>
          <ImageBackground source={require('@/assets/images/TaraweehCard.png')} 
          style={{height: 130, width: 190, padding: 15 }} imageStyle={{borderRadius: 15}}
          >
            <Text className='text-black text-[10px] text-start'>Following</Text>
            <Text className='text-[#06F] text-md text-start'>Tarawih Two</Text>
            <Text className='text-black font-bold text-lg mt-4'>{format(SecondTaraweehTime, 'p')}</Text>
            <Text className='text-xs'>End Time: <Text className='font-bold text-md'>{format(SecondTaraweehEndTime, 'p')}</Text></Text>
          </ImageBackground>
        </View> 

        {/* Ramadan Quran Tracker */}

        <View className='w-full flex flex-row'>
          <View>

          </View>
          <View>

          </View>
        </View>

    </ImageBackground>
      {/* <ApprovedAds setRenderedFalse={() => setIsRendered(false)} setRenderedTrue={() => setIsRendered(true) }/> */}
  </ScrollView>
  )
}



{/* <View className='h-[100%]  bg-white'>
<StatusBar barStyle={"dark-content"} />
<View className='items-center justify-center '>
<ImageBackground
  source={require('@/assets/images/PrayerTimesHeader.jpg')}
  style={{ height : isRendered ? height / 1.85 : height / 1.3 , justifyContent : 'flex-end' }}
  imageStyle={{ height : isRendered ? height / 4.5 : height / 3.5 , opacity : 0.9, borderBottomLeftRadius : 10, borderBottomRightRadius : 10}}
  className='border-2 border-orange-500'
>
  <View className='items-center justify-center border border-black h-[100%]'>
    <FlatList 
      data={prayerTimesWeek}
      renderItem={({item, index}) => <Table prayerData={item} setTableIndex={setTableIndex} tableIndex={tableIndex} index={index} userSettings={UserSettings}/>}
      horizontal
      bounces={false}
      showsHorizontalScrollIndicator={false}
      pagingEnabled
      scrollEventThrottle={32}
      viewabilityConfig={viewConfig}
      contentContainerStyle={{justifyContent: "center", alignItems: "center"}}
      ref={flatlistRef}
    />
  </View>
  </ImageBackground>



</View>
</View> */}

{
  /*
  
   <View className='flex-row items-center justify-between  flex-wrap mt-[10]'>
              <View className='flex-col items-center justify-center ml-[10]'>
                  <View className='w-[95] h-[80] items-center justify-center bg-white' style={{shadowColor: "black", shadowOffset: {width : 0, height: 0}, shadowOpacity: 1, shadowRadius: 3, borderRadius: 8}}>
                    <Image source={{ uri : "https://cdn-icons-png.freepik.com/512/10073/10073987.png" || undefined}} style={{width: 50, height: 50, objectFit: "contain"}} />
                  </View>
                    <Text className='text-xl font-bold'> Qibla </Text>
                </View>

                <View className='flex-col items-center justify-center '>
                  <View className='w-[95] h-[80] items-center justify-center bg-white' style={{shadowColor: "black", shadowOffset: {width : 0, height: 0}, shadowOpacity: 1, shadowRadius: 3, borderRadius: 8}}>
                    <Image source={{ uri : "https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678116-calendar-512.png" || undefined}} style={{width: 50, height: 50, objectFit: "contain"}} />
                  </View>
                    <Text className='text-xl font-bold'> Calender </Text>
                </View>

                <View className='flex-col items-center justify-center mr-[10]'>
                  <View className='w-[95] h-[80] items-center justify-center bg-white' style={{shadowColor: "black", shadowOffset: {width : 0, height: 0}, shadowOpacity: 1, shadowRadius: 3, borderRadius: 8}}>
                    <Image source={{ uri : "https://cdn-icons-png.flaticon.com/512/5195/5195218.png" || undefined}} style={{width: 50, height: 50, objectFit: "contain"}} />
                  </View>
                    <Text className='text-xl font-bold'> 99 Names</Text>
                </View>
            </View>
  */
}
      {/* <ApprovedAds setRenderedFalse={() => setIsRendered(false)} setRenderedTrue={() => setIsRendered(true) }/>
        <View className='flex flex-row space-x-2 items-center justify-center w-full '>
          <ImageBackground source={require('@/assets/images/TaraweehCard.png')} 
          style={{height: 130, width: 190, padding: 15}} imageStyle={{borderRadius: 15}}
          className='flex flex-col '
          >
            <Text className='text-black text-xs text-start'>Starting</Text>
            <Text className='text-[#06F] text-md text-start'>Tarawih One</Text>
            <Text className='text-black font-bold text-lg mt-4'>{format(FirstTaraweehTime, 'p')}</Text>
            <Text className='text-xs'>End Time: <Text className='font-bold text-md'>{format(FirstTaraweehEndTime, 'p')}</Text></Text>
          </ImageBackground>
          <ImageBackground source={require('@/assets/images/TaraweehCard.png')} 
          style={{height: 130, width: 190, padding: 15 }} imageStyle={{borderRadius: 15}}
          >
            <Text className='text-black text-xs text-start'>Following</Text>
            <Text className='text-[#06F] text-md text-start'>Tarawih Two</Text>
            <Text className='text-black font-bold text-lg mt-4'>{format(SecondTaraweehTime, 'p')}</Text>
            <Text className='text-xs'>End Time: <Text className='font-bold text-md'>{format(SecondTaraweehEndTime, 'p')}</Text></Text>
          </ImageBackground>
        </View> */}

function setTimeToCurrentDate(timeString : string) {

  const currentDate = new Date(); // Get current date

   // Split the time string into hours, minutes, and seconds
   const [hours, minutes, seconds] = timeString.split(':').map(Number);
   // Create a new Date object with the current date
   const timestampWithTimeZone = new Date();
 
   // Set the time with setHours (adjust based on local timezone or UTC as needed)
   timestampWithTimeZone.setHours(hours, minutes, seconds, 0); // No milliseconds
 
   // Convert to ISO format with timezone (to ensure it's interpreted as a TIMESTAMPTZ)
   const timestampISO = timestampWithTimeZone // This gives a full timestamp with timezone in UTC
 
   return timestampISO
 }

 function convertTo24Hour(timeStr : string) {
  // Extract the period ("AM"/"PM") and the time part ("7:15")
  const period = timeStr.slice(-2).toUpperCase();
  const [hourStr, minuteStr] = timeStr.slice(0, -2).split(":");
  let hour = parseInt(hourStr, 10);
  
  // Adjust hour based on period
  if (period === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period === 'AM' && hour === 12) {
    hour = 0;
  }
  
  // Format hour and minute to two digits and add seconds ":00"
  const hh = hour.toString().padStart(2, '0');
  const mm = minuteStr.padStart(2, '0');
  return `${hh}:${mm}:00`;
}