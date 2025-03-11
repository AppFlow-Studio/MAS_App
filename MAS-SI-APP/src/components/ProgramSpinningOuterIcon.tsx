import React, { useEffect } from "react";
import { StyleSheet, Pressable, Image, Text, View, useWindowDimensions, Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  SharedValue,
  interpolate,
  interpolateColor,
  FadeIn,
  Easing,
} from "react-native-reanimated";
import { Program } from "../types";

const {width : SCREEN_WIDTH} = Dimensions.get('window')
const CIRCLE_SIZE = SCREEN_WIDTH * 0.8;
const VIEW_SIZE = 160;
const CIRCLE_RADIUS = CIRCLE_SIZE / 2;
const ICONS_COUNT = 5; // Number of icons
const ANGLE_PER_ICON = (2 * Math.PI) / ICONS_COUNT;
const START_ANGLE = -Math.PI / 2; // Starting from the top
const CIRCLE_CENTER = CIRCLE_RADIUS - VIEW_SIZE / 2;
const CIRCLE_CENTER_X = CIRCLE_RADIUS - VIEW_SIZE / 2;
const CIRCLE_CENTER_Y = CIRCLE_RADIUS - VIEW_SIZE / 2;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  index: number;
  onPress: (index: number | undefined) => void;
  rotation: SharedValue<number>;
  selectedIndex: number | undefined;
  program : Program
};

export const RotatingOuterIcon: React.FC<Props> = ({
  index,
  onPress,
  rotation,
  selectedIndex,
  program
}) => {
  const angle = START_ANGLE + ANGLE_PER_ICON * index;

  const x = useSharedValue(
    CIRCLE_RADIUS + CIRCLE_RADIUS * Math.cos(angle) - VIEW_SIZE / 2
  );
  const y = useSharedValue(
    CIRCLE_RADIUS + CIRCLE_RADIUS * Math.sin(angle) - VIEW_SIZE / 2
  );

  const isSelected = useSharedValue(0);

//   useEffect(() => {
//     if (selectedIndex === index) {
//       x.value = withTiming(CIRCLE_CENTER_X);
//       y.value = withTiming(CIRCLE_CENTER_Y);
//       isSelected.value = withTiming(1);
//     } else {
//       x.value = withTiming(
//         CIRCLE_RADIUS + CIRCLE_RADIUS * Math.cos(angle) - VIEW_SIZE / 2
//       );
//       y.value = withTiming(
//         CIRCLE_RADIUS + CIRCLE_RADIUS * Math.sin(angle) - VIEW_SIZE / 2
//       );
//       isSelected.value = withTiming(0);
//     }
//   }, [selectedIndex, angle, x, y]);

  const handlePress = () => {
    onPress(selectedIndex === index ? undefined : index);
  };

  const animatedIconStyle = useAnimatedStyle(() => {
    const rotate = -rotation.value; // Counter rotation to keep the icon upright
    const paddingTop = interpolate(
      isSelected.value,
      [0, 1],
      [0, VIEW_SIZE * 0.2]
    );

    return {
      paddingTop,
      transform: [
        { translateX: x.value },
        { translateY: y.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const descriptionOpacityStyle = useAnimatedStyle(() => {
    return {
      opacity: isSelected.value,
    };
  });

  const iconTintColorStyle = useAnimatedStyle(() => {
    const tintColor = interpolateColor(
      isSelected.value,
      [0, 1],
      ["gray", 'orange']
    );
    return {
      tintColor,
    };
  });

  const descriptionScaleStyle = useAnimatedStyle(() => {
    const scale = interpolate(isSelected.value, [0, 1], [0, 1]);
    return {
      transform: [{ scale }],
    };
  });

  const imageContainerStyle = useAnimatedStyle(() => {
    const bottom = interpolate(isSelected.value, [0, 1], [0, VIEW_SIZE * 0.3]);
    const backgroundColor = interpolateColor(
      isSelected.value,
      [0, 1],
      ["#302e2f", 'white']
    );

    return {
      backgroundColor,
      bottom,
    };
  });

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[styles.iconContainer, animatedIconStyle]}
      entering={FadeIn.duration(2000).easing(Easing.inOut(Easing.quad))}
    >
      <Animated.View style={[styles.imageContainer]}>
        <Animated.Image
          src={program.program_img ? program.program_img : require('@/assets/images/MasPlaylistDef.png')}
          style={[styles.iconImage]}
        />
      </Animated.View>
      <Animated.View
        style={[styles.descriptionContainer]}
      >
        <Animated.Text style={[styles.descriptionText, descriptionScaleStyle]}>
        </Animated.Text>
      </Animated.View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    width: VIEW_SIZE,
    height: VIEW_SIZE,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    borderRadius: 4,
  },
  imageContainer: {
    width: 50,
    height: 50,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  iconImage: {
    width: 75,
    height: 75,
    borderRadius : 10
  },
  descriptionContainer: {
    position: "absolute",
    top: VIEW_SIZE * 0.5,
    width: CIRCLE_SIZE * 0.6,
    gap: 8,
    alignItems: "center",
  },
  titleText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#ffffff",
    textAlign: "center",
  },
  descriptionText: {
    fontSize: 12,
    color: "#b7b7b7",
    textAlign: "center",
  },
});

export default RotatingOuterIcon;