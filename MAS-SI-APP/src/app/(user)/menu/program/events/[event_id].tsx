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
        setEventInNotification(false)
      }
      else{
        const { error } = await supabase.from("added_notifications_events").insert({user_id :session?.user.id, event_id : event_id})
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
          <Badge style={{ opacity : 1}} className='left-10 bottom-4 bg-gray-400 text-black h-[23px] w-[75px] text-[10px] items-center justify-end font-semibold'>
            Notifications
          </Badge>
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