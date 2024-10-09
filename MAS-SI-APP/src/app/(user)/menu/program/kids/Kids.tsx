import { View, Text, FlatList } from 'react-native'
import React, { useEffect, useState } from 'react'
import { supabase } from '@/src/lib/supabase'
import { useAuth } from "@/src/providers/AuthProvider"
import { Program } from '@/src/types'
import { Searchbar, Divider } from 'react-native-paper'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import ProgramsListProgram from '@/src/components/ProgramsListProgram'
import Animated from 'react-native-reanimated'

const Kids = () => {
  const { session } = useAuth()
  const [ kidsPrograms, setKidsPrograms ] = useState<Program[]>()
  const [ searchBarInput, setSearchBarInput ] = useState("")
  const getKidsPrograms = async () => {
    const currDate = new Date().toISOString()
    const { data, error } = await supabase.from("programs").select("*").eq("is_kids", true).gte("program_end_date", currDate)
    if( error ){
        console.log( error )
    }
    if( data ){
        setKidsPrograms(data)
    }
  }

  const tabBarHeight = useBottomTabBarHeight()
  useEffect(() => {
    getKidsPrograms()
  }, [])
  return (
    <View className='bg-[#0D509D] flex-1'>
    <View className='bg-white pt-2 mt-1 flex-1'style={{borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingBottom: tabBarHeight }}>
    <View className='mb-5'/>
    <FlatList 
        data={kidsPrograms}
        renderItem={({item}) => <ProgramsListProgram program={item}/>}
        ItemSeparatorComponent={() => <Divider style={{width: "50%", alignSelf: "center", height: 0.5, backgroundColor : 'lightgray'}}/>}
        contentContainerStyle={{rowGap: 15}}
      />
    </View>
  </View>
  )
}

export default Kids