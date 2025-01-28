import { Text, View, Pressable, Image, Alert, Button, StyleSheet, Share} from 'react-native'
import {Program} from "../types"
import React, { useState, useRef, useEffect } from 'react'
import { Link, router } from 'expo-router';
import  Swipeable, { SwipeableProps }  from 'react-native-gesture-handler/Swipeable';
import { TouchableOpacity } from 'react-native-gesture-handler';
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
  
    return(
        <View style={{ width: "50%"}}>
            <Link  href={ `/menu/program/${program.program_id}`}
                asChild >
                <TouchableOpacity className='items-center'>
                    <View style={{flexDirection: "column",alignItems: "center", justifyContent: "center"}}>
                        <Animated.View style={{justifyContent: "center", alignItems: "center", backgroundColor: "white", borderRadius: 15}}>
                            <Animated.Image 
                                source={{ uri: program.program_img || require('@/assets/images/MASHomeLogo.png') }}
                                style={{width: 150, height: 150, objectFit: "cover", borderRadius: 15}}                                    
                            />
                        </Animated.View>
                        <View>
                            <View className='mt-2 items-center justify-center bg-white'>
                                <Text style={{textAlign: "center"}} className='text-md' numberOfLines={1}>{program.program_name}</Text>
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