import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export type CapacityStatus = 'green' | 'yellow' | 'red' | null | undefined;

interface CapacityStatusLightProps {
  status: CapacityStatus;
  size?: number;
  style?: object;
}

const COLORS = {
  green: '#22C55E',
  yellow: '#F59E0B',
  red: '#EF4444',
};

export const CapacityStatusLight: React.FC<CapacityStatusLightProps> = ({
  status,
  size = 8,
  style,
}) => {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (status === 'green') {
      // Subtle pulsing animation for green status
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      scale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [status]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!status) {
    return null;
  }

  const color = COLORS[status];

  return (
    <View style={[styles.container, { width: size + 4, height: size + 4 }, style]}>
      <Animated.View
        style={[
          styles.light,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            shadowColor: color,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  light: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default CapacityStatusLight;
