import React, { useState } from 'react';
import { Button, StyleSheet, View, Image, Pressable, Text, Linking } from 'react-native';
import Animated, {
  clamp,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import X from '@/src/components/Icons/X';
import WhatsApp from '@/src/components/Icons/Whatsapp';
import Instagram from '@/src/components/Icons/Instagram';
import TikTok from '@/src/components/Icons/Tiktok';
import Meta from '@/src/components/Icons/Meta';
import YouTube from '@/src/components/Icons/Youtube';
const MeasureElement = ({ onLayout, children }) => (
  <Animated.ScrollView
    horizontal
    style={marqueeStyles.hidden}
    pointerEvents="box-none">
    <View onLayout={(ev) => onLayout(ev.nativeEvent.layout.width)}>
      {children}
    </View>
  </Animated.ScrollView>
);

const TranslatedElement = ({ index, children, offset, childrenWidth }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      left: (index - 1) * childrenWidth,
      transform: [
        {
          translateX: -offset.value,
        },
      ],
    };
  });
  return (
    <Animated.View style={[styles.animatedStyle, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

const getIndicesArray = (length) => Array.from({ length }, (_, i) => i);

const Cloner = ({ count, renderChild }) => (
  <>{getIndicesArray(count).map(renderChild)}</>
);    

const ChildrenScroller = ({
  duration,
  childrenWidth,
  parentWidth,
  reverse,
  children,
}) => {
  const offset = useSharedValue(0);
  const coeff = useSharedValue(reverse ? 1 : -1);
  const isPanning = useSharedValue(false);
  const prevTranslationX = useSharedValue(0);

  const panGesture = Gesture.Pan()
  .minDistance(1)
  .onStart(() => {
    isPanning.value = true;
    prevTranslationX.value = offset.value;
  })
  .onUpdate((event) => {
    offset.value = prevTranslationX.value - event.translationX 
  })
  .onEnd((e)=> {
    isPanning.value = false;
  })

  React.useEffect(() => {
    coeff.value = reverse ? 1 : -1;
  }, [reverse]);

  useFrameCallback((i) => {
    // prettier-ignore
    if (!isPanning.value) {
      offset.value += (coeff.value * ((i.timeSincePreviousFrame ?? 1) * childrenWidth)) / duration;
      offset.value = offset.value % childrenWidth;
    }
    
  }, true);

  const count = Math.round(parentWidth / childrenWidth) + 2;
  const renderChild = (index) => (
    <TranslatedElement
      key={`clone-${index}`}
      index={index}
      offset={offset}
      childrenWidth={childrenWidth}>
      {children}
    </TranslatedElement>
  );

  return (
   <GestureDetector gesture={panGesture}>
      <Animated.View style={{ width : parentWidth * .9 }}>
        <Cloner count={count} renderChild={renderChild} />
      </Animated.View>
   </GestureDetector>
  );
};

export const Marquee = ({ duration = 30000, reverse = false, children, style }) => {
  const [parentWidth, setParentWidth] = React.useState(0);
  const [childrenWidth, setChildrenWidth] = React.useState(0);

  return (
    <View
      style={style}
      onLayout={(ev) => {
        setParentWidth(ev.nativeEvent.layout.width);
      }}
      pointerEvents="box-none">
      <View style={marqueeStyles.row} pointerEvents="box-none">
        <MeasureElement onLayout={setChildrenWidth}>{children}</MeasureElement>

        {childrenWidth > 0 && parentWidth > 0 && (
          <ChildrenScroller
            duration={duration}
            parentWidth={parentWidth}
            childrenWidth={childrenWidth}
            reverse={reverse}>
            {children}
          </ChildrenScroller>
        )}
      </View>
    </View>
  );
};

const marqueeStyles = StyleSheet.create({
  hidden: { opacity: 0, zIndex: -1 },
  row: { flexDirection: 'row', overflow: 'hidden' },
});

function IconsMarquee() {
  const [reverse, setReverse] = useState(false);
  const MasjidPlatforms : { platform : any, link : string, name : string, bg: string }[]= [
    { platform : <TikTok />, link : 'https://www.tiktok.com/@masnewyork', name : 'TikTok', bg : 'white' },
    { platform : <YouTube />, link : 'https://www.youtube.com/@massicenter/featured', name : 'YouTube', bg : '#FFF' },
    { platform : <WhatsApp />, link: 'https://chat.whatsapp.com/EBSOqkjWKeQ4rbJ7x1Vib7', name : 'WhatsApp', bg : '#00E676' },
    { platform : <Meta />, link : 'https://www.facebook.com/MASSICenter' , name : 'Meta', bg : 'white'},
    { platform : <X />, link : 'https://x.com/massicenter', name : 'X' , bg : '#000'},
    { platform : <Instagram />, link : 'https://www.instagram.com/massicenter', name : 'Instagram' , bg : 'black'},
]
  return (
    <View style={styles.container} className='pb-12 mt-4'>
      <View style={styles.safeArea}>
        <Marquee reverse={reverse} style={{  }}>
          <View className='flex flex-row gap-8'>
            {
                MasjidPlatforms.map((item, index) => {
                    const onPress = () => Linking.canOpenURL(item.link).then(() => {
                         Linking.openURL(item.link);
                    });
                    return (
                    <Pressable className='flex-col flex' onPress={onPress} style={{ left : index == 0 ? 30 : 0, marginRight : index == 0 ? 30 : 0}}>
                        <View
                        className=' w-[60] h-[60] rounded-full items-center  justify-center p-2 bg-gradient-to-br from-[#7D09FF] via-[#FF3E09] to-[#B9244E] '
                        style={{ backgroundColor : item.bg, shadowColor : 'gray', shadowOffset : { width : 0, height : 5 }, shadowOpacity : 1, shadowRadius : 3, elevation : 8 }}
                        >
                        {item.platform}
                        </View>
                        <Text className='text-gray-400 text-sm text-center mt-1'>{item.name}</Text>
                    </Pressable>
                )})
            }
          </View>
        </Marquee>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  horseImage: {
    width: 140,
    height: 80,
    marginRight: 80,
  },
  container: {
    flex: 1,
  },
  safeArea: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  animatedStyle: {
    position: 'absolute',
  },
  circle: {
    marginTop: 4,
    borderRadius: 100,
    height: 120,
    width: 160,
    backgroundColor: '#b58df1',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default IconsMarquee;