import { Text, View, Pressable, Image, Alert, Button, Animated, StyleSheet} from 'react-native'
import {Program} from "@/src/types"
import React, { useState, useRef, useEffect } from 'react'
import { Link, router } from 'expo-router';
import  Swipeable, { SwipeableProps }  from 'react-native-gesture-handler/Swipeable';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { supabase } from "@/src/lib/supabase";
import { useAuth } from '@/src/providers/AuthProvider'; 
import * as Haptics from "expo-haptics"
import { ActivityIndicator } from 'react-native-paper';
type ProgramsListProgramProps = {
    program_id: string,
}


export default function RenderAddedPrograms( {programInfo} : {programInfo : Program}){
    return(
        <View style={{ justifyContent: "center", alignItems: "center", marginHorizontal: 8 }} className=''>
        <Link  href={`/myPrograms/notifications/ClassesAndLectures/${programInfo?.program_id}`}  asChild>
            <TouchableOpacity>
              <View style={{width: 170, height: 170}}>
                      <Image source={ programInfo?.program_img ? {uri: programInfo.program_img } : require("@/assets/images/MASHomeLogo.png")} style={{width : "100%", height: "100%",borderRadius: 8}}/>
              </View>
              <View className='lex-col w-[170] h-[40] flex-shrink'>
                  <Text className='text-black font-bold' numberOfLines={1}>{programInfo?.program_name}</Text>
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