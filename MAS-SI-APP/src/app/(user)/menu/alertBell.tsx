import { View, Text, TouchableOpacity, Modal, Settings } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Icon, MD3Colors, Portal } from 'react-native-paper';
import AlertBellModal from '@/src/components/AlertBellModal';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import Toast from 'react-native-toast-message'
import { useAuth } from '@/src/providers/AuthProvider';
import { supabase } from '@/src/lib/supabase';

type salahProp = {
  salah: string,
}
export default function AlertBell( {salah} : salahProp ) {
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
        showToast(salahOption)
      }
    }
    if( salahOption == 'Alert at Athan time' ){
        if( alertArray.includes(salahOption) ){
          const filterOutSetting = alertArray.filter(setting => setting != salahOption)
          const { error } = await supabase.from('prayer_notification_settings').update({ notification_settings : filterOutSetting }).eq('user_id', session?.user.id).eq('prayer', salah.toLowerCase())
        }
        else{
          alertArray.push(salahOption)
          const checkForMute = alertArray.filter(setting => setting != 'Mute')
          const { error } = await supabase.from('prayer_notification_settings').update({ notification_settings : checkForMute }).eq('user_id', session?.user.id).eq('prayer', salah.toLowerCase())
          showToast(salahOption)
        }
    }else if( salahOption == 'Alert 30 mins before next prayer' ){
      if( alertArray.includes(salahOption) ){
        const filterOutSetting = alertArray.filter(setting => setting != salahOption)
        const { error } = await supabase.from('prayer_notification_settings').update({ notification_settings : filterOutSetting }).eq('user_id', session?.user.id).eq('prayer', salah.toLowerCase())
      }
      else{
        alertArray.push(salahOption)
        const checkForMute = alertArray.filter(setting => setting != 'Mute')
        const { error } = await supabase.from('prayer_notification_settings').update({ notification_settings : checkForMute }).eq('user_id', session?.user.id).eq('prayer', salah.toLowerCase())
        showToast(salahOption)
      }
    }else if( salahOption == 'Alert at Iqamah time'){
      if( alertArray.includes(salahOption) ){
        const filterOutSetting = alertArray.filter(setting => setting != salahOption)
        const { error } = await supabase.from('prayer_notification_settings').update({ notification_settings : filterOutSetting }).eq('user_id', session?.user.id).eq('prayer', salah.toLowerCase())
      }
      else{
        alertArray.push(salahOption)
        const checkForMute = alertArray.filter(setting => setting != 'Mute')
        const { error } = await supabase.from('prayer_notification_settings').update({ notification_settings : checkForMute }).eq('user_id', session?.user.id).eq('prayer', salah.toLowerCase())
        showToast(salahOption)
      }
    }
    getUserSetting()
  }
  const showToast = (message: string) => {
    Toast.show({
      type: 'success',
      text1: message,
      position: 'top',
      topOffset : 50,
      visibilityTime: 2000,
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
      <Icon
      source="bell" 
      color="grey"
      size={11.5}
      />
      <Menu>
        <MenuTrigger>
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
