import React from "react";
import Svg, { Path } from "react-native-svg";

const ArrowRightIcon = ({ width = 17, height = 17, color = "#A8A8A8" }) => {
  return (
    <Svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 17 17" fill="none">
      <Path d="M6.375 4.25L10.625 8.5L6.375 12.75" stroke={color} />
    </Svg>
  );
};

export default ArrowRightIcon;
