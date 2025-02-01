import { View, Text, StatusBar, Pressable } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import { EventsType } from '@/src/types'
import EventsLectureDisplay from '@/src/components/EventsComponets/EventsLectureDisplay'
import { ActivityIndicator, Badge, Icon } from 'react-native-paper'
import EventInfoDisplay from '@/src/components/EventsComponets/EventInfoDisplay'
import { Stack } from 'expo-router'
import Toast from 'react-native-toast-message'
import { useAuth } from '@/src/providers/AuthProvider'
import * as Haptics from 'expo-haptics'
import { isAfter, isBefore } from 'date-fns'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
function setTimeToCurrentDate(timeString : string ) {

  // Split the time string into hours, minutes, and seconds
  const [hours, minutes, seconds] = timeString.split(':').map(Number);

  // Create a new Date object with the current date
  const timestampWithTimeZone = new Date();

  // Set the time with setHours (adjust based on local timezone or UTC as needed)
  timestampWithTimeZone.setHours(hours , minutes, seconds, 0); // No milliseconds

  // Convert to ISO format with timezone (to ensure it's interpreted as a TIMESTAMPTZ)
  const timestampISO = timestampWithTimeZone // This gives a full timestamp with timezone in UTC

  return timestampISO
}
const schedule_notification = async ( user_id, push_notification_token, message, notification_type, program_event_name, notification_time ) => {
  console.log(program_event_name)
  const { error } = await supabase.from('program_notification_schedule').insert({ user_id : user_id, push_notification_token : push_notification_token, message : message, notification_type : notification_type, program_event_name : program_event_name, notification_time : notification_time, title : program_event_name})
  if( error ){
    console.log(error)
  }
}
const EventInfo = () => {
  const { session } = useAuth()
  const navigation = useNavigation<any>()
  const { event_id } = useLocalSearchParams()
  const [ eventInfoData, setEventInfoData ] = useState<EventsType | null>()
  const [ eventLectures, setEventLectures ] = useState<EventsType>()
  const [ eventInNotification, setEventInNotification ] = useState(false)
  const notifade = useSharedValue(1)
  const today = new Date()
  const fetchEventInfo = async () => {
    const { data , error } = await supabase.from("events").select("*").eq("event_id", event_id).single()
    const { data : InNotifications, error : InNotificationsError } = await supabase.from('added_notifications_events').select('*').eq('event_id', event_id).eq('user_id', session?.user.id).single()
    if( InNotifications ){
      setEventInNotification(true)
    }
    if( error ){
        console.log(error)
    }
    if( data ){
        setEventInfoData(data)
    }
  }
  const fadeOutNotification = useAnimatedStyle(() => ({
    opacity : notifade.value
  }))

  useEffect(() => {
    notifade.value = withTiming(0, {duration : 6000})
    fetchEventInfo()
  }, [])

  const NotificationBell = () => {
    const addedToNoti = () => {
      const goToProgram = () => {
        navigation.navigate('myPrograms', { screen : 'notifications/[event_id]', params : { event_id : event_id}, initial: false  })
      }
      Toast.show({
        type : 'addEventToNotificationsToast',
        props : { props : eventInfoData, onPress : goToProgram },
        position : 'top',
        topOffset : 50,
      })
    }

     const handlePress = async () => {
      if( eventInNotification ) {
        const { error } = await supabase.from("added_notifications_events").delete().eq("user_id" , session?.user.id).eq("event_id", event_id)
        const { error : settingsError } = await supabase.from('event_notification_settings').delete().eq('user_id', session?.user.id).eq("event_id", event_id)
        const { error : ScheduleNotisError } = await supabase.from('program_notification_schedule').delete().eq('user_id', session?.user.id).eq("program_event_name", eventInfoData?.event_name)
        setEventInNotification(false)
      }
      else{
        const { error } = await supabase.from("added_notifications_events").insert({user_id :session?.user.id, event_id : event_id})
         const TodaysDate = new Date()
              const DaysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
              const programDays = eventInfoData?.event_days
              const ProgramStartTime = setTimeToCurrentDate(eventInfoData?.event_start_time!)
        
              if ( programDays && isBefore(TodaysDate, ProgramStartTime) ){
              await Promise.all(
                programDays?.map( async (day) => {
                  const { data : user_push_token } = await supabase.from('profiles').select('push_notification_token').eq('id', session?.user.id).single()
                  if( (TodaysDate.getDay() == DaysOfWeek.indexOf(day)) && (user_push_token?.push_notification_token) ){
                    await schedule_notification(session?.user.id, user_push_token?.push_notification_token,  `${eventInfoData.event_name} is Starting Now!`, 'When Program Starts', eventInfoData.event_name, ProgramStartTime)
                  }
                })
              )
            }
        if( error ){
          console.log(error)
        }

        setEventInNotification(true)
        addedToNoti()
      }
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      )
    }
     return(
      <View className='flex-row items-center gap-x-5'>
        <Animated.View style={fadeOutNotification}>
          <View style={{ opacity : 1}} className='left-10 bottom-4 bg-gray-400 text-black h-[23px] w-[75px] text-[10px] items-center justify-center text-center z-[1] rounded-xl p-1 ' >
            <Text className='text-black text-[10px] font-semibold'>Notifications</Text>
          </View>
        </Animated.View>
        <Pressable onPress={handlePress} className='w-[30] h-[35] items-center justify-center'>
          {eventInNotification ?  <Icon source={"bell-check"} color='#007AFF' size={30}/> : <Icon source={"bell-outline"} color='#007AFF' size={30}/> }
        </Pressable>
      </View>
     )
    }

  const currDate = new Date().toISOString()
  return (
    <>
       <Stack.Screen options={{ headerBackTitleVisible : false, headerTitle : '', headerStyle : {backgroundColor : "white"}, headerRight : () => { if( isBefore(today, eventInfoData?.event_end_date!) ) return <NotificationBell />; else return <></> } }}/>
       <StatusBar barStyle={"dark-content"}/>
        {eventInfoData?.has_lecture ?  
        <EventsLectureDisplay event_id={eventInfoData?.event_id} event_img={eventInfoData?.event_img} event_name={eventInfoData?.event_name} event_speaker={eventInfoData?.event_speaker}/> 
      : <EventInfoDisplay event_img={eventInfoData?.event_img} event_speaker={eventInfoData?.event_speaker} event_name={eventInfoData?.event_name} event_desc={eventInfoData?.event_desc} event={eventInfoData}/>}
    </>
  )
}


export default EventInfo