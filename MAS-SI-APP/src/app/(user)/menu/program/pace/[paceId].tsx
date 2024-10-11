import { Dimensions, Image, StatusBar, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Stack, useLocalSearchParams } from 'expo-router'
import RenderPaceLectures from '@/src/components/PaceComponents/RenderPaceLectures';
import { supabase } from '@/src/lib/supabase';
import { EventsType } from '@/src/types';
import { ActivityIndicator } from 'react-native-paper';
import EventsLectureDisplay from '@/src/components/EventsComponets/EventsLectureDisplay';
import EventInfoDisplay from '@/src/components/EventsComponets/EventInfoDisplay';

const PaceFlyerDetails = () => {
  const { paceId } = useLocalSearchParams()
  const { width } = Dimensions.get("window");
  const [ eventInfoData, setEventInfoData ] = useState<EventsType | null>()
  const [ eventLectures, setEventLectures ] = useState<EventsType>()
  const fetchEventInfo = async () => {
    const { data , error } = await supabase.from("events").select("*").eq("event_id", paceId).single()
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

  return (
    <>
       <Stack.Screen options={{ headerBackTitleVisible : false, title : "", headerStyle : {backgroundColor : "white"} }}/>
       <StatusBar barStyle={"dark-content"}/>
        {eventInfoData?.has_lecture ?  <EventsLectureDisplay event_id={eventInfoData?.event_id} event_img={eventInfoData?.event_img} event_name={eventInfoData?.event_name} event_speaker={eventInfoData?.event_speaker}/> 
      : <EventInfoDisplay event_img={eventInfoData.event_img} event_speaker={eventInfoData.event_speaker} event_name={eventInfoData.event_name} event_desc={eventInfoData.event_desc}/>}
    </>
  )
}

export default PaceFlyerDetails

const styles = StyleSheet.create({})