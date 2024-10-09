import { View, Text, TouchableOpacity, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Program } from '../../types'
import { Link } from "expo-router"
import { useProgram } from '../../providers/programProvider'
import { defaultProgramImage } from '../ProgramsListProgram'
import RenderMyLibraryProgramLectures from './RenderMyLibraryProgramLectures'
import { useAuth } from "@/src/providers/AuthProvider"
import { supabase } from '@/src/lib/supabase'
type RenderProgramProp = {
    program_id: string
}
const RenderMyLibraryProgram = ( {program_id} : RenderProgramProp) => {
  const { session } = useAuth()
  const [ program, setProgram ] = useState<Program>()
  async function fetchUserProgram(){
    const { data, error } = await supabase.from("programs").select("*").eq("program_id ",  program_id).single()
    if(data){
    setProgram(data)
    }
  }

  useEffect(() => {
    fetchUserProgram()
  }, [session])


  return (
    <View style={{ width: 170, height: 200, justifyContent: "center", alignItems: "center"}} className=''>
        <Link  href={`../myPrograms/${program?.program_id}`}  asChild>
            <TouchableOpacity className=''>
            <View style={{width: 170, height: 170}}>
                    <Image source={{uri: program?.program_img || defaultProgramImage }} style={{width : "100%", height: "100%",borderRadius: 8, objectFit: "fill"}}/>
            </View>
            <View className='flex-col'>
                <Text className='text-black font-bold'>{program?.program_name}</Text>
                <Text className='text-gray-500'>{program?.program_speaker}</Text>
            </View>
            </TouchableOpacity>
        </Link>
    </View>
  )
}

export default RenderMyLibraryProgram