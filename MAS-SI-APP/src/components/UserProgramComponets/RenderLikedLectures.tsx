import { View, Text, Pressable, Dimensions, Image, StyleSheet } from 'react-native'
import React, { useState, useEffect } from 'react'
import { Lectures, Program } from '@/src/types';
import { Link } from "expo-router";
import { Icon } from 'react-native-paper';
import * as Haptics from "expo-haptics"
import Animated, { useSharedValue, withSpring, useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { format } from 'date-fns';

type RenderLikedLecturesProp = {
  lecture : Lectures
  index : number
  speaker : string | null | undefined
}

const RenderLikedLectures = React.memo(function RenderLikedLectures({lecture, index, speaker} : RenderLikedLecturesProp) {
    const liked = useSharedValue(0)
    const { session } = useAuth()
    const [ programImg, setProgramImg ] = useState<string | null>(null)

    async function checkIfLectureIsLiked(){
      const { data } = await supabase.from("liked_lectures").select("lecture_id").eq("user_id", session?.user.id).eq("lecture_id", lecture.lecture_id).single()
      return data ? 1 : 0
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
        if (error) console.log(error)
      }
      if ( liked.value == 1 ){
        const { error } = await supabase.from("liked_lectures").delete().eq("user_id", session?.user.id).eq("lecture_id", lecture.lecture_id)
        if (error) console.log(error)
      }
      liked.value = withSpring( liked.value ? 0: 1, {} )
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
        
    const outlineStyle = useAnimatedStyle(() => ({
      transform: [{ scale: interpolate(liked.value, [0, 1], [1, 0], Extrapolation.CLAMP) }],
    }));
    
    async function getLecImage(){
      const { data } = await supabase.from("program_lectures").select("lecture_program").eq("lecture_id", lecture.lecture_id).single()
      if( data ){
        const { data: programData } = await supabase.from("programs").select("program_img").eq("program_id", data.lecture_program).single()
        if( programData ) setProgramImg(programData.program_img)
      }
    }

    const fillStyle = useAnimatedStyle(() => ({
      transform: [{ scale: liked.value }],
      opacity: liked.value
    }));
      
    useEffect(() => {
      setLiked()
      getLecImage()
    },[])

    let dateStr = ''
    try { dateStr = format(lecture.lecture_date, 'PP') } catch {}

    return (
      <Link href={`/myPrograms/programs/${lecture.lecture_program}?lectureId=${lecture.lecture_id}`} asChild>
        <Pressable style={styles.card}>
          <Image 
            source={programImg ? { uri: programImg } : require("@/assets/images/MASHomeLogo.png")} 
            style={styles.thumbnail}
          />
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>{lecture.lecture_name}</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {speaker === "MAS" ? lecture.lecture_speaker : dateStr}
            </Text>
          </View>
          <Pressable 
            onPress={(e) => { e.stopPropagation(); stateOfLikedLecture(); }} 
            style={styles.heartButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Animated.View style={outlineStyle}>
              <Icon source="cards-heart-outline" color="#94A3B8" size={22}/>
            </Animated.View>
            <Animated.View style={[styles.heartFill, fillStyle]}>
              <Icon source="cards-heart" color="#EF4444" size={22}/>
            </Animated.View>
          </Pressable>
        </Pressable>
      </Link>
    )
})

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(33, 78, 145, 0.08)',
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  textContainer: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  heartButton: {
    padding: 6,
    marginLeft: 8,
  },
  heartFill: {
    position: 'absolute',
    top: 6,
    left: 6,
  },
})

export default RenderLikedLectures