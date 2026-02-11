import { View, FlatList, Animated, Text  } from 'react-native';
import { useRef, useState } from 'react';
import ProgramWidget from './programWidget';
import React from 'react';
import programsData from '@/assets/data/programsData';
import Paginator from './paginator';

export default function ProgramWidgetSlider() {
  const scrolly = useRef( new Animated.Value(0) ).current;
  const programRef = useRef(null);

  const viewableItemsChanged = useRef( ({viewableItems} : any)  =>{
      
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold : 50}).current;
  const programsRef = useRef(null);
  return (
      <>
        <FlatList
        data={programsData} 
        renderItem={({item}) => <ProgramWidget program={item}/>}
        pagingEnabled
        horizontal
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={false}
        onScroll={Animated.event( [{ nativeEvent: {contentOffset : {y : scrolly } } }],{
          useNativeDriver: true
        } )}
        scrollEventThrottle={32}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        ref={programRef}
        />
    
      </>
  )
}