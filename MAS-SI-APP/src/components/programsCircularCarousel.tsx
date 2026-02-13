import { View, Text, Dimensions, Pressable } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { Program } from '../types';
import ProgramsCircularCarouselCard from './programsCircularCarouselCard';
import { useAuth } from '../providers/AuthProvider';
import SignInAnonModal from './SignInAnonModal';
import { useCurrentPrograms } from '../hooks/usePrograms';
import { useSharedValue } from "react-native-reanimated";
import Carousel from "react-native-reanimated-carousel";

export default function ProgramsCircularCarousel() {
    const { session } = useAuth()
    const { data: programsData } = useCurrentPrograms()
    const [ anonStatus, setAnonStatus ] = useState(true)
    const [ canPressFlyers, setCanPressFlyers ] = useState(false)
    const [ visible, setVisible ] = useState(false)
    const windowWidth = Dimensions.get("window").width;

    const checkIfAnon = async () => {
      if( session?.user.is_anonymous ){
        setAnonStatus(true)
      }
      else{
        setAnonStatus(false)
        setCanPressFlyers(true)
      }
    }

    useEffect(() => {
      checkIfAnon()
    }, [session])

    const listItemWidth = windowWidth * 0.6;

    const renderItem = useCallback(({ item, index }: { item: Program; index: number }) => (
      <ProgramsCircularCarouselCard
        listItemWidth={listItemWidth}
        program={item}
        index={index}
        disabled={canPressFlyers}
      />
    ), [listItemWidth, canPressFlyers]);

    const progress = useSharedValue<number>(0);

  return (
    <View>
      <View className='' style={{ position: 'relative'}} id='carousel-component'>
        <Carousel
          width={windowWidth}
          height={240}
          autoPlay={true}
          autoPlayInterval={2000}
          data={programsData || []}
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
      </View>
      <SignInAnonModal visible={visible} setVisible={() => setVisible(false)} />
    </View>
  )
}