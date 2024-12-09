import { View, Text, Pressable } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated'
import * as Haptics from "expo-haptics"
import { Icon } from 'react-native-paper'
import { supabase } from '@/src/lib/supabase'
import { useAuth } from '@/src/providers/AuthProvider'
import { err } from 'react-native-svg'
import { Program } from '@/src/types'
import { isBefore } from 'date-fns'
type NotificationCardProp = {
    height : number
    width : number
    index : number
    scrollY : number
    setSelectedNotification : ( selectedNotification : number[] ) => void
    selectedNotification : number[]
    program_id : string | string[]
    programInfo : Program
}

const schedule_notification = async ( user_id, push_notification_token, message, notification_type, program_event_name, notification_time ) => {
  const { error } = await supabase.from('program_notification_schedule').insert({ user_id : user_id, push_notification_token : push_notification_token, message : message, notification_type : notification_type, program_event_name : program_event_name, notification_time : notification_time})
  if( error ){
    console.log(error)
  }
}

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


const NotificationCard = ({height , width, index, scrollY, setSelectedNotification, selectedNotification, program_id, programInfo} : NotificationCardProp) => {
  const { session } = useAuth()
  const scale = useSharedValue(1)
  const [ checked , setChecked ] = useState(false)
  const [ pushToken, setPushToken ] = useState()
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const onPress = async () => {
    const { data : currentSettings, error } = await supabase.from('program_notifications_settings').select('*').eq('user_id', session?.user.id).eq('program_id', program_id ).single()
    if(currentSettings == null) {
      const {data, error} = await supabase.from('program_notifications_settings').insert({program_id : program_id, user_id : session?.user.id, notification_settings : [CardOptions[index]]})
    }
    else if(currentSettings.length == 0){
     const {data, error} = await supabase.from('program_notifications_settings').insert({program_id : program_id, user_id : session?.user.id, notification_settings : [CardOptions[index]]})
     if( error ){
      console.log(error)
     }
    }
    if(currentSettings){
      const settings = currentSettings.notification_settings
      if( settings.includes(CardOptions[index]) ){
        const filter = settings.filter((e : any) => e !== CardOptions[index])
        const {data, error} = await supabase.from('program_notifications_settings').update({notification_settings : filter}).eq('program_id', program_id).eq('user_id', session?.user.id, )
      }
      else{
        settings.push(CardOptions[index])
        if ( pushToken ) {
          const currentDay = new Date()
          const day = currentDay.getDay()
          const programStartTime = setTimeToCurrentDate(programInfo.program_start_time)
          const program_days = programInfo.program_days
          if( index == 0 ){
            await Promise.all(program_days.map( async ( days ) => {
              const indexOfDay = daysOfWeek.indexOf(days)
              if( ( indexOfDay - 1 ) % 6 == day ){
                await schedule_notification(session?.user.id, pushToken,  `${programInfo.program_name} is Tomorrow`, 'Day Before', programInfo.program_name, programStartTime)
              }
            }))
            }else {
              if( program_days.includes(daysOfWeek[day]) && isBefore( currentDay, programStartTime )){
                if( index == 1 ){
                  await schedule_notification(session?.user.id, pushToken,  `${programInfo.program_name} is Starting Now!`, 'When Program Starts', programInfo.program_name, programStartTime)
                }
                else if( index == 2 && isBefore(currentDay, programStartTime) ){
                  const start_time = setTimeToCurrentDate(programInfo.program_start_time)
                  start_time.setMinutes(start_time.getMinutes() - 30)
                  await schedule_notification(session?.user.id, pushToken, `${programInfo.program_name} is Starting in 30 Mins!`, '30 Mins Before', programInfo.program_name, start_time)
                }
              }
            }
        } 
        const { error } = await supabase.from('program_notifications_settings').update({notification_settings : settings}).eq('program_id', program_id).eq('user_id', session?.user.id, )
      }




    }
  }
  const handlePress = () => {
    scale.value = withSequence(withSpring(0.9), withSpring(1))
    
    Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      )

      if( selectedNotification.includes(index)  ){
        const setPlaylist = selectedNotification?.filter(id => id !== index)
        setSelectedNotification(setPlaylist)
        setChecked( false )
      }
      else if( selectedNotification ){
        setSelectedNotification([...selectedNotification, index])
        setChecked( true )
      }
      else{
          setSelectedNotification([index])
          setChecked(true)
      }
      onPress()
  }
  const getSettings = async () => {
    const { data , error } = await supabase.from('program_notifications_settings').select('notification_settings').eq('program_id', program_id).eq('user_id', session?.user.id, ).single()
    const { data : user_push_token } = await supabase.from('profiles').select('push_notification_token').eq('id', session?.user.id).single()
    if( user_push_token ){
      setPushToken(user_push_token.push_notification_token)
    }
    if( error ) {
      return
    }
    if( data && data.notification_settings.length > 0){
      if( data.notification_settings.includes(CardOptions[index]) ){
        setSelectedNotification((prevSelected : any) => {
          if (!prevSelected.includes(index)) {
            return [...prevSelected, index];
          }
          return prevSelected; 
        });
        
        setChecked(true); 
        }
    }
  }
  useEffect(() => {
    getSettings()
  }, [])
  const cardStyle = useAnimatedStyle(() => {
    return{
        transform: [{ scale : scale.value }]
    }
  })
  const CardOptions = ['Day Before', '30 Mins Before', 'When Program Starts']
  const CardInfo = [
    { header : 'Notify at Start:' , subText : "Get notified exactly when the program starts"},
    { header : 'Notify 30 minutes before Start:' , subText : "Get reminded 30 min before the program starts"},
    { header : 'Notify 1 day before Start:' , subText : "Get reminded 1 day before the program starts"}
  ]
  return (
    <Animated.View style={[{ height : height, width : width, borderRadius : 20 }, cardStyle, {marginTop : index === 0 ? 10: 0}, {marginBottom : index === 5 ? 10 : 0}]}>
        <Pressable onPress={handlePress} style={[{ height : height, width : width, flexDirection : "row", alignItems : "center", justifyContent : "center", backgroundColor : 'white'  }]}>
          {selectedNotification.includes(index) ?    <Icon source={"checkbox-blank-circle"}  size={25} color='#6077F5'/>  : <Icon source={"checkbox-blank-circle-outline"}  size={25} color='#6077F5'/>}
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