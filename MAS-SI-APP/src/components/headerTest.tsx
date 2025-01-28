import { View, Text, Image, Dimensions, ScrollView } from "react-native"
import Animated, { useAnimatedRef, useScrollViewOffset, useAnimatedStyle, interpolate } from "react-native-reanimated"
import { Icon, IconButton } from "react-native-paper"

const Header = () => {
    const { width } = Dimensions.get("window")
    const scrollRef = useAnimatedRef<Animated.ScrollView>()
    const scrollOffset = useScrollViewOffset(scrollRef)
    const imageAnimatedStyle = useAnimatedStyle(() => {
        return{
          transform: [
            {
              translateY : interpolate(
              scrollOffset.value,
              [-250, 0, 250 ],
              [-250/2, 0, 250 * 0.75]
              )
            },
            {
              scale: interpolate(scrollOffset.value, [-250, 0, 250], [2, 1, 1])
            }
          ]
        }
      })
    return(
    <Animated.ScrollView ref={scrollRef} style={{backgroundColor: "white", height: "100%" }}>
     <View className='justify-center items-center mt-[10%] '>
              <Animated.Image source={require("@/assets/images/massiLogo2.png")} style={[{width: width / 2, height: 75, justifyContent: "center"}, imageAnimatedStyle]} />
    </View>
      <ScrollView style={{height: 3000}}>

      </ScrollView>
      </Animated.ScrollView>
)
}

export default Header