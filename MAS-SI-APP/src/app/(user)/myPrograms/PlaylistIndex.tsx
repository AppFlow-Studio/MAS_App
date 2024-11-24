import { View, Text, Pressable, ScrollView, useWindowDimensions } from 'react-native'
import { Link, Stack } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import { Icon } from "react-native-paper"
import CreatePlaylistBottomSheet from '@/src/components/UserProgramComponets/CreatePlaylistBottomSheet'
import BottomSheet, { BottomSheetModal, BottomSheetBackdrop, BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { supabase } from '@/src/lib/supabase'
import { useAuth } from "@/src/providers/AuthProvider"
import { UserPlaylistType } from '@/src/types'
import RenderUserPlaylist from '@/src/components/UserProgramComponets/RenderUserPlaylist'
const PlaylistIndex = () => {
  const { session } = useAuth()
  const [ userPlayLists, setUserPlaylists ] = useState<UserPlaylistType[]>()
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const layout = useWindowDimensions().width
  const handlePresentModalPress = () => bottomSheetRef.current?.present();
  const getUserPlaylists = async () => {
    const { data : user_playlist , error } = await supabase.from("user_playlist").select("*").eq("user_id" , session?.user.id)
    if( error ){
      console.log( error )
    }
    if( user_playlist ){
      setUserPlaylists(user_playlist)
    }
  }
  useEffect(() => {
    getUserPlaylists()

    const listenForUserPlaylistChanges = supabase
    .channel('listen for user playlist change')
    .on(
     'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: "user_playlist",
    },
    async (payload) => await getUserPlaylists()
    )
    .subscribe()

    return () => { supabase.removeChannel( listenForUserPlaylistChanges )}
  }, [])

  return (
    <ScrollView className=' bg-white flex-1'>
          <Stack.Screen options={{ title : '', headerBackTitleVisible : false, headerTintColor : '#007AFF' , headerTitleStyle: { color : 'black'}, headerStyle : {backgroundColor : 'white',}}}/>
            <Pressable className='flex-row items-center ml-2' onPress={handlePresentModalPress}>
                <Icon source={"plus-box-outline"} size={40} color='red'/>
                <Text className='text-xl font-bold px-[13]'>Create New Playlist...</Text>
            </Pressable>
            <View className='flex-row items-center'>
              <Link href={"/myPrograms/likedLectures/AllLikedLectures"} asChild>
                <Pressable className='flex-row items-center ml-2'>
                  <Icon source={"heart-box-outline"} color='red' size={40}/>
                  <Text className='text-xl font-bold px-[13]'>Favorite Lectures</Text>
                </Pressable>
              </Link>
            </View>
            <View style={{ flexDirection : "row", flexWrap : "wrap" }}>
              { 
              userPlayLists ? userPlayLists.map((item, index) => {
                return( 
                  <View key={index} style={{ width : layout / 2, justifyContent : "center", alignItems : "center", paddingTop : 5}} >
                    <RenderUserPlaylist playlist={item}/>
                  </View>
              )
              }) : 
              <></>
              }
            </View> 
        <CreatePlaylistBottomSheet ref={bottomSheetRef} />
      </ScrollView>
  )
}

export default PlaylistIndex