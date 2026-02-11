import { View, Text, FlatList, Dimensions, useWindowDimensions, ScrollView, Image, Pressable  } from 'react-native';
import Animated, { runOnJS } from 'react-native-reanimated';
import React, {useRef, useState, useEffect, useCallback }from 'react';
import { Program } from '../types';
import ProgramsCircularCarouselCard from './programsCircularCarouselCard';
import { useAuth } from '../providers/AuthProvider';
import SignInAnonModal from './SignInAnonModal';
import { useCurrentPrograms } from '../hooks/usePrograms';
import { useSharedValue } from "react-native-reanimated";
import Carousel from "react-native-reanimated-carousel";
export default function ProgramsCircularCarousel(  ) {
    const { session } = useAuth()
    const { data: programsData } = useCurrentPrograms()
    const [scrollX, setScrollX] = useState(0);
    const [ anonStatus, setAnonStatus ] = useState(true)
    const [ canPressFlyers, setCanPressFlyers ] = useState(false)
    const [ visible, setVisible ] = useState(false)
    const windowWidth = Dimensions.get("window").width;
    const flatListRef = useRef<FlatList>(null);
    const [active, setActive] = useState(0);
    const indexRef = useRef(active);
    indexRef.current = active;

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
      checkIfAnon()
    }, [session])
    
    // Auto-scroll effect - FIXED: Added dependency array to prevent interval recreation on every render
    useEffect(() => {
      if (programsData && programsData.length > 0) {
        const interval = setInterval(() => {
          setActive(currentActive => {
            const endOfListValue = programsData.length;
            if (currentActive < endOfListValue - 1) {
              flatListRef.current?.scrollToIndex({
                index: currentActive + 1,
                animated: true,
                viewOffset: -7,
              });
              return currentActive + 1;
            } else {
              // Smooth transition back to beginning using scrollToOffset
              flatListRef.current?.scrollToOffset({
                offset: 0,
                animated: true,
              });
              return 0;
            }
          });
        }, 5000);

        return () => clearInterval(interval);
      }
    }, [programsData?.length]);
  
  
    const SPACEING = windowWidth * 0.02;
    const listItemWidth = windowWidth * 0.6;
    const endOfList = programsData?.length;
    const SIDE_CARD_LENGTH = (windowWidth * 0.25) / 2;

    // Memoized getItemLayout
    const getItemLayout = useCallback((data: any, index: number) => ({
      length: listItemWidth,
      offset: listItemWidth * index,
      index: index
    }), [listItemWidth]);

    // Memoized handleScroll
    const handleScroll = useCallback((event: any) => {
      const scrollPosition = event.nativeEvent.contentOffset.x;
      const index = scrollPosition / listItemWidth;
      setActive(index);
      setScrollX(scrollPosition);
    }, [listItemWidth]);

    // Memoized keyExtractor
    const keyExtractor = useCallback((item: Program) => item.program_id, []);

    // Memoized renderItem
    const renderItem = useCallback(({ item, index }: { item: Program; index: number }) => (
      <ProgramsCircularCarouselCard
        scrollX={scrollX}
        listItemWidth={listItemWidth}
        program={item}
        index={index}
        itemSpacer={SIDE_CARD_LENGTH}
        spacing={SPACEING}
        lastIndex={endOfList}
        disabled={canPressFlyers}
      />
    ), [scrollX, listItemWidth, SIDE_CARD_LENGTH, SPACEING, endOfList, canPressFlyers]);
  
  
  const progress = useSharedValue<number>(0);

  return (
    
    <View
			// dataSet={{ kind: "basic-layouts", name: "parallax" }}
    >
    <View className='' style={{height: 300, position: 'relative'}}
    id='carousel-component'
    >
      {/* <Pressable onPress={SignInModalCheck}> */}
        {/* <Animated.FlatList
                  data={programsData}
                  renderItem={renderItem}
                  keyExtractor={keyExtractor}
                  horizontal
                  onScroll={handleScroll}
                  snapToInterval={listItemWidth + (SPACEING * 1.5)}
                  scrollEventThrottle={16}
                  decelerationRate={0.6}
                  disableIntervalMomentum={true}
                  disableScrollViewPanResponder={true}
                  snapToAlignment="start"
                  showsHorizontalScrollIndicator={false}
                  getItemLayout={getItemLayout}
                  ref={flatListRef}
                  // Performance optimizations
                  initialNumToRender={3}
                  maxToRenderPerBatch={2}
                  windowSize={5}
        /> */}
        <Carousel
				width={windowWidth}
				height={258}
				autoPlay={true}
				autoPlayInterval={2000}
				data={programsData}
				loop={true}
				pagingEnabled={true}
				snapEnabled={true}
				mode="parallax"
				modeConfig={{
					parallaxScrollingScale: 0.9,
					parallaxScrollingOffset: 165,
				}}
				onProgressChange={progress}
				renderItem={renderItem}
			/>


       {/* </Pressable> */}
    </View>
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