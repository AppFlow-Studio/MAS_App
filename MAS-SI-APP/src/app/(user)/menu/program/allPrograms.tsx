import { StyleSheet, View, FlatList, Button} from 'react-native';
import { Stack } from "expo-router";
import ProgramsListProgram from "../../../../components/ProgramsListProgram"
import { Divider, Searchbar } from 'react-native-paper';
import { useEffect, useState } from 'react';
import { Program } from "@/src/types"
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';

export default function ProgramsScreen(){
  const { session } = useAuth()
  const [ loading, setLoading ] = useState(false)
  const [ shownData, setShownData ] = useState<Program[]>()
  const [ searchBarInput, setSearchBarInput ] = useState('')
  async function getPrograms(){
    try{
      setLoading(true)
      if (!session?.user) throw new Error('No user on the session!')
      
      const { data, error } = await supabase
      .from("programs")
      .select("*")

      if(error){
        throw error
      }

      if(data){
        
        setShownData(data)
        console.log
      }
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message)
      }
  }
  finally{
    setLoading(false)
  }
  }
  useEffect(() => {
    getPrograms()
  }, [session])
  const tabBarHeight = useBottomTabBarHeight() + 35;
  const filterTestFunc = (searchParam : string) => {
    setSearchBarInput(searchParam)
  }

  const seperator = () =>{
    return (
    <View style={{ alignItems: "center", marginVertical: 3}}>
      <Divider style={{height: 0.5, width: "50%", backgroundColor : 'lightgray'}}/>
    </View>
  )
  }


  return (
   <View className=' bg-[#0D509D] flex-1' >
      <View className='bg-white pt-2 mt-1 flex-1'style={{borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingBottom: tabBarHeight }}>
      <View className='mb-5'/>
      <FlatList 
        data={shownData} 
        renderItem={({item}) => <ProgramsListProgram program={item}/>}
        ItemSeparatorComponent={() => seperator()}
        contentContainerStyle={{ rowGap: 1 }}
      />
      </View>
    </View>
  )
}
