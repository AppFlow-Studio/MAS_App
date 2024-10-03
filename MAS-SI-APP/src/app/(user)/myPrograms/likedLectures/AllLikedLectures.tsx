import { View, Text, FlatList, useWindowDimensions } from 'react-native'
import React, { useState, useEffect } from 'react'
import { supabase } from '@/src/lib/supabase'
import { useAuth } from '@/src/providers/AuthProvider'
import { EventLectureType, Lectures } from '@/src/types'
import { Stack } from 'expo-router'
import RenderLikedLectures from '@/src/components/UserProgramComponets/RenderLikedLectures'
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import RenderLikedEventLectures from '@/src/components/UserProgramComponets/RenderLikedEventLectures'
type likedProgramLectureProp ={
  likedLecture : Lectures[] | undefined
}
const AllLikedProgramLectures = ({ likedLecture} : likedProgramLectureProp) => { 
  return (
    <View className='bg-white h-[100%]'>
      <FlatList 
        data={likedLecture}
        renderItem={({item, index}) => <RenderLikedLectures lecture={item} index={index} speaker={item.lecture_speaker}/>}
      />
    </View>
  )
}

type likedEventLectureProp = {
  likedEventLecture : EventLectureType[] | undefined
}
const AllLikedEventLectures = ({ likedEventLecture } : likedEventLectureProp) => {
  
  return(
    <View>
       <View className='bg-white h-[100%]'>
        <FlatList 
          data={likedEventLecture}
          renderItem={({item, index}) => <RenderLikedEventLectures lecture={item} index={index} speaker={item.event_lecture_speaker}/>}
        />
      </View>
    </View>
  )
  }
const AllLikedLectures = () => {
  const { session } = useAuth()
  const [ likedLecture, setLikedLectures ] = useState<Lectures[]>()
  const [ likedEventLecture, setLikedEventLectures ] = useState<EventLectureType[]>()

  async function fetchLikedEventLectures(){
    const { data, error } = await supabase.from("liked_event_lectures").select("event_lecture_id").eq("user_id", session?.user.id)
    if( error ){
        console.log(error)
    }
    
  if (data) {
    
    // Create an array of promises to fetch lecture info
    const lecturePromises = data.map(async (lecture) => {
      const { data: lectureInfo, error: lectureError } = await supabase
        .from("events_lectures")
        .select("*")
        .eq("event_lecture_id", lecture.event_lecture_id)
        .single();

      console.log(lectureInfo)
      if (lectureError) {
        console.log("Error fetching lecture info:", lectureError);
        return null; // Return null if there's an error
      }

      return lectureInfo;
    });

    // Wait for all the promises to resolve
    const lectures = await Promise.all(lecturePromises);
    setLikedEventLectures(lectures)
  }
}
  async function fetchLikedLectures(){
    const { data, error } = await supabase.from("liked_lectures").select("lecture_id").eq("user_id", session?.user.id)
    if( error ){
        console.log(error)
    }
    
  if (data) {
    // Create an array of promises to fetch lecture info
    const lecturePromises = data.map(async (lecture) => {
      const { data: lectureInfo, error: lectureError } = await supabase
        .from("program_lectures")
        .select("*")
        .eq("lecture_id", lecture.lecture_id)
        .single();

      if (lectureError) {
        console.log("Error fetching lecture info:", lectureError);
        return null; // Return null if there's an error
      }

      return lectureInfo;
    });

    // Wait for all the promises to resolve
    const lectures = await Promise.all(lecturePromises);
    setLikedLectures(lectures)
  }
  }




  useEffect(() => {
    fetchLikedLectures()
    fetchLikedEventLectures()
    const listenForLikedProgram = supabase.channel("listen for liked program lec").on(
      "postgres_changes",
      {
        event : "*",
        schema : "public",
        table : "liked_lectures",
        filter: `user_id=eq.${session?.user.id}`
      },
      (payload) => fetchLikedLectures()
    ).subscribe()

    const listenForLikedEvent= supabase.channel("listen for liked event lec").on(
      "postgres_changes",
      {
        event : "*",
        schema : "public",
        table : "liked_event_lectures",
        filter: `user_id=eq.${session?.user.id}`
      },
      (payload) => fetchLikedEventLectures()
    ).subscribe()


    return () => { supabase.removeChannel(listenForLikedProgram); supabase.removeChannel(listenForLikedEvent)}
  }, [])

  const layout = useWindowDimensions()

  const renderScene = ({ route } : any) => {
    switch( route.key ){
      case "first":
        return <AllLikedProgramLectures likedLecture={likedLecture} />
      case "second" :
        return <AllLikedEventLectures likedEventLecture={likedEventLecture} />
    }
  }

  const [ index, setIndex ] = useState(0)

  const [ routes ] = useState([
    {key : "first", title : "Program Lectures"},
    {key : "second", title : "Event Lectures"},
  ])

  const renderTabBar = (props : any) => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: 'white' }}
      style={{ backgroundColor: '#0D509D', }}
      
    />
  );

  return (
    <>
    <Stack.Screen options={{ title : 'Liked Lectures', headerTintColor : '#007AFF' , headerTitleStyle: { color : 'black'}, headerStyle : {backgroundColor : 'white',}}}/>
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{ width: layout.width }}
      renderTabBar={renderTabBar}
    />
    </>
  )
}
export default AllLikedLectures