import { View, Text, FlatList, Dimensions, useWindowDimensions, ScrollView, Image, Pressable  } from 'react-native';
import Animated, { runOnJS } from 'react-native-reanimated';
import React, {useRef, useState, useEffect, useCallback }from 'react';
import { Program } from '../types';
import ProgramsCircularCarouselCard from './programsCircularCarouselCard';
import { supabase } from '../lib/supabase';
import { ActivityIndicator } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../providers/AuthProvider';
import SignInAnonModal from './SignInAnonModal';
import moment from 'moment';
type ProgramsCircularProp = {
  sideCardLength : number,
  spaceing : number,
  cardLength : number
}

export default function ProgramsCircularCarousel(  ) {
    const { session } = useAuth()
    const [scrollX, setScrollX] = useState(0);
    const [ anonStatus, setAnonStatus ] = useState(true)
    const [ canPressFlyers, setCanPressFlyers ] = useState(false)
    const [ visible, setVisible ] = useState(false)
    const windowWidth = Dimensions.get("window").width;
    const flatListRef = useRef<FlatList>(null);
    const [active, setActive] = useState(0);
    const [ programsData, setProgramsData ] = useState<Program[]>()
    const indexRef = useRef(active);
    indexRef.current = active;


    const fetchProgramsData = async () => {
      const currDate = new Date().toISOString()
      
      const { data, error } = await supabase.from("programs").select("*").range(0, 7).gte('program_end_date', currDate)
      if( error ){
        console.log(error)
      }
      if( data ){
        setProgramsData(data)
      }
    }
    const checkIfAnon = async () => {
      if( session?.user.is_anonymous ){
        setAnonStatus(true)
      }
      else{
        setAnonStatus(false)
        setCanPressFlyers(true)
      }
    }
    const SignInModalCheck = () => {
      if( anonStatus ){
        setVisible(true)
      }else{
        return
      }
    }
   

    useEffect(() => {
      fetchProgramsData()
      checkIfAnon()
      const listenforprograms = supabase
      .channel('listen for programs change')
      .on(
        'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: "programs",
      },
      async (payload) => await fetchProgramsData()
      )
      .subscribe()
  
      return () => { supabase.removeChannel( listenforprograms )}
    }, [session])
    
     useEffect(() => {
      if( programsData && programsData?.length > 0){
      let interval =  setInterval(() =>{
        if (active < Number(endOfList) - 1) {
          flatListRef.current?.scrollToIndex({
            index : active + 1,
            animated : true,
            viewOffset : -7,
            
          })
          setActive(active + 1);
      } else {
        flatListRef.current?.scrollToIndex({
          index : 0,
          animated : true
        })
      }
      }, 5000);
      
      return () => clearInterval(interval);
    }
    });
  
  
    const getItemLayout = (data : any,index : any) => ({
      length : listItemWidth,
      offset : listItemWidth * index,
      index : index
    })
  
  const handleScroll = (event : any) =>{
    const scrollPositon = event.nativeEvent.contentOffset.x;
    const index = scrollPositon / listItemWidth;
    setActive(index)
  }
  0
    const SPACEING = windowWidth * 0.02;
    const listItemWidth = windowWidth * 0.6;
    const endOfList = programsData?.length;
    const SIDE_CARD_LENGTH = (windowWidth * 0.25) / 2;
  

  return (
    
    <View>
    <Animated.View className='' style={{height: 300}}>
      <Pressable onPress={SignInModalCheck}>
        <Animated.FlatList 
                  data={programsData}
                  renderItem={({item, index}) =>  <ProgramsCircularCarouselCard scrollX={scrollX} listItemWidth={listItemWidth} program={item} index={index} itemSpacer={SIDE_CARD_LENGTH} spacing={SPACEING} lastIndex={endOfList} disabled={canPressFlyers}/>}
                  horizontal
                  onScroll={(event) =>{
                    handleScroll(event);
                    setScrollX(event.nativeEvent.contentOffset.x);
                  }}
                  snapToInterval={listItemWidth + (SPACEING * 1.5)}
                  scrollEventThrottle={16}
                  decelerationRate={0.6}
                  disableIntervalMomentum={true}
                  disableScrollViewPanResponder={true}
                  snapToAlignment={"start"}
                  showsHorizontalScrollIndicator={false}
                  getItemLayout={getItemLayout}
                  ref={flatListRef}
        />
       </Pressable>
    </Animated.View>
    <SignInAnonModal visible={visible} setVisible={() => setVisible(false)} />
    </View>

  )
}

{
  /*

  useEffect(() => {
    let interval =  setInterval(() =>{
      if (active < Number(endOfList) - 1) {
        flatListRef.current?.scrollToIndex({
          index : active + 1,
          animated : true
        })
        setActive(active + 1);
    } else {
      flatListRef.current?.scrollToIndex({
        index : 0,
        animated : true
      })
    }
    }, 5000);

    return () => clearInterval(interval);
  });


  const getItemLayout = (data : any,index : any) => ({
    length : listItemWidth,
    offset : listItemWidth * index,
    index : index
  })

const handleScroll = (event : any) =>{
  const scrollPositon = event.nativeEvent.contentOffset.x;
  const index = scrollPositon / listItemWidth;
  setActive(index)
}


    const SPACEING = windowWidth * 0.02;
    const listItemWidth = windowWidth * 0.6;
    const SPACER_ITEM_SIZE = (windowWidth - listItemWidth) / 2;
    const endOfList = programsData?.length;
    const SIDE_CARD_LENGTH = (windowWidth * 0.18) / 2;



      <View>
    <Animated.View className='' style={{height: 300}}>
      <Animated.FlatList 
                data={programsData}
                renderItem={({item, index}) =>  <ProgramsCircularCarouselCard scrollX={scrollX} listItemWidth={listItemWidth} program={item} index={index} itemSpacer={SIDE_CARD_LENGTH} spacing={SPACEING} lastIndex={endOfList}/>}
                horizontal
                onScroll={(event) =>{
                  handleScroll(event),
                  setScrollX(event.nativeEvent.contentOffset.x)
                }}
                scrollEventThrottle={16}
                decelerationRate={0.6}
                snapToInterval={listItemWidth + (SPACEING * 3.3)}
                disableIntervalMomentum={true}
                disableScrollViewPanResponder={true}
                snapToAlignment={"center"}
                showsHorizontalScrollIndicator={false}
                getItemLayout={getItemLayout}
                ref={flatListRef}
       />
       
    </Animated.View>
    </View>

    */
}