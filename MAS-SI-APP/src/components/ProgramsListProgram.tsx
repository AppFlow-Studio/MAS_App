import { Text, View, Pressable, Image, Alert, Button, StyleSheet, Share} from 'react-native'
import {Program} from "../types"
import React, { useState, useRef, useEffect } from 'react'
import { Link, router } from 'expo-router';
import  Swipeable, { SwipeableProps }  from 'react-native-gesture-handler/Swipeable';
import { TouchableOpacity } from 'react-native-gesture-handler';
export const defaultProgramImage = "@/assets/images/MASHomeLogo.png"
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider'; 
import * as Haptics from "expo-haptics"
import Animated, { Easing, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
type ProgramsListProgramProps = {
    program : Program,
}


export default function ProgramsListProgram( {program} : ProgramsListProgramProps){
    const { session } = useAuth()
    const [ programImg, setProgramImg ] = useState('')
    const [ speakerString, setSpeakerString ] = useState<string []>()
    const swipeableRef = useRef<Swipeable>(null);
   
    const closeSwipeable = () => {
      if ( swipeableRef.current ) {
        swipeableRef.current.close();
      }
    };

    async function addToProgramToUserLibrary(){
        const { error } = await supabase.from("added_programs").insert({ user_id : session?.user.id, program_id : program.program_id})
        if(error) {
            console.log(error)
        }
    }
   
    async function addProgramToNotifications(){
        const { error } = await supabase.from("added_notifications_programs").insert({ user_id : session?.user.id, program_id : program.program_id})
        if(error) {
            console.log(error)
        }

    }
    const rightSideButton = () => {
        if( !program.has_lectures && !program.program_is_paid){
            return (
                <View className=''>
                    <View style={{width: "80%", height: "80%", justifyContent: "center", alignItems: "flex-start"}}>
                    <Button
                        title='Add To Notifications'
                        onPress={() => {
                            addProgramToNotifications();   
                            Haptics.notificationAsync(
                            Haptics.NotificationFeedbackType.Success
                            );
                            closeSwipeable()}}
                    />
                    </View>
                </View>
            )
        }
        else if(program.has_lectures && !program.program_is_paid){
            return (
                <View>
                    <View style={{width: "80%", height: "80%", justifyContent: "center", alignItems: "flex-start", marginRight: 2}} className='' >
                        <Button
                            title='Add To Programs'
                            onPress={() => {
                                addToProgramToUserLibrary();   
                                Haptics.notificationAsync(
                                Haptics.NotificationFeedbackType.Success
                                );
                                closeSwipeable()}}
                        />
                    </View>
                </View>
            )
        }
        else if( program.program_is_paid ){
            return (
                <View>
                    <View style={{width: "80%", height: "80%", justifyContent: "center", alignItems: "flex-start", marginRight: 2}} className='border' >
                        <Button
                            title='Add To Cart'
                            onPress={() => {  
                                Haptics.notificationAsync(
                                Haptics.NotificationFeedbackType.Success
                                );
                                closeSwipeable()}}
                        />
                    </View>
                </View>
            )
        }
        
    }
      const getData = async () => {
        let speaker_string : string[] = program?.program_speaker.map(() => {return ''})
        await Promise.all(
        program?.program_speaker.map( async ( speaker_id : string, index : number) => {
            const {data : speakerInfo, error : speakerInfoError } = await supabase.from('speaker_data').select('*').eq('speaker_id', speaker_id).single()
            if ( speakerInfo ){
            if (index == program.program_speaker.length - 1 ){
                speaker_string[index]=speakerInfo.speaker_name
            }
            else {
                speaker_string[index]= speakerInfo.speaker_name + ' & '
            }
            }
        })
        )

        setSpeakerString(speaker_string.join(''))
      };
    useEffect(() => {
        getData()
    })
    return(
        <View style={{ width: "100%", height: 120, marginHorizontal: 5}}>
            <Link  href={ `/menu/program/${program.program_id}`}
                asChild >
                <TouchableOpacity className='items-center'>
                    <View style={{flexDirection: "row",alignItems: "center", justifyContent: "center"}}>
                        <Animated.View style={{justifyContent: "center", alignItems: "center", backgroundColor: "white", borderRadius: 15}}>
                            <Animated.Image 
                                source={{ uri: program.program_img || require(defaultProgramImage) }}
                                style={{width: 130, height: 100, objectFit: "cover", borderRadius: 15}}                                    
                            />
                        </Animated.View>
                        <View>
                            <View className='mt-2 items-center justify-center bg-white' style={{height: "80%", borderRadius: 20, marginLeft: "10%", width: 200}}>
                                <Text style={{textAlign: "center", fontWeight: "bold"}}>{program.program_name}</Text>
                                <Text style={{textAlign: "center"}}>By: {speakerString}</Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </Link>
        </View>
    )
}

const styles = StyleSheet.create({
    dot: {
      width: 4,
      height: 4,
      borderRadius: 5,
      backgroundColor: '#bbb',
      margin: 5,
    },
    activeDot: {
      backgroundColor: '#000',
    },
  });
  {/*
   <Swipeable
                renderRightActions={rightSideButton}
                >
                <View className='' style={{width : "100%", backgroundColor: "white", borderRadius: 40}}> 
                    <Text className='items-start'>
                        <Text className='text-2xl font-bold'>
                                {program.programName}{"\n"}
                        </Text>
                        <Text className='text-1xl text-grey'>
                            * {program.programDesc}
                        </Text>
                    </Text>
                </View>
            </Swipeable> 
  */}