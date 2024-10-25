import { Text, View, Pressable, Image, Alert, Button, Animated, StyleSheet} from 'react-native'
import programsData from '@/assets/data/programsData'
import {Program} from "@/src/types"
import React, { useState, useRef, useEffect } from 'react'
import { Link, router } from 'expo-router';
import  Swipeable, { SwipeableProps }  from 'react-native-gesture-handler/Swipeable';
import { TouchableOpacity } from 'react-native-gesture-handler';
export const defaultProgramImage = "https://ugc.production.linktr.ee/e3KxJRUJTu2zELiw7FCf_hH45sO9R0guiKEY2?io=true&size=avatar-v3_0"
import { supabase } from "@/src/lib/supabase";
import { useAuth } from '@/src/providers/AuthProvider'; 
import * as Haptics from "expo-haptics"
type ProgramsListProgramProps = {
    program_id: string,
}


export default function RenderAddedPrograms( {program_id} : ProgramsListProgramProps){
    const { session } = useAuth()
    const [ program, setProgram ] = useState<Program>()
    const getProgram = async () => {
        const { data, error } = await supabase.from("programs").select("*").eq("program_id", program_id).single()
        if( data ){
            setProgram(data)
        }
    } 
    useEffect(() => {
        getProgram()
    },[])
    return(
        <View style={{ justifyContent: "center", alignItems: "center", marginHorizontal: 8 }} className=''>
        <Link  href={`/myPrograms/notifications/ClassesAndLectures/${program_id}`}  asChild>
            <TouchableOpacity>
              <View style={{width: 170, height: 170}}>
                      <Image source={{uri: program?.program_img || defaultProgramImage }} style={{width : "100%", height: "100%",borderRadius: 8}}/>
              </View>
              <View className='lex-col w-[170] h-[40] flex-shrink'>
                  <Text className='text-black font-bold' numberOfLines={1}>{program?.program_name}</Text>
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