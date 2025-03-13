import React, { useState, useImperativeHandle, forwardRef, useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Text, Pressable } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  withSequence
} from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const NUM_CONFETTI = 30;
const rainbowColors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];

const ConfettiItem = ({ trigger }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  // Assign a random rainbow color once per confetti item.
  const color = useMemo(() => {
    const index = Math.floor(Math.random() * rainbowColors.length);
    return rainbowColors[index];
  }, []);

  useEffect(() => {
    if (trigger) {
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * (screenWidth / 2);
      translateX.value = withSequence(withSpring(distance * Math.cos(angle)), withTiming(-(distance * Math.cos(angle)), { duration : 3000 }));
      translateY.value = withSequence(withSpring(distance * Math.sin(angle)), withTiming(-(distance * Math.sin(angle)), { duration : 3000 }));
      rotate.value = withTiming(Math.random() * 360, { duration: 1000 });
      opacity.value = withTiming(0, { duration: 1000 });
    } else {
      translateX.value = 0;
      translateY.value = 0;
      rotate.value = 0;
      opacity.value = 1;
    }
  }, [trigger]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotateX: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.confettiItem, { backgroundColor: color }, animatedStyle]} />;
};

const Confetti = forwardRef((props, ref) => {
  const [trigger, setTrigger] = useState(false);

  useImperativeHandle(ref, () => ({
    fire: () => {
      setTrigger(true);
      // Reset trigger after animation completes (1000ms + buffer)
      setTimeout(() => setTrigger(false), 1100);
    },
  }));

  return (
    <View style={styles.container}>
      {Array.from({ length: NUM_CONFETTI }).map((_, index) => (
        <ConfettiItem key={index} trigger={trigger} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: screenWidth,
    height: screenHeight,
    pointerEvents: 'none', // allows touches to pass through
  },
  confettiItem: {
    position: 'absolute',
    width: 10,
    height: 10,
  },
});

export default Confetti;