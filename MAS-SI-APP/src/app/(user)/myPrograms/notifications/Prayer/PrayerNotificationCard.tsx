import { View, Text, Pressable } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated'
import * as Haptics from "expo-haptics"
import { Icon } from 'react-native-paper'
import { supabase } from '@/src/lib/supabase'
import { useAuth } from '@/src/providers/AuthProvider'
import { format, isBefore } from 'date-fns'
type NotificationCardProp = {
    height : number
    width : number
    index : number
    scrollY : number
    setSelectedNotification : ( selectedNotification : number[] ) => void
    selectedNotification : number[]
    item:string
    prayerName : string
} 
 const NotificationArray = [
  "Alert at Athan time",
  "Alert at Iqamah time",
  "Alert 30 mins before next prayer",
  "Mute"
]

function setTimeToCurrentDate(timeString : string) {
 
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

const NotificationCard = ({height , width, index, scrollY,item, setSelectedNotification, selectedNotification, prayerName} : NotificationCardProp) => {
  const { session } = useAuth()
  const scale = useSharedValue(1)
  const onPress = async () => {
    const { data : currentSettings, error } = await supabase.from('prayer_notification_settings').select('*').eq('user_id', session?.user.id).eq('prayer', prayerName.toLowerCase() ).single()
    if(currentSettings == null) {
      const {data, error} = await supabase.from('prayer_notification_settings').insert({prayer : prayerName.toLowerCase(), user_id : session?.user.id, notification_settings : [NotificationArray[index]]})
      if( error ){
        console.log(error)
      }
    }
    else if(currentSettings.length == 0){
     const {data, error} = await supabase.from('prayer_notification_settings').insert({prayer : prayerName.toLowerCase(), user_id : session?.user.id, notification_settings : [NotificationArray[index]]})
     if( error ){
      console.log(error)
     }
    }
    if(currentSettings){
      const settings = currentSettings.notification_settings
      // Disable setting if it exists 
      if( settings.includes(NotificationArray[index]) ){
        if( settings.includes(NotificationArray[3]) ){
          const {data, error} = await supabase.from('prayer_notification_settings').update({notification_settings : ['Alert at Athan time']}).eq('prayer', prayerName.toLowerCase()).eq('user_id', session?.user.id )
          return
        }
        const filter = settings.filter((e : any) => e !== NotificationArray[index])
        const {data, error} = await supabase.from('prayer_notification_settings').update({notification_settings : filter}).eq('prayer', prayerName.toLowerCase()).eq('user_id', session?.user.id )
        const { error : Delete } = await supabase.from('prayer_notification_schedule').delete().eq('user_id', session?.user.id).eq('prayer', prayerName.toLowerCase()).eq('notification_type', index != 2 ? NotificationArray[index] : 'Alert 30mins before next prayer')
        if ( settings.length == 0 ){
          const {data, error} = await supabase.from('prayer_notification_settings').update({notification_settings : ['Mute']}).eq('prayer', prayerName.toLowerCase()).eq('user_id', session?.user.id )

        }
      }
      else{
        // Set To Mute and delete schduled notifications for this prayer for this user 
        if( index == 3 ){
          const {data, error} = await supabase.from('prayer_notification_settings').update({notification_settings : ['Mute']}).eq('prayer', prayerName.toLowerCase()).eq('user_id', session?.user.id, )
          const { error : scheduleError} = await supabase.from('prayer_notification_schedule').delete().eq('user_id' , session?.user.id).eq('prayer' , prayerName.toLowerCase())
          return
        }
        //Check for Mute and filter it out before adding new settings
        let filtersettings = settings.filter(e => e != 'Mute')
        filtersettings.push(NotificationArray[index])
        const {data, error} = await supabase.from('prayer_notification_settings').update({notification_settings : filtersettings}).eq('prayer', prayerName.toLowerCase()).eq('user_id', session?.user.id, )
        //If select Alert at Athan Time

        if( index == 0 ){
          const { data : getPrayerTime, error } = await supabase.from('todays_prayers').select('athan_time, iqamah_time').eq('prayer_name', prayerName.toLowerCase() == 'dhuhr' ? 'zuhr' : prayerName.toLowerCase()).single()
          if( getPrayerTime ){
            const PrayerTime = setTimeToCurrentDate(getPrayerTime.athan_time)
            const IqaTime = setTimeToCurrentDate(getPrayerTime.iqamah_time)
            const currTime = new Date()
            if( isBefore(currTime, PrayerTime) ){
              const { data : UserPushToken, error } = await supabase.from('profiles').select('push_notification_token').eq('id', session?.user.id).single()
              const { data : CheckIfNotificationExists , error : CheckIfNotificationExistsError }  = await supabase.from('prayer_notification_scheduler').select('id').eq('prayer', prayerName.toLowerCase()).eq('user_id', session?.user.id).eq('notification_type', 'Alert at Athan time').single()
              if( UserPushToken && UserPushToken.push_notification_token && !CheckIfNotificationExists ){
              const FormatAthTime = format(PrayerTime, 'p')
              const FormatIqaTime = format(IqaTime, 'p')
              const { error } = await supabase.from('prayer_notification_schedule').insert({ 
                user_id : session?.user.id, 
                notification_time : PrayerTime, 
                prayer : prayerName.toLowerCase(), 
                message : `Time to pray ${prayerName} ${FormatAthTime} \n Iqamah Time ${FormatIqaTime} `,               
                push_notification_token : UserPushToken.push_notification_token, 
                notification_type : 'Alert at Athan time'})
              }
            }
          }
        } 
        //If select Alert at 30 mins before next prayer Time
        else if( index == 2){

          const { data : getPrayerTime, error } = await supabase.from('todays_prayers').select('prayer_name,iqamah_time,athan_time')

          if( prayerName == 'Fajr' ){
            const nextPrayerInfo = getPrayerTime?.filter(e => e.prayer_name == 'zuhr')
            const nextPrayerTime = nextPrayerInfo[0].athan_time
            const PrayerTime = setTimeToCurrentDate(nextPrayerTime)
            PrayerTime.setMinutes(PrayerTime.getMinutes() - 30)
            const currentTime = new Date()
            if( isBefore(currentTime, PrayerTime )){
              const { data : UserPushToken, error } = await supabase.from('profiles').select('push_notification_token').eq('id', session?.user.id).single()
              const { data : CheckIfNotificationExists , error : CheckIfNotificationExistsError }  = await supabase.from('prayer_notification_scheduler').select('id').eq('prayer', prayerName.toLowerCase()).eq('user_id', session?.user.id).eq('notification_type', 'Alert 30mins before next prayer').single()

              if( UserPushToken && UserPushToken.push_notification_token && !CheckIfNotificationExists){
              const { error } = await supabase.from('prayer_notification_schedule').insert({ user_id : session?.user.id, notification_time : PrayerTime, prayer : prayerName.toLowerCase(), message : `30 mins before Dhuhr!`, push_notification_token : UserPushToken.push_notification_token, notification_type : 'Alert 30mins before next prayer'})
              }
          }
          }
          
          if( prayerName == 'Dhuhr' ){
            const nextPrayerInfo = getPrayerTime?.filter(e => e.prayer_name == 'asr')
            const nextPrayerTime = nextPrayerInfo[0].athan_time
            const PrayerTime = setTimeToCurrentDate(nextPrayerTime)
            PrayerTime.setMinutes(PrayerTime.getMinutes() - 30)
            const currentTime = new Date()
            if( isBefore(currentTime, PrayerTime )){
              const { data : UserPushToken, error } = await supabase.from('profiles').select('push_notification_token').eq('id', session?.user.id).single()
              const { data : CheckIfNotificationExists , error : CheckIfNotificationExistsError }  = await supabase.from('prayer_notification_scheduler').select('id').eq('prayer', prayerName.toLowerCase()).eq('user_id', session?.user.id).eq('notification_type', 'Alert 30mins before next prayer').single()

              if( UserPushToken && UserPushToken.push_notification_token && !CheckIfNotificationExists ){
              const { error } = await supabase.from('prayer_notification_schedule').insert({ user_id : session?.user.id, notification_time : PrayerTime, prayer : prayerName.toLowerCase(), message : `30 mins before Asr!`, push_notification_token : UserPushToken.push_notification_token, notification_type : 'Alert 30mins before next prayer'})
              }
          }
          }

          if( prayerName == 'Asr' ){
            const nextPrayerInfo = getPrayerTime?.filter(e => e.prayer_name == 'maghrib')
            const nextPrayerTime = nextPrayerInfo[0].athan_time
            const PrayerTime = setTimeToCurrentDate(nextPrayerTime)
            PrayerTime.setMinutes(PrayerTime.getMinutes() - 30)
            const currentTime = new Date()
            if( isBefore(currentTime, PrayerTime )){
              const { data : UserPushToken, error } = await supabase.from('profiles').select('push_notification_token').eq('id', session?.user.id).single()
              const { data : CheckIfNotificationExists , error : CheckIfNotificationExistsError }  = await supabase.from('prayer_notification_scheduler').select('id').eq('prayer', prayerName.toLowerCase()).eq('user_id', session?.user.id).eq('notification_type', 'Alert 30mins before next prayer').single()

              if( UserPushToken && UserPushToken.push_notification_token && !CheckIfNotificationExists){
              const { error } = await supabase.from('prayer_notification_schedule').insert({ user_id : session?.user.id, notification_time : PrayerTime, prayer : prayerName.toLowerCase(), message : `30 mins before Maghrib!`, push_notification_token : UserPushToken.push_notification_token, notification_type : 'Alert 30mins before next prayer'})
              }
          }
          }

          if( prayerName == 'Maghrib' ){
            const nextPrayerInfo = getPrayerTime?.filter(e => e.prayer_name == 'isha')
            const nextPrayerTime = nextPrayerInfo[0].athan_time
            const PrayerTime = setTimeToCurrentDate(nextPrayerTime)
            PrayerTime.setMinutes(PrayerTime.getMinutes() - 30)
            const currentTime = new Date()
            if( isBefore(currentTime, PrayerTime )){
              const { data : UserPushToken, error } = await supabase.from('profiles').select('push_notification_token').eq('id', session?.user.id).single()
              const { data : CheckIfNotificationExists , error : CheckIfNotificationExistsError }  = await supabase.from('prayer_notification_scheduler').select('id').eq('prayer', prayerName.toLowerCase()).eq('user_id', session?.user.id).eq('notification_type', 'Alert 30mins before next prayer').single()

              if( UserPushToken && UserPushToken.push_notification_token && !CheckIfNotificationExists){
              const { error } = await supabase.from('prayer_notification_schedule').insert({ user_id : session?.user.id, notification_time : PrayerTime, prayer : prayerName.toLowerCase(), message : `30 mins before Isha!`, push_notification_token : UserPushToken.push_notification_token, notification_type : 'Alert 30mins before next prayer'})
              }
          }
        }

        if ( prayerName == 'Isha' ){
          const nextPrayerInfo = getPrayerTime?.filter(e => e.prayer_name == 'fajr')
          const nextPrayerTime = nextPrayerInfo[0].athan_time
          const PrayerTime = setTimeToCurrentDate(nextPrayerTime)
          PrayerTime.setMinutes(PrayerTime.getMinutes() - 30)
          const currentTime = new Date()
          if( isBefore(currentTime, PrayerTime )){
            const { data : UserPushToken, error } = await supabase.from('profiles').select('push_notification_token').eq('id', session?.user.id).single()
            const { data : CheckIfNotificationExists , error : CheckIfNotificationExistsError }  = await supabase.from('prayer_notification_scheduler').select('id').eq('prayer', prayerName.toLowerCase()).eq('user_id', session?.user.id).eq('notification_type', 'Alert 30mins before next prayer').single()

            if( UserPushToken && UserPushToken.push_notification_token && !CheckIfNotificationExists){
            const { error } = await supabase.from('prayer_notification_schedule').insert({ user_id : session?.user.id, notification_time : PrayerTime, prayer : prayerName.toLowerCase(), message : `30 mins before Fajr!`, push_notification_token : UserPushToken.push_notification_token, notification_type : 'Alert 30mins before next prayer'})
            }
        }
        }

        }
        // If Select Alert at Iqamah Time
        else if( index == 1 ){
          const { data : getPrayerTime, error } = await supabase.from('todays_prayers').select('iqamah_time').eq('prayer_name', prayerName.toLowerCase() == 'dhuhr' ? 'zuhr' : prayerName.toLowerCase()).single()
          if( getPrayerTime ){
            const PrayerTime = setTimeToCurrentDate(getPrayerTime.iqamah_time)
            const currTime = new Date()
            if( isBefore(currTime, PrayerTime) ){
              const { data : UserPushToken, error } = await supabase.from('profiles').select('push_notification_token').eq('id', session?.user.id).single()
              const { data : CheckIfNotificationExists , error : CheckIfNotificationExistsError }  = await supabase.from('prayer_notification_scheduler').select('id').eq('prayer', prayerName.toLowerCase()).eq('user_id', session?.user.id).eq('notification_type', 'Alert at Iqamah time').single()
              if( UserPushToken && UserPushToken.push_notification_token && !CheckIfNotificationExists ){
              const FormatIqaTime = format(PrayerTime, 'p')
              const { error } = await supabase.from('prayer_notification_schedule').insert({ 
                user_id : session?.user.id, 
                notification_time : PrayerTime, 
                prayer : prayerName.toLowerCase(), 
                message : `Iqamah for ${prayerName} at ${FormatIqaTime}`, 
                push_notification_token : UserPushToken.push_notification_token, 
                notification_type : 'Alert at Iqamah time'})
              }
            }
          }
        }
      }
    }
  }

  const handlePress = () => {
    scale.value = withSequence(withSpring(0.9), withSpring(1))
    
    Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      )

      if( selectedNotification.includes(index)  ){
        if( index == 3 ){
          setSelectedNotification([0])
        }
        else{
          const setPlaylist = selectedNotification?.filter(id => id !== index)
          setSelectedNotification(setPlaylist)
        }
      }
      else if( selectedNotification ){
          if ( index == 3 ){
            setSelectedNotification([index])
          }else{
            const setPlaylist = selectedNotification?.filter(id => id !== 3)
            setSelectedNotification([...setPlaylist, index])
          }
      }
      else{
          setSelectedNotification([index])
      }
      onPress()
  }
  
  const cardStyle = useAnimatedStyle(() => {
    return{
        transform: [{ scale : scale.value }]
    }
  })

  const getSettings = async () => {
    const { data , error } = await supabase.from('prayer_notification_settings').select('notification_settings').eq('prayer', prayerName.toLowerCase()).eq('user_id', session?.user.id, ).single()
    if( error ) {
      return
    }
    if( data && data.notification_settings.length > 0){
      if( data.notification_settings.includes(NotificationArray[index]) ){
        setSelectedNotification((prevSelected : any) => {
          if (!prevSelected.includes(index)) {
            return [...prevSelected, index];
          }
          return prevSelected; 
        });
                }
    }
  }
  useEffect(() => {
    getSettings()
  },[])
  const CardInfo = [
    { header : 'Notify at Prayer Time:' , subText : "Get notified exactly when it's time to pray"},
    { header : 'Notify at Iqamah Time:' , subText : "Get notified when it's time to gather at the masjid"},
    { header : '30-Minute Reminder Before Next Prayer:' , subText : "Get reminded 30 minutes before the next prayer time"},
    { header : 'Mute' , subText : ""}
  ]
  return (
        <Animated.View style={[{ height : height, width : width + 30, borderRadius : 20 }, cardStyle, {marginTop : index === 0 ? 10: 0}, {marginBottom : index === 5 ? 10 : 0}]}>
            <Pressable onPress={handlePress} style={[{ height : height, width : width + 30, flexDirection : "row", alignItems : "center", justifyContent : "center", backgroundColor : 'white'  }]}
            >
              {selectedNotification.includes(index) ?  <Icon source={"checkbox-blank-circle"}  size={25} color='#6077F5'/>  : <Icon source={"checkbox-blank-circle-outline"}  size={25} color='#6077F5'/>}
                <View className='w-[5]'/>
                <View style={{ height : height, width : width, borderRadius : 20,  paddingVertical : 10, paddingHorizontal : '4%', justifyContent:'center'}}>
                <Text className='font-bold text black text-lg' numberOfLines={1} adjustsFontSizeToFit>{CardInfo[index] ? CardInfo[index].header : ''}</Text>
                <Text className='text-gray-400'>{CardInfo[index] ? CardInfo[index].subText : ''}</Text>
              </View>
            </Pressable>
        </Animated.View>
  )
}

export default NotificationCard