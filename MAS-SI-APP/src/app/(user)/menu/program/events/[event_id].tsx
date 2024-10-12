import { View, Text, StatusBar, Pressable } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import { EventsType } from '@/src/types'
import EventsLectureDisplay from '@/src/components/EventsComponets/EventsLectureDisplay'
import { ActivityIndicator, Icon } from 'react-native-paper'
import EventInfoDisplay from '@/src/components/EventsComponets/EventInfoDisplay'
import { Stack } from 'expo-router'
import Toast from 'react-native-toast-message'
import { useAuth } from '@/src/providers/AuthProvider'
import * as Haptics from 'expo-haptics'
const EventInfo = () => {
  const { session } = useAuth()
  const navigation = useNavigation<any>()
  const { event_id } = useLocalSearchParams()
  const [ eventInfoData, setEventInfoData ] = useState<EventsType | null>()
  const [ eventLectures, setEventLectures ] = useState<EventsType>()
  const [ eventInNotification, setEventInNotification ] = useState(false)
  const fetchEventInfo = async () => {
    const { data , error } = await supabase.from("events").select("*").eq("event_id", event_id).single()
    if( error ){
        console.log(error)
    }
    if( data ){
        setEventInfoData(data)
    }
  }
  

  useEffect(() => {
    fetchEventInfo()
  }, [])
  if( !eventInfoData ){
    return <ActivityIndicator />
  }

  const NotificationBell = () => {
    const addedToNoti = () => {
      const goToProgram = () => {
        navigation.navigate('myPrograms', { screen : 'notifications/[event_id]', params : { event_id : event_id}, initial: false  })
      }
      Toast.show({
        type : 'addProgramToNotificationsToast',
        props : { props : eventInfoData, onPress : goToProgram },
        position : 'top',
        topOffset : 50,
      })
    }
    const addToProgramsNoti = () => {
      const goToProgram = () => {
        navigation.navigate('myPrograms')
      }
      Toast.show({
        type : 'ProgramAddedToPrograms',
        props : { props : eventInfoData, onPress : goToProgram },
        position : 'top',
        topOffset : 50,
      })
    }
     const handlePress = async () => {
      if( eventInNotification ) {
        const { error } = await supabase.from("added_notifications_programs").delete().eq("user_id" , session?.user.id).eq("program_id", event_id)
        const { error : settingsError } = await supabase.from('program_notifications_settings').delete().eq('user_id', session?.user.id).eq("program_id", event_id)
        setEventInNotification(false)
      }
      else{
        const { error } = await supabase.from("added_notifications_programs").insert({user_id :session?.user.id, program_id : event_id})
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
        <Pressable onPress={handlePress} className='w-[30] h-[35] items-center justify-center'>
          {eventInNotification ?  <Icon source={"bell-check"} color='#007AFF' size={30}/> : <Icon source={"bell-outline"} color='#007AFF' size={30}/> }
        </Pressable>
      </View>
     )
    }

    
  return (
    <>
       <Stack.Screen options={{ headerBackTitleVisible : false, title : "", headerStyle : {backgroundColor : "white"}, headerRight : () => <NotificationBell /> }}/>
       <StatusBar barStyle={"dark-content"}/>
        {eventInfoData?.has_lecture ?  <EventsLectureDisplay event_id={eventInfoData?.event_id} event_img={eventInfoData?.event_img} event_name={eventInfoData?.event_name} event_speaker={eventInfoData?.event_speaker}/> 
      : <EventInfoDisplay event_img={eventInfoData.event_img} event_speaker={eventInfoData.event_speaker} event_name={eventInfoData.event_name} event_desc={eventInfoData.event_desc}/>}
    </>
  )
}

export default EventInfo