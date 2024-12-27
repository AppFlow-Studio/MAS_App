import { View, Text, Pressable } from 'react-native'
import React, { useEffect } from 'react'
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated'
import * as Haptics from "expo-haptics"
import { useAuth } from '@/src/providers/AuthProvider'
import { Icon } from 'react-native-paper'
import { supabase } from '@/src/lib/supabase'
import { isBefore } from 'date-fns'
const NotificationArray = [
    "Alert at Athan Time",
    "Alert 30 Mins Before",
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

const JummahCards = ({ height , width, index, setSelectedNotification, selectedNotification, SupabaseJummahName, jummah}  : any) => {
  const { session } = useAuth()
  const scale = useSharedValue(1)
  const cardStyle = useAnimatedStyle(() => {
        return{
            transform: [{ scale : scale.value }]
        }
    })

   const onPress = async () => {
    const { data : CurrentSettings , error } = await supabase.from('jummah_notifications').select('notification_settings').eq('jummah', SupabaseJummahName).eq('user_id', session?.user.id, ).single()
    if(CurrentSettings == null) {
        const {data, error} = await supabase.from('jummah_notifications').insert({jummah : SupabaseJummahName, user_id : session?.user.id, notification_settings : [NotificationArray[index]]})
        if( error ){
          console.log(error)
        }
    }
    else if(CurrentSettings.notification_settings.length == 0){
      const {data, error} = await supabase.from('jummah_notifications').insert({jummah : SupabaseJummahName, user_id : session?.user.id, notification_settings : [NotificationArray[index]]})
      if( error ){
      console.log(error)
      }
    }
    
    if( CurrentSettings ){
        const settings = CurrentSettings.notification_settings
        // If Setting Exists i.e : Deselect it
        if( settings.includes(NotificationArray[index - 1]) ){
            if( index == 3 ){
              const TodayDate = new Date()
              const {data, error} = await supabase.from('jummah_notifications').update({notification_settings : ['Alert at Athan Time']}).eq('jummah', SupabaseJummahName).eq('user_id', session?.user.id )
              if( TodayDate.getDay() <= 4 ){
                //If Today is Friday, Check time and if before jummah schedule it
                const JummahTime = SupabaseJummahName == 'first' ? '12:15:00' : SupabaseJummahName == 'second' ? '13:00:00' :SupabaseJummahName == 'third' ? '13:45:00' : '15:45:00'
                const { data : push_token , error } = await supabase.from('profiles').select('push_notification_token').eq('id', session?.user.id).single()
                const PushToken = push_token?.push_notification_token
                const JummahNotificationTime = setTimeToCurrentDate(JummahTime)
                const JummahNotificationTime30Before = index == 2 ? JummahNotificationTime.setMinutes(JummahNotificationTime.getMinutes() - 30) : 0
                const { error : ScheduleJummahNotification } = await supabase.from('prayer_notification_schedule').insert({ 
                    user_id : session?.user.id, 
                    prayer : `${SupabaseJummahName} jummah`, notification_time : JummahNotificationTime30Before == 0 ? JummahNotificationTime : JummahNotificationTime30Before, 
                    message : `${SupabaseJummahName[0].toUpperCase() + SupabaseJummahName.slice(1)} Jummah Prayer ${ SupabaseJummahName == 'first' ? '12:15 PM' : SupabaseJummahName == 'second' ? '1:00 PM' : SupabaseJummahName == 'third' ? '1:45 PM' : '3:45 PM'}`,
                    push_notification_token : PushToken,
                    notification_type : 'Alert at Athan Time'
                  })
            }
              return
        }

        const filter = settings.filter((e : any) => e != NotificationArray[index - 1])
        const {data, error} = await supabase.from('jummah_notifications').update({notification_settings : filter}).eq('jummah', SupabaseJummahName).eq('user_id', session?.user.id )
        const { error : DeleteNoti } = await supabase.from('prayer_notification_scheduler').delete().eq('user_id', session?.user.id).eq('prayer', `${SupabaseJummahName} jummah`).eq('notification_type', NotificationArray[index - 1])
        }

        //Else Condition if not already set
        else{
            //If Mute
            if( index == 3 ){
                const {data, error} = await supabase.from('jummah_notifications').update({notification_settings : ['Mute']}).eq('jummah',SupabaseJummahName).eq('user_id', session?.user.id)
                const { error : DeleteNoti } = await supabase.from('prayer_notification_scheduler').delete().eq('user_id', session?.user.id).eq('prayer', `${SupabaseJummahName} jummah`)
                return
            }
            //Else 
            let filtersettings = settings.filter(e => e != 'Mute') // If Set to Mute, Clear then set assigned setting
            filtersettings.push(NotificationArray[index - 1])
            const JummahTime = SupabaseJummahName == 'first' ? '12:15:00' :SupabaseJummahName == 'second' ? '13:00:00' :SupabaseJummahName == 'third' ? '13:45:00' : '15:45:00'
            //Set the Setting
            const {data, error} = await supabase.from('jummah_notifications').update({notification_settings : filtersettings}).eq('jummah',SupabaseJummahName).eq('user_id', session?.user.id)
            const TodayDate = new Date()
            const JummahDateTime = setTimeToCurrentDate(JummahTime)
            console.log(isBefore(TodayDate, JummahDateTime))
            if( TodayDate.getDay() <= 5 && isBefore(TodayDate, JummahDateTime) ){
                //If Today is Friday, Check time and if before jummah schedule it
                const { data : push_token , error } = await supabase.from('profiles').select('push_notification_token').eq('id', session?.user.id).single()
                const PushToken = push_token?.push_notification_token
                const JummahNotificationTime = setTimeToCurrentDate(JummahTime)
                const JummahNotificationTime30Before = index == 2 ? JummahNotificationTime.setMinutes(JummahNotificationTime.getMinutes() - 30) : 0
                console.log(JummahNotificationTime)

                const { error : ScheduleJummahNotification } = await supabase.from('prayer_notification_schedule').insert({ 
                    user_id : session?.user.id, 
                    prayer : `${SupabaseJummahName} jummah`, 
                    notification_time : JummahNotificationTime, 
                    message : index == 1 ?
                    `${SupabaseJummahName[0].toUpperCase() + SupabaseJummahName.slice(1)} Jummah Prayer ${ SupabaseJummahName == 'first' ? '12:15 PM' : SupabaseJummahName == 'second' ? '1:00 PM' : SupabaseJummahName == 'third' ? '1:45 PM' : '3:45 PM'}`
                    : `${SupabaseJummahName[0].toUpperCase() + SupabaseJummahName.slice(1)} Jummah Prayer will begin in 30 minutes`,
                    push_notification_token : PushToken,
                    notification_type : NotificationArray[index - 1],
                    title : `${jummah} Jummah`
                  })
                  
            }

        }
     
   }
   }

   const getSettings = async () => {
    const { data , error } = await supabase.from('jummah_notifications').select('notification_settings').eq('jummah', SupabaseJummahName).eq('user_id', session?.user.id, ).single()
    if( error ) {
      return
    }
    if( data && data.notification_settings.length > 0){
      if( data.notification_settings.includes(NotificationArray[index - 1]) ){
        setSelectedNotification((prevSelected : any) => {
          if (!prevSelected.includes(index)) {
            return [...prevSelected, index];
          }
          return prevSelected; 
        });
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
  const CardInfo = [
        { header : 'Notify at Prayer Time:' , subText : "Get notified exactly when it's time to pray"},
        { header : '30-Minute Reminder Before Jummah:' , subText : "Get reminded 30 minutes before this jummah starts"},
        { header : 'Mute' , subText : ""}
  ]

  useEffect(() => {
    getSettings()
  }, [])
  return (
    <Animated.View style={[{ height : height, width : width, borderRadius : 20 }, cardStyle, {marginTop : index === 0 ? 10: 0}, {marginBottom : index === 5 ? 10 : 0}]}>
        <Pressable onPress={handlePress} style={[{ height : height, width : width, flexDirection : "row", alignItems : "center", justifyContent : "center", backgroundColor : 'white'  }]}>
            {selectedNotification.includes(index) ?    <Icon source={"checkbox-blank-circle"}  size={25} color='#6077F5'/>  : <Icon source={"checkbox-blank-circle-outline"}  size={25} color='#6077F5'/>}
            <View className='w-[5]'/>
            <View style={{ height : height, width : width, borderRadius : 20,  paddingVertical : 10, paddingHorizontal : '4%', justifyContent:'center'}}>
            <Text className='font-bold text black text-lg' numberOfLines={1} adjustsFontSizeToFit>{CardInfo[index - 1] ? CardInfo[index - 1].header : ''}</Text>
            <Text className='text-gray-400'>{CardInfo[index - 1] ? CardInfo[index - 1].subText : ''}</Text>
            </View>
        </Pressable>
    </Animated.View>
  )

}
export default JummahCards