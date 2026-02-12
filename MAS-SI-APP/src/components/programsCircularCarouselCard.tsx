import { View, Text, Pressable, Image } from 'react-native'
import React, { useState, memo } from 'react';
import { Program } from '../types';
import { useRouter } from 'expo-router';
import Animated from "react-native-reanimated";
import { FlyerSkeleton } from './FlyerSkeleton';

type ProgramsCircularCarouselCardProp = {
    program : Program,
    index : number,
    listItemWidth : number,
    disabled : boolean
}

const ProgramsCircularCarouselCard = memo(function ProgramsCircularCarouselCard({ program, index, listItemWidth, disabled }: ProgramsCircularCarouselCardProp) {
    const [ imageReady, setImageReady ] = useState(false)
    const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: "/menu/program/upcomingEvents",
      params: { openProgramId: program.program_id }
    } as any);
  };

  return (
    <Animated.View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
      <Pressable 
        style={{justifyContent: "center" , alignItems : "center"}} 
        disabled={!disabled}
        onPress={handlePress}
      >
        <View style={{ width: listItemWidth, height: 200, shadowColor: "black", shadowOffset: { width: 0, height: 0},shadowOpacity: 0.6, justifyContent: "center", alignItems: "center", borderRadius: 20, elevation : 8, position : 'relative' }} >
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
  return (
    prevProps.index === nextProps.index &&
    prevProps.program.program_id === nextProps.program.program_id &&
    prevProps.listItemWidth === nextProps.listItemWidth &&
    prevProps.disabled === nextProps.disabled
  );
});

ProgramsCircularCarouselCard.displayName = 'ProgramsCircularCarouselCard';

export default ProgramsCircularCarouselCard;