import { ScrollView, StatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import React, { useCallback, useState } from 'react'
import { Stack } from 'expo-router'
import YoutubePlayer from "react-native-youtube-iframe"
import { SceneMap, TabBar, TabView } from 'react-native-tab-view'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'

const PaceLecture = () => {
  const [ playing, setPlaying ] = useState(false)
  const layout  = useWindowDimensions().width
  const [index, setIndex] = useState(0)
  const layoutHeight = useWindowDimensions().height
  const KEYNOTECARDHEIGHT = layoutHeight / 4
  const KEYNOTECARDWIDTH = layout * 0.85
  const tabBarHeight = useBottomTabBarHeight() + 60

 
  const onStateChange = useCallback((state : any) => {
    if (state === "ended") {
      setPlaying(false);
    }
  }, []);

  const togglePlaying = useCallback(() => {
    setPlaying((prev) => !prev);
  }, []);


  const LectureAIKeyNotes = () => {
    const [ scrollY, setScrollY ] = useState(0)
    const [ active, setActive ] = useState(0)
    const handleScroll = (event : any) =>{
      const scrollPositon = event.nativeEvent.contentOffset.y;
      const index = scrollPositon / KEYNOTECARDHEIGHT + 20;
      setActive(index)
    }
    const array = [1,2,3,4,5]
    return(
      <View className='items-center bg=[#ededed]'>
      
      <View className='mt-2'/>
        <ScrollView 
        onScroll={(event) => {handleScroll(event); setScrollY(event.nativeEvent.contentOffset.y)}} 
        contentContainerStyle={{ alignItems : "center", paddingBottom : tabBarHeight }} 
        decelerationRate={0.6}
        snapToInterval={KEYNOTECARDHEIGHT + (20 * 0.2)}
        showsVerticalScrollIndicator={false}
        >
          <View className='flex-col items-center mt-3'>
            <Text className='font-bold text-black text-2xl text-center'>Pace 1</Text>
            <Text className='font-bold text-gray-400'>Dr.Zakir Naki</Text>
          </View>

        </ScrollView>
    </View>
    )
  }
  const LectureAISummay = () => {
    return(
      <ScrollView className='flex-1' contentContainerStyle={{ alignItems : "center", backgroundColor : "#ededed" }}>
      <View className='flex-col items-center mt-3'>
          <Text className='font-bold text-black text-2xl text-center'>Pace 1</Text>
          <Text className='font-bold text-gray-400'>Dr.Zakir Naki</Text>
      </View>
      <View className='h-[350] w-[85%] mt-2'>
        <ScrollView className=' bg-white' style={{ borderRadius : 10 }} contentContainerStyle={{ paddingHorizontal : 8, paddingVertical : 5}}>
          <Text>Islamic Pace </Text>
        </ScrollView>
      </View>
    </ScrollView>
    )
  }
  
  const renderScene = SceneMap({
    first: LectureAISummay,
    second: LectureAIKeyNotes,
  });
  
  const routes = [
    { key: 'first', title: 'Summary' },
    { key: 'second', title: 'Key Notes' },
  ];
  
  const renderTabBar = (props : any) => (
    <TabBar
    {...props}
    indicatorStyle={{ backgroundColor : "#57BA47", position: "absolute", zIndex : -1, bottom : "5%", height: "90%", width : "40%", left : "5%", borderRadius : 20  }}
    style={{ backgroundColor: '#0D509D', width : "80%", alignSelf : "center", borderRadius : 20}}
    labelStyle={{ color : "white", fontWeight : "bold" }}
    />
  );


  return(
    <>
    <Stack.Screen options={{ headerBackTitleVisible : false, title : "Pace Lecture", headerStyle : {backgroundColor : "white"} }}/>
    <StatusBar barStyle={'dark-content'}/>
      <YoutubePlayer 
        height={layoutHeight / 4}
        width={layout * 0.98}
        webViewStyle={{ borderRadius : 20, marginLeft : '2%', marginTop : 8, backgroundColor : "#ededed" }}
        play={playing}
        videoId={'https://youtu.be/9xwazD5SyVg'}
        onChangeState={onStateChange}
      />
       <View className='mt-[5]'/>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout }}
        renderTabBar={renderTabBar}
        style={{ backgroundColor : "#ededed"}}
      />
  
    </>
  )
}

export default PaceLecture

const styles = StyleSheet.create({})




