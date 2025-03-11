import React, { useEffect, useState } from "react";
import { Dimensions, StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { RotatingIcon } from "@/src/components/ProgramSpinningIcon";
import RotatingOuterIcon from "./ProgramSpinningOuterIcon";
import { Program } from "../types";

export type TechImage = {
  image: any;
  imageTintColor: string;
  containerColor: string;
  description: string;
  title: string;
};

const {width : SCREEN_WIDTH} = Dimensions.get('window')
const CIRCLE_SIZE = SCREEN_WIDTH * 0.8;
// const images: TechImage[] = [
//   {
//     image: require(`${IMAGE_PATH}/vs-code.png`),
//     imageTintColor: "#29B6F6",
//     containerColor: "#f0efef",
//     title: "VS Code",
//     description:
//       "Visual Studio Code is a code editor redefined and optimized for building and debugging modern web and cloud applications.",
//   },
//   {
//     image: require(`${IMAGE_PATH}/flutter.png`),
//     imageTintColor: "#40C4FF",
//     containerColor: "#f0efef",
//     title: "Flutter",
//     description:
//       "Flutter is an open-source UI software development toolkit created by Google.",
//   },
//   {
//     image: require(`${IMAGE_PATH}/react.png`),
//     imageTintColor: "#8BB7F0",
//     containerColor: "#f0efef",
//     title: "React JS",
//     description:
//       "React is a JavaScript library for building user interfaces, maintained by Facebook.",
//   },
//   {
//     image: require(`${IMAGE_PATH}/swiftui.png`),
//     imageTintColor: "#ffffff",
//     containerColor: "#F58420",
//     title: "SwiftUI",
//     description:
//       "SwiftUI is a framework made by Apple to build user interfaces across all Apple platforms with the power of Swift.",
//   },
//   {
//     image: require(`${IMAGE_PATH}/kotlin.png`),
//     imageTintColor: "#f0efef",
//     containerColor: "#3060FF",
//     title: "Kotlin",
//     description:
//       "Kotlin is a cross-platform, statically typed, general-purpose programming language with type inference.",
//   },
//   {
//     image: require(`${IMAGE_PATH}/figma.png`),
//     imageTintColor: "#7C4DFF",
//     title: "Figma",
//     containerColor: "#f5f5f5",
//     description:
//       "Figma is a vector graphics editor and prototyping tool which is primarily web-based.",
//   },
// ];

export const RunnyOuterCircle = ({programs, onSetSelectProgram} : { programs : Program[], onSetSelectProgram : (program : Program) => void}) => {
  const selectedIcon = useSharedValue<undefined | number>(undefined);
  const [selectedIndex, setSelectedIndex] = useState<number | undefined>(
    undefined
  );

  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 25000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [rotation]);

  const circleAStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const handleIconPress = (index: number | undefined) => {
    selectedIcon.value = index;
    setSelectedIndex(index);
    index ? onSetSelectProgram(programs[index]) : null
  };

  return (
    <Animated.View style={[styles.circle, circleAStyle]}>
      {programs.map((item, i) => (
        <RotatingOuterIcon
          selectedIndex={selectedIndex}
          rotation={rotation}
          onPress={handleIconPress}
          key={i}
          index={i}
          program={item}
        />
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 1,
    borderColor: "#252525",
  },
});