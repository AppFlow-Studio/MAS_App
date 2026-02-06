import { StyleSheet, View, FlatList, Button, Text, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { Link, Stack } from "expo-router";
import ProgramsListProgram from "../../../../components/ProgramsListProgram"
import { Divider, Searchbar } from 'react-native-paper';
import { useState } from 'react';
import { Program } from "@/src/types"
import { useAuth } from '@/src/providers/AuthProvider';
import { useCurrentPrograms, usePastRecordedPrograms } from '@/src/hooks/usePrograms';

export default function ProgramsScreen() {
  const { session } = useAuth()
  const { data: shownData, isLoading: currentLoading, refetch: refetchCurrent } = useCurrentPrograms()
  const { data: prevRecordedPrograms, isLoading: pastLoading, refetch: refetchPast } = usePastRecordedPrograms()
  const [searchBarInput, setSearchBarInput] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const loading = currentLoading || pastLoading

  const onRefreshPrograms = async () => {
    setRefreshing(true)
    try {
      await Promise.all([refetchCurrent(), refetchPast()])
    } finally {
      setRefreshing(false)
    }
  }
  const tabBarHeight = 20;
  const filterTestFunc = (searchParam: string) => {
    setSearchBarInput(searchParam)
  }

  const seperator = () => {
    return (
      <View style={{ alignItems: "center", marginVertical: 3 }}>
        <Divider style={{ height: 0.5, width: "50%", backgroundColor: 'lightgray' }} />
      </View>
    )
  }


  return (
    <View className=' bg-[#0D509D] flex-1'>
      <ScrollView style={{ borderTopLeftRadius: 40, borderTopRightRadius: 40, height: '100%', backgroundColor: 'white' }} contentContainerStyle={{
        paddingTop: 2, backgroundColor: 'white', paddingBottom: 50
      }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefreshPrograms} />}
      >
        <View className='mt-5 w-[100%]'>
          <Text className='font-bold text-black text-lg ml-3 mb-8'>Current Programs</Text>
          <View className='flex-row flex flex-wrap gap-y-5'>
            {
              shownData?.map((item) => {
                return (
                  <View key={item.program_id} style={{ width: "50%" }}>
                    <Link href={`/menu/program/${item.program_id}`}
                      asChild >
                      <TouchableOpacity className='items-center'>
                        <View style={{ flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                          <View style={{ justifyContent: "center", alignItems: "center", backgroundColor: "white", borderRadius: 15 }}>
                            <Image
                              source={{ uri: item.program_img || require('@/assets/images/MASHomeLogo.png') }}
                              style={{ width: 150, height: 150, objectFit: "cover", borderRadius: 15 }}
                            />
                          </View>
                          <View>
                            <View className='mt-2 items-center justify-center bg-white w-[80%] self-center'>
                              <Text style={{ textAlign: "center" }} className='text-md' numberOfLines={1}>{item.program_name}</Text>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </Link>
                  </View>
                )
              })
            }
          </View>
          <Text className='font-bold text-black text-lg ml-3 mb-[25] mt-[56]'>Past Recorded Programs</Text>
          <View className='flex-row flex flex-wrap gap-y-5'>
            {
              prevRecordedPrograms?.map((item) => {
                return (
                  <View key={item.program_id} style={{ width: "50%" }}>
                    <Link href={`/menu/program/${item.program_id}`}
                      asChild >
                      <TouchableOpacity className='items-center'>
                        <View style={{ flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                          <View style={{ justifyContent: "center", alignItems: "center", backgroundColor: "white", borderRadius: 15 }}>
                            <Image
                              source={{ uri: item.program_img || require('@/assets/images/MASHomeLogo.png') }}
                              style={{ width: 150, height: 150, objectFit: "cover", borderRadius: 15 }}
                            />
                          </View>
                          <View>
                            <View className='mt-2 items-center justify-center bg-white  w-[80%] self-center'>
                              <Text style={{ textAlign: "center" }} className='text-md' numberOfLines={1}>{item.program_name}</Text>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </Link>
                  </View>
                )
              })
            }
          </View>

        </View>
      </ScrollView>
    </View>
  )
}