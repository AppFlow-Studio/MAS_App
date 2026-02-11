import { View, Text, TouchableOpacity, useWindowDimensions, Pressable, Image} from 'react-native'
import React, {useRef, useState, useEffect, memo}from 'react';
import { Program } from '../types';
import { Link, useRouter } from 'expo-router';
import Animated, {interpolate, Extrapolation, useSharedValue, useAnimatedStyle, withTiming} from "react-native-reanimated";
import { transform } from '@babel/core';
import { FlyerSkeleton } from './FlyerSkeleton';
type ProgramsCircularCarouselCardProp = {
    program : Program,
    index : number,
    listItemWidth : number,
    itemSpacer : number,
    lastIndex: number | undefined,
    scrollX : number,
    spacing : number
    disabled : boolean
}

// Memoized component to prevent unnecessary re-renders during carousel scrolling
const ProgramsCircularCarouselCard = memo(function ProgramsCircularCarouselCard({ program, index, listItemWidth, scrollX, itemSpacer, spacing, lastIndex, disabled }: ProgramsCircularCarouselCardProp) {
    const {width : windowWidth} = useWindowDimensions();
    const [ imageReady, setImageReady ] = useState(false)
    const scrollXShared = useSharedValue(scrollX);
    const opacity = useSharedValue(0);
    const router = useRouter();

    const inputRange = [
      (index - 1) * listItemWidth,
      index * listItemWidth,
      (index  + 1) * listItemWidth
    ]
  
    // useEffect(() => {
    //   scrollXShared.value = scrollX;
    //   // Fade in when component mounts
    //   opacity.value = withTiming(1, { duration: 500 });
    // }, [scrollX]);

    // const cardStyle = useAnimatedStyle(() =>{
    //   const scale = interpolate(
    //     scrollXShared.value,
    //     inputRange,
    //     [0.6, 1, 0.6],
    //     Extrapolation.CLAMP
    //   );
      
    //   const opacityValue = interpolate(
    //     scrollXShared.value,
    //     inputRange,
    //     [0.3, 1, 0.3],
    //     Extrapolation.CLAMP
    //   );
      
    //   return{
    //     transform : [{scaleY : scale}],
    //     opacity: opacityValue * opacity.value
    //   }
    // })

  if( lastIndex == null ) {
    return
  }
  const handlePress = () => {
    router.push({
      pathname: "/menu/program/upcomingEvents",
      params: { openProgramId: program.program_id }
    } as any);
  };

  //  cardStyle, {marginLeft : index == 0 ? itemSpacer : spacing, marginRight : index == lastIndex - 1 ? itemSpacer : spacing}
  // {width: listItemWidth, marginLeft: spacing, marginRight: spacing},

  // width: listItemWidth 
  return (
    <Animated.View style={[]} className=''>
      <Pressable 
        style={{justifyContent: "center" , alignItems : "center"}} 
        disabled={!disabled}
        onPress={handlePress}
      >
        <View style={{ height: 200, shadowColor: "black", shadowOffset: { width: 0, height: 0},shadowOpacity: 0.6, justifyContent: "center", alignItems: "center", borderRadius: 20, elevation : 8, position : 'relative' }} >
         { !imageReady && 
         <FlyerSkeleton width={listItemWidth} height={200} style={{position : 'absolute', top : 0, zIndex : 2}}/>
         }
         <Image
          source={program.program_img ? { uri: program.program_img } : require("@/assets/images/MASHomeLogo.png")}
          style={{ width: "100%", height: "100%", overflow: "hidden", borderRadius: 20 }}
          resizeMode="cover"
          onLoad={() => setImageReady(true)}
          onError={() => setImageReady(false)}
          /> 
        </View>
          <Text className='text-center mt-3 font-bold' numberOfLines={2} >{program.program_name}</Text>
      </Pressable>
    </Animated.View>
  )
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if critical props change
  return (
    prevProps.index === nextProps.index &&
    prevProps.program.program_id === nextProps.program.program_id &&
    prevProps.listItemWidth === nextProps.listItemWidth &&
    prevProps.disabled === nextProps.disabled &&
    // Allow scrollX changes to still trigger animation updates
    Math.abs(prevProps.scrollX - nextProps.scrollX) < 5
  );
});

ProgramsCircularCarouselCard.displayName = 'ProgramsCircularCarouselCard';

export default ProgramsCircularCarouselCard;