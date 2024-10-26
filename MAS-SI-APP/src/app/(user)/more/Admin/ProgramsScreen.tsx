import { FlatList, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Link } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import { toDate } from 'date-fns'

const ProgramsScreen = () => {
  const [ programs, setPrograms ] = useState<any[]>([])
  
  const getPrograms = async () => {
    const { data : UserPrograms, error  } = await supabase.from('added_notifications_programs').select('program_id')

    if( UserPrograms ){
    const filteredUserPrograms = UserPrograms?.filter((obj1, i, arr) => 
      arr.findIndex(obj2 => (obj2.program_id === obj1.program_id)) === i)
    const AllPrograms : any[] = []
    await Promise.all(filteredUserPrograms?.map( async (id) => {
      const { data : program, error } = await supabase.from('programs').select('*').eq('program_id', id.program_id).single()
        if( program ){
          AllPrograms.push(program)
        }
      })
    )
    setPrograms(AllPrograms)


    }

  }
  useEffect(() => {
    getPrograms()
  }, [])

  return (
    <View className='flex-1'>
      <Text className="font-bold text-2xl p-3 ">Programs</Text>
      <Link  href={'/(user)/more/Admin/AddNewProgramScreen'} asChild >
          <TouchableOpacity className="bg-[#57BA47] w-[40%] px-3 py-2 ml-3 mb-2 rounded-md">
            <Text className="font-bold text-sm text-white text-center">Add New Program</Text>
          </TouchableOpacity>
      </Link>
      <View className='flex-1 grow'>
        <FlatList 
        style={{ flex : 1 }}
        data={programs}
        renderItem={({item}) =>(
          <View style={{marginHorizontal: 2}}>
          <Link  href={{pathname: '/(user)/more/Admin/ProgramsNotificationScreen', params: {program_id: item.program_id}}}

              asChild >
              <TouchableOpacity>
                <View className='mt-1 self-center justify-center bg-white p-2 flex-row' style={{ borderRadius: 20, width: '95%'}}>
                  
                  <View className='justify-center w-[30%]'>
                    <Image source={{ uri : item.program_img }} style={{ borderRadius : 8, width : '100%', height : 95}}/>
                  </View>
                  <View className='w-[70%] pl-2'>
                    <Text className='text-lg text-black font-bold '>{item.program_name}</Text>
                    <Text className='my-2  text-sm text-black font-bold' numberOfLines={1}>{item.program_desc}</Text>
                    <Text className='my-2  text-sm text-black' numberOfLines={1}>Start Date: {}</Text>
                  </View>
                </View>
              </TouchableOpacity>
          </Link>
      </View>
        )}
        />
      </View>

    </View>
  )
}

export default ProgramsScreen

