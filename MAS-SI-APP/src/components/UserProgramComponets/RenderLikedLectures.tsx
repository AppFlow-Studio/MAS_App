import { View, Text, Pressable, FlatList, Dimensions, Image } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useLocalSearchParams, Stack } from 'expo-router';
import { Lectures, Program } from '@/src/types';
import { Link } from "expo-router";
import { defaultProgramImage } from '../ProgramsListProgram';
import { ActivityIndicator, Icon, IconButton } from 'react-native-paper';
import LectureDotsMenu from '../LectureComponets/LectureDotsMenu';
import { Menu, MenuOptions, MenuOption, MenuTrigger} from 'react-native-popup-menu';
import * as Haptics from "expo-haptics"
import Animated, { useSharedValue, withSpring, useAnimatedStyle, interpolate, Extrapolation, runOnJS } from 'react-native-reanimated';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { format } from 'date-fns';
type RenderLikedLecturesProp = {
  lecture : Lectures
  index : number
  speaker : string | null | undefined
}
const { width } = Dimensions.get("window")
type program_imgProp = {
  program_img : string
}
const RenderLikedLectures = ({lecture, index, speaker} : RenderLikedLecturesProp) => {
    const liked = useSharedValue(0)
    const { session } = useAuth()
    const [ loading, setLoading ] = useState(true)
    const [ program_img , setProgram_img ] = useState<program_imgProp>()
    async function checkIfLectureIsLiked(){
      const { data , error } = await supabase.from("liked_lectures").select("lecture_id").eq("user_id", session?.user.id).eq("lecture_id", lecture.lecture_id).single()

      if( data ){
        return 1
      }else{
        return 0
      }
    }

    async function setLiked() {
      try {
        const isLiked = await checkIfLectureIsLiked(); 
        liked.value = isLiked; 
      } catch (error) {
        console.error("Error setting liked value:", error);
      }
    }

    async function stateOfLikedLecture(){
      if( liked.value == 0 ){
      const { error } = await supabase.from("liked_lectures").insert({user_id : session?.user.id, lecture_id: lecture.lecture_id})
      if (error) {
        console.log(error)
      }
      }
      if ( liked.value == 1 ){
        const { error } = await supabase.from("liked_lectures").delete().eq("user_id", session?.user.id).eq("lecture_id", lecture.lecture_id)
        if (error) {
          console.log(error)
        }
      }
      liked.value = withSpring( liked.value ? 0: 1, {} )
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      )
    }
        
    const outlineStyle = useAnimatedStyle(() => {
      return {
        transform: [
          {
            scale: interpolate(liked.value, [0, 1], [1, 0], Extrapolation.CLAMP),
          },
        ],
      };
    });
    
    async function getLecImage(){
      const { data, error } = await supabase.from("program_lectures").select("lecture_program").eq("lecture_id", lecture.lecture_id).single()
      if( error ){
        console.log( error)
      }
      if( data ){
        let img = data;
        if( img ){
          const { data , error }  = await supabase.from("programs").select("program_img").eq("program_id", img.lecture_program).single()
          if( error ){
            console.log(error)
          }
          if( data ){
            setProgram_img(data)
        }
        }
      }
    }
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
          <Pressable onPress={stateOfLikedLecture} className=' relative'>
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

      
      useEffect(() => {
        setLoading(true)
        setLiked()
        getLecImage()
        setLoading(false)
      },[])
      
      if(loading){
        return <ActivityIndicator />
      }
      const width = Dimensions.get("window").width
      return (
        <View className='bg-white mt-2  justify-center ml-2' style={{width: width}}>
          <Pressable>
          <View className='flex-row'>
            <Link href={`/myPrograms/lectures/${lecture.lecture_id}`}>
              <View className=''>
                <Image source={{ uri : program_img?.program_img || defaultProgramImage}} style={{ width: 50, height: 50, borderRadius: 8}}/>
              </View>
              <View className='flex-col justify-center' style={{width: width / 1.5, height: 50}}>
                <Text className='text-md font-bold ml-2 text-black' style={{flexShrink: 1 }} numberOfLines={1}>{lecture.lecture_name}</Text>
                <View className='flex-row' style={{flexShrink: 1, width: width / 1.5}}>
                  {speaker == "MAS" ? <Text className='ml-2 text-gray-500' style={{flexShrink:1}} numberOfLines={1}>{lecture.lecture_speaker} </Text> : <Text className='ml-2 text-gray-500'> {format(lecture.lecture_date, 'PP')}</Text>}
                </View>
              </View>
              </Link>
              <View className='flex-row mt-3 justify-center px-2'>
                <LikeButton />
                <View className='w-2'></View>
                <DotsButton />
              </View>
            </View>
          </Pressable>
          
        </View>
      )
}

export default RenderLikedLectures