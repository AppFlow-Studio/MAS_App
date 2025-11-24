import React from 'react';
import { useWindowDimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  interpolate,
  Extrapolation
} from 'react-native-reanimated';

type FadeOnScrollItemProps = {
  children: React.ReactNode;
  index: number;
  scrollX: number;
  itemWidth: number;
  spacing?: number;
};

const FadeOnScrollItem: React.FC<FadeOnScrollItemProps> = ({
  children,
  index,
  scrollX,
  itemWidth,
  spacing = 0,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const scrollXShared = useSharedValue(scrollX);
  const itemSpacing = spacing || 0;
  const totalItemWidth = itemWidth + itemSpacing;

  React.useEffect(() => {
    scrollXShared.value = scrollX;
  }, [scrollX]);

  const animatedStyle = useAnimatedStyle(() => {
    // Calculate the position of this item relative to the screen
    const itemStart = index * totalItemWidth;
    const itemEnd = itemStart + itemWidth;
    
    // Calculate screen edges
    const screenLeft = scrollXShared.value;
    const screenRight = scrollXShared.value + windowWidth;
    
    // Fade zone - starts immediately when touching edge, extends 100px inward for smooth transition
    const fadeZone = 100;
    
    let opacity = 1;
    
    // Fade on left edge - starts fading as soon as item touches left edge
    if (itemEnd <= screenLeft + fadeZone && itemEnd >= screenLeft) {
      opacity = interpolate(
        itemEnd,
        [screenLeft, screenLeft + fadeZone],
        [0, 1],
        Extrapolation.CLAMP
      );
    }
    // Completely hidden if past left edge
    else if (itemEnd < screenLeft) {
      opacity = 0;
    }
    // Fade on right edge - starts fading as soon as item touches right edge
    else if (itemStart >= screenRight - fadeZone && itemStart <= screenRight) {
      opacity = interpolate(
        itemStart,
        [screenRight - fadeZone, screenRight],
        [1, 0],
        Extrapolation.CLAMP
      );
    }
    // Completely hidden if past right edge
    else if (itemStart > screenRight) {
      opacity = 0;
    }
    // Fully visible when in center
    else {
      opacity = 1;
    }
    
    return {
      opacity: Math.max(0, Math.min(1, opacity)),
    };
  }, [index, itemWidth, itemSpacing, windowWidth]);

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
};

export default FadeOnScrollItem;

