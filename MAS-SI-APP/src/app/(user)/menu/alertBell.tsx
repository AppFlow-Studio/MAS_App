import { View, Text, TouchableOpacity, Modal, Settings } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Icon, MD3Colors, Portal } from 'react-native-paper';
import AlertBellModal from '@/src/components/AlertBellModal';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import Toast from 'react-native-toast-message'
import { useAuth } from '@/src/providers/AuthProvider';
import { supabase } from '@/src/lib/supabase';
import { format, isBefore } from 'date-fns';

type salahProp = {
  salah: string,
  iqamah : string,
  athan : string
}

function setTimeToCurrentDate(timeString : string) {
  const date = new Date(); // Get the current date
  const [time, modifier] = timeString.split(/([APM])/); // Split the time and the AM/PM modifier
  
  let [hours, minutes] = time.split(':').map(Number);
  
  if (modifier === 'PM' && hours !== 12) {
    hours += 12;
  }
  if (modifier === 'AM' && hours === 12) {
    hours = 0;
  }
  
  date.setHours(hours);
  date.setMinutes(minutes);
  date.setSeconds(0); // Optional: Set seconds to 0
  return date
}

export default function AlertBell( {salah, iqamah, athan} : salahProp ) {
  const [bellClick, setBellClick] = useState(false);
  const [ alertAthan, setAlertAthan ] = useState(false)
  const [ alert30Before, setAlert30Before ] = useState(false)
  const [ alertArray, setAlertArray ] = useState([])
  const [ alertIqamah, setAlertIqamah ] = useState(false)
  const [ mute, setMute ] = useState(false)
  const { session } = useAuth()
  const getUserSetting = async () => {
      const { data , error } = await supabase.from('prayer_notification_settings').select('*').eq('user_id', session?.user.id).eq('prayer', salah.toLowerCase()).single()
      if( data ){
        setAlertArray(data.notification_settings)
        setMute(false)
        if( data.notification_settings.includes('Alert at Athan time') ){
          setAlertAthan(true)
        }else{
          setAlertAthan(false)
        }
        if( data.notification_settings.includes('Alert 30 mins before next prayer') ){
          setAlert30Before(true)
        }else{
          setAlert30Before(false)
        }
        if( data.notification_settings.includes('Alert at Iqamah time') ){
          setAlertIqamah(true)
        }else{
          setAlertIqamah(false)
        }
        if( data.notification_settings.includes('Mute')){
          setMute(true)
        }else{
          setMute(false)
        }
    }
    if( error ){
      console.log(error)
    }
  }

  const onPressOption = async (salahOption : string) => {
    const { data , error } = await supabase.from('prayer_notification_settings').select('*').eq('user_id', session?.user.id).eq('prayer', salah.toLowerCase()).single()
    const alertArray = data.notification_settings
    if( salahOption == 'Mute' ){
      if( alertArray.includes('Mute') ){
        const { error } = await supabase.from('prayer_notification_settings').update({ notification_settings : ['Alert at Athan time'] }).eq('user_id', session?.user.id).eq('prayer', salah.toLowerCase())
      }else{
        const { error } = await supabase.from('prayer_notification_settings').update({ notification_settings : ['Mute'] }).eq('user_id', session?.user.id).eq('prayer', salah.toLowerCase())
        showToast(salahOption, salah, '')
      }
    }
    if( salahOption == 'Alert at Athan time' ){
        if( alertArray.includes(salahOption) ){
          const filterOutSetting = alertArray.filter(setting => setting != salahOption)
          const { error } = await supabase.from('prayer_notification_settings').update({ notification_settings : filterOutSetting }).eq('user_id', session?.user.id).eq('prayer', salah.toLowerCase())
          const { error : scheduleError } = await supabase.from('prayer_notification_schedule').delete().eq('user_id', session?.user.id).eq('prayer', salah.toLowerCase()).eq('notification_type', salahOption)
        }
        else{
          alertArray.push(salahOption)
          const checkForMute = alertArray.filter(setting => setting != 'Mute')
          const { error } = await supabase.from('prayer_notification_settings').update({ notification_settings : checkForMute }).eq('user_id', session?.user.id).eq('prayer', salah.toLowerCase())
          const currentTime = new Date()
          const PrayerTime = setTimeToCurrentDate(athan)
          if( isBefore(currentTime, PrayerTime) ){
            const { data : UserPushToken, error } = await supabase.from('profiles').select('push_notification_token').eq('id', session?.user.id).single()
            if( UserPushToken && UserPushToken.push_notification_token ){
            const { error } = await supabase.from('prayer_notification_schedule').insert({ user_id : session?.user.id, notification_time : PrayerTime, prayer : salah.toLowerCase(), message : `Time to pray ${salah}`, push_notification_token : UserPushToken.push_notification_token, notification_type : 'Alert at Athan time'})
            }          
          }
          
          showToast(salahOption, salah, athan)
        }
    }else if( salahOption == 'Alert 30 mins before next prayer' ){
      console.log( athan, iqamah )
      if( alertArray.includes(salahOption) ){
        const filterOutSetting = alertArray.filter(setting => setting != salahOption)
        const { error } = await supabase.from('prayer_notification_settings').update({ notification_settings : filterOutSetting }).eq('user_id', session?.user.id).eq('prayer', salah.toLowerCase())
        const { error : scheduleError } = await supabase.from('prayer_notification_schedule').delete().eq('user_id', session?.user.id).eq('prayer', salah.toLowerCase()).eq('notification_type', salahOption)
      }
      else{
        alertArray.push(salahOption)
        const checkForMute = alertArray.filter(setting => setting != 'Mute')
        const { error } = await supabase.from('prayer_notification_settings').update({ notification_settings : checkForMute }).eq('user_id', session?.user.id).eq('prayer', salah.toLowerCase())
        const currentTime = new Date()
        const PrayerTime = setTimeToCurrentDate(athan)
        console.log(PrayerTime)
        if( isBefore(currentTime, PrayerTime) ){
          const { data : UserPushToken, error } = await supabase.from('profiles').select('push_notification_token').eq('id', session?.user.id).single()
          if( UserPushToken && UserPushToken.push_notification_token ){
          PrayerTime.setMinutes(PrayerTime.getMinutes() - 30)
          const { error } = await supabase.from('prayer_notification_schedule').insert({ user_id : session?.user.id, notification_time : PrayerTime, prayer : salah.toLowerCase(), message : `Time to pray ${salah}`, push_notification_token : UserPushToken.push_notification_token, notification_type : 'Alert 30mins before next prayer'})
          }          
        }
        const time = format(PrayerTime, 'p')
        showToast(salahOption, salah, time)
      }
    }else if( salahOption == 'Alert at Iqamah time'){
      if( alertArray.includes(salahOption) ){
        const filterOutSetting = alertArray.filter(setting => setting != salahOption)
        const { error } = await supabase.from('prayer_notification_settings').update({ notification_settings : filterOutSetting }).eq('user_id', session?.user.id).eq('prayer', salah.toLowerCase())
        const { error : scheduleError } = await supabase.from('prayer_notification_schedule').delete().eq('user_id', session?.user.id).eq('prayer', salah.toLowerCase()).eq('notification_type', salahOption)
      }
      else{
        alertArray.push(salahOption)
        const checkForMute = alertArray.filter(setting => setting != 'Mute')
        const { error } = await supabase.from('prayer_notification_settings').update({ notification_settings : checkForMute }).eq('user_id', session?.user.id).eq('prayer', salah.toLowerCase())
        const currentTime = new Date()
        const PrayerTime = setTimeToCurrentDate(athan)
        if( isBefore(currentTime, PrayerTime) ){
          const { data : UserPushToken, error } = await supabase.from('profiles').select('push_notification_token').eq('id', session?.user.id).single()
          if( UserPushToken && UserPushToken.push_notification_token ){
          const { error } = await supabase.from('prayer_notification_schedule').insert({ user_id : session?.user.id, notification_time : PrayerTime, prayer : salah.toLowerCase(), message : `Time to pray ${salah}`, push_notification_token : UserPushToken.push_notification_token, notification_type : 'Alert at Iqamah time'})
          }          
        }
        showToast(salahOption, salah, iqamah)
      }
    }
    getUserSetting()
  }
  const showToast = (message: string, prayer : string, time : string) => {
    Toast.show({
      type: 'ConfirmNotificationOption',
      props : { message, prayer, time },
      visibilityTime: 3000,
      topOffset : 60
    });
  };
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
      (payload) => getUserSetting()
    ).subscribe()

    return () => { supabase.removeChannel(listenForSettings) }
  }, [])
  return (
    <TouchableOpacity className='flex-row items-center justify-center' onPress={() => setBellClick(true)}>
      <Menu>
        <MenuTrigger style={{ flexDirection : 'row', alignItems : 'center', justifyContent : 'center'}}>
            <Icon
          source="bell" 
          color="grey"
          size={11.5}
          />
          <Text className='font-bold text-[#0D509D] text-lg pl-2'>{salah}</Text>
        </MenuTrigger>
        <MenuOptions optionsContainerStyle={{ borderRadius : 10, width : 250, paddingVertical : 3 }}>
         <MenuOption onSelect={async () => await onPressOption('Alert at Athan time')} style={{ flexDirection : 'row' }}>
          {alertAthan ? <Icon source={'checkbox-blank-circle'} size={15} color='black'/> : <Icon source={'checkbox-blank-circle-outline'} size={15} color='black'/> }
          <Text className='ml-[20%]'>Alert at Athan time</Text>
         </MenuOption>
         <MenuOption onSelect={async () => await onPressOption('Alert 30 mins before next prayer')} style={{ flexDirection : 'row' }}>
            {alert30Before? <Icon source={'checkbox-blank-circle'} size={15} color='black'/> : <Icon source={'checkbox-blank-circle-outline'} size={15} color='black'/> }
            <Text className='ml-3' numberOfLines={1} adjustsFontSizeToFit>Alert 30 mins before next prayer</Text>
         </MenuOption>
         <MenuOption onSelect={async() => await onPressOption('Alert at Iqamah time')} style={{ flexDirection : 'row' }}>
            {alertIqamah ? <Icon source={'checkbox-blank-circle'} size={15} color='black'/> : <Icon source={'checkbox-blank-circle-outline'} size={15} color='black'/> }
            <Text className='ml-3' numberOfLines={1} adjustsFontSizeToFit>Alert at Iqamah time</Text>
         </MenuOption>
         <MenuOption onSelect={async () => await onPressOption('Mute')}  style={{ flexDirection : 'row' }}>
            {mute ? <Icon source={'checkbox-blank-circle'} size={15} color='black'/> : <Icon source={'checkbox-blank-circle-outline'} size={15} color='black'/> }
            <Text className='text-red-800 ml-[35%]'>Mute</Text>
         </MenuOption>
        </MenuOptions>
      </Menu>
    </TouchableOpacity>
  )
}
