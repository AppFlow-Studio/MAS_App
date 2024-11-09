import { View, Text, useWindowDimensions, ScrollView, FlatList } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import React, { useState, useCallback, useEffect } from 'react';
import { useProgram } from '@/src/providers/programProvider';
import YoutubePlayer from "react-native-youtube-iframe"
import { EventLectureType, Lectures } from '@/src/types';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { useAuth } from "@/src/providers/AuthProvider"
import { supabase } from '@/src/lib/supabase';
import { setDate } from 'date-fns';
import LectureKeyNotesCard from '@/src/components/LectureKeyNotesCard';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
const EventsLectureID = () => {
    const { session } = useAuth()
    const [ playing, setPlaying ] = useState(false)
    const { events_lecture_id } = useLocalSearchParams();
    const [ currentLecture, setLecture ] = useState<EventLectureType>()
    const layout  = useWindowDimensions().width
    const [index, setIndex] = useState(0)
    const layoutHeight = useWindowDimensions().height
    const KEYNOTECARDHEIGHT = layoutHeight / 4
    const KEYNOTECARDWIDTH = layout * 0.85
    const tabBarHeight = useBottomTabBarHeight() + 60

    async function getLecture(){
      const { data, error } = await supabase.from("events_lectures").select("*").eq("event_lecture_id", events_lecture_id).single()
      if( error ){
        console.log("event id", error)
      }
      if(data){
        setLecture(data)
      }
    }
    
    useEffect(() => {
      getLecture()
    },[session])
  
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
              <Text className='font-bold text-black text-2xl text-center'>{currentLecture?.event_lecture_name}</Text>
              <Text className='font-bold text-gray-400'>{currentLecture?.event_lecture_speaker}</Text>
            </View>
            {array ? array.map((item,index) => {
              return (
                <>
                <LectureKeyNotesCard height={KEYNOTECARDHEIGHT} width={KEYNOTECARDWIDTH} index={index}  scrollY={scrollY} />
                <View style={{ height : 20 }}/> 
                </>             
              )
            }) : <></>}

          </ScrollView>
        { /* <View className='h-[75%] border'>
            <FlatList 
            data={[1,2,3,4,5]}
            renderItem={({item, index}) => <LectureKeyNotesCard height={KEYNOTECARDHEIGHT} width={KEYNOTECARDWIDTH} index={index}  scrollY={scrollY}/>}
            onScroll={(event) => {handleScroll(event); setScrollY(event.nativeEvent.contentOffset.y)}}
            ItemSeparatorComponent={() => <View style={{ height : 20 }}/>}
            getItemLayout={( data, index ) =>( {
              length : KEYNOTECARDHEIGHT  + 20,
              offset : KEYNOTECARDHEIGHT + 20 * index, 
              index
            })}
            scrollEventThrottle={16}
            disableIntervalMomentum={true}
            snapToInterval={KEYNOTECARDHEIGHT + (20 * 0.2)}
            decelerationRate={0.6}
            />
          </View> */}
      </View>
      )
    }
    const LectureAISummay = () => {
      return(
        <ScrollView className='flex-1' contentContainerStyle={{ alignItems : "center",  backgroundColor : "#ededed"}}>
        <View className='flex-col items-center mt-3'>
            <Text className='font-bold text-black text-2xl text-center'>{currentLecture?.event_lecture_name}</Text>
            <Text className='font-bold text-gray-400'>{currentLecture?.event_lecture_speaker}</Text>
        </View>
        <View className='h-[350] w-[85%] mt-2'>
          <ScrollView className=' bg-white' style={{ borderRadius : 10 }} contentContainerStyle={{ paddingHorizontal : 8, paddingVertical : 5}}>
            <Text>{currentLecture?.event_lecture_desc}</Text>
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
    const [loading, setLoading] = useState(true);
    const opacity = useSharedValue(1);
  
    const playMASAnimation = useAnimatedStyle(() => {
      return {
        opacity: opacity.value,
      };
    });
  
    const handleAnimationEnd = () => {
      setLoading(false);
    };
  
    const fadeOutAnimation = () => {
      opacity.value = withTiming(0, { duration: 1000, easing: Easing.out(Easing.quad) }, () => {
        runOnJS(handleAnimationEnd)();
      });
    }
  
    return(
      <View className='flex-1 bg-[#ededed]'>
          <Stack.Screen options={{ title : currentLecture?.event_lecture_name, headerTintColor : '#007AFF' , headerTitleStyle: { color : 'black'}, headerStyle : {backgroundColor : 'white'} }} />
          <YoutubePlayer 
            height={layoutHeight / 4}
            width={layout * 0.98}
            webViewStyle={{ borderRadius : 20, marginLeft : '2%', marginTop : 8, backgroundColor : "#ededed" }}
            play={playing}
            videoId={currentLecture?.event_lecture_link}
            onChangeState={onStateChange}
          />
          <View className='mt-[5]'/>
          { loading && (
            <Animated.View style={[{ zIndex: 1, position: 'absolute', width: '100%', height: '100%', justifyContent : 'flex-end' }, playMASAnimation]}>
              <LottieView
                autoPlay
                loop={false}
                style={{
                  width: '100%',
                  height: '75%',
                  backgroundColor: 'white',
                }}
                source={require('@/assets/lottie/checker.json')}
                onAnimationFinish={() => {
                  fadeOutAnimation();
                }}
              />
            </Animated.View>
          ) }
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: layout }}
          renderTabBar={renderTabBar}
          style={{  backgroundColor : "#ededed" }}
        />
      
      </View>
    )
}

export default EventsLectureID