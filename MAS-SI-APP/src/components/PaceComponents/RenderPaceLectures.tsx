import { Dimensions, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
  } from 'react-native-popup-menu';
  import { Icon, IconButton } from 'react-native-paper';
import { Link, useNavigation } from 'expo-router';

  const { width } = Dimensions.get("window")

const RenderPaceLectures = () => {
    const liked = useSharedValue(0);
    const navigation = useNavigation<any>()

    const outlineStyle = useAnimatedStyle(() => {
        return {
          transform: [
            {
              scale: interpolate(liked.value, [0, 1], [1, 0], Extrapolation.CLAMP),
            },
          ],
        };
      });

      const fillStyle = useAnimatedStyle(() => {
        return {
          transform: [
            {
              scale: liked.value,
            },
          ],
          opacity: liked.value
        };
      });

      

    const LikeButton = () => {
        return(
          <Pressable onPress={() =>{}} className=' relative'>
            <Animated.View style={outlineStyle}>
              <Icon source="cards-heart-outline"  color='black'size={25}/>
            </Animated.View>
            <Animated.View style={[{position: "absolute"} ,fillStyle]}>
              <Icon source="cards-heart"  color='red'size={25}/>
            </Animated.View>
        </Pressable>
        )
      }
    const DotsButton = () => {
        return(
          <Menu>
            <MenuTrigger>
              <Icon source={"dots-horizontal"} color='black' size={25}/>
            </MenuTrigger>
            <MenuOptions customStyles={{optionsContainer: {width: 150, borderRadius: 8, marginTop: 20, padding: 8}}}>
              <MenuOption>
                <View className='flex-row justify-between items-center'>
                 <Text>Add To Playlist</Text> 
                 <Icon source="playlist-plus" color='black' size={15}/>
                </View>
              </MenuOption>
              <MenuOption>
                <View className='flex-row justify-between items-center'>
                  <Text>Add To Library</Text>
                  <Icon source="library" color='black' size={15}/>
                </View>
              </MenuOption>
            </MenuOptions>
          </Menu>           
        )
      }
  return (
    <View className=' mt-4'>
    <TouchableOpacity>
    <Link  href={`/menu/program/pace/pace_lectures/PaceLecture`}>
    <View className='ml-2 flex-row items-center' >
        <View className='w-[35] h-[25] items-center justify-center mb-2'>
            <Text className='text-xl font-bold text-gray-400 ml-2' >1</Text>
        </View>
        <View className='flex-col justify-center' style={{width: width / 1.5}}>
          <Text className='text-md font-bold ml-2 text-black' style={{flexShrink: 1, }} numberOfLines={1}>Pace Name</Text>
          <View className='flex-row' style={{flexShrink: 1, width: width / 1.5}}>
             <Text className='ml-2 text-gray-500'>11/03/2024</Text>
          </View>
        </View>
      <View className='flex-row px-3'>
          <LikeButton />
          <View className='w-5'></View>
          <DotsButton />
      </View>
    </View>
    </Link>
    </TouchableOpacity>
    
  </View>
  )
}

export default RenderPaceLectures

const styles = StyleSheet.create({})    