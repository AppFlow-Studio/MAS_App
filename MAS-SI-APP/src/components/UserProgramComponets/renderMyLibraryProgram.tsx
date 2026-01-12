import { View, Text, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Program } from '../../types'
import { supabase } from '@/src/lib/supabase'
import FlyerImageComponent from '../FlyerImageComponent'

type RenderProgramProp = {
    program_id: string
}
const RenderMyLibraryProgram = ( {program_id} : RenderProgramProp) => {
  const [ program, setProgram ] = useState<Program>()

  async function fetchUserProgram(){
    const { data, error } = await supabase.from("programs").select("*").eq("program_id", program_id).single()
    if(data){
      setProgram(data)
    }
  }

  useEffect(() => {
    fetchUserProgram()
  }, [])

  if (!program) {
    return (
      <View style={{ width: 170, height: 200, justifyContent: "center", alignItems: "center" }}>
        <View style={{width: 170, height: 170, backgroundColor: '#E5E7EB', borderRadius: 8}} />
      </View>
    )
  }

  return (
    <View style={{ justifyContent: "center", alignItems: "center" }}>
      <FlyerImageComponent item={program} />
    </View>
  )
}

export default RenderMyLibraryProgram