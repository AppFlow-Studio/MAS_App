import { View, Text, Pressable, ScrollView, useWindowDimensions, TouchableOpacity, Image } from 'react-native'
import { Link, Stack } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import { Icon } from "react-native-paper"
import CreatePlaylistBottomSheet from '@/src/components/UserProgramComponets/CreatePlaylistBottomSheet'
import BottomSheet, { BottomSheetModal, BottomSheetBackdrop, BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { supabase } from '@/src/lib/supabase'
import { useAuth } from "@/src/providers/AuthProvider"
import { UserPlaylistType } from '@/src/types'
import RenderUserPlaylist from '@/src/components/UserProgramComponets/RenderUserPlaylist'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import Svg, { Path } from 'react-native-svg'
const PlaylistIndex = () => {
  const { session } = useAuth()
  const [ userPlayLists, setUserPlaylists ] = useState<UserPlaylistType[]>()
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const layout = useWindowDimensions().width
  const handlePresentModalPress = () => bottomSheetRef.current?.present();
  const tabBarHeight = useBottomTabBarHeight() 
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
    <ScrollView contentContainerStyle={{ paddingBottom : tabBarHeight + 100 }} className="bg-white h-full flex-1">
          <Stack.Screen options={{ title : '', headerBackTitleVisible : false, headerTintColor : '#007AFF' , headerTitleStyle: { color : 'black'}, headerStyle : {backgroundColor : 'white',}}}/>
            <Pressable className='flex-row items-center ml-2' onPress={handlePresentModalPress}>
            <Svg width="30" height="30" viewBox="0 0 30 30" fill="none">
              <Path d="M4.25 7.75C4.25 5.817 5.817 4.25 7.75 4.25H22.25C24.183 4.25 25.75 5.817 25.75 7.75V22.25C25.75 24.183 24.183 25.75 22.25 25.75H7.75C5.817 25.75 4.25 24.183 4.25 22.25V7.75Z" stroke="#1B85FF"/>
              <Path d="M15 10L15 20" stroke="#1B85FF" stroke-linejoin="round"/>
              <Path d="M20 15L10 15" stroke="#1B85FF" stroke-linejoin="round"/>
            </Svg>           
            <Text className='text-xl font-bold px-[13]'>Create New Playlist...</Text>
            </Pressable>
            <View className='flex-row items-center'>
              <Link href={"/myPrograms/likedLectures/AllLikedLectures"} asChild>
                <Pressable className='flex-row items-center ml-2.5'>
                <Svg width="25" height="25" viewBox="0 0 20 18" fill="none">
                  <Path d="M2.45067 9.90821L9.40329 16.4395C9.64278 16.6644 9.76253 16.7769 9.90372 16.8046C9.9673 16.8171 10.0327 16.8171 10.0963 16.8046C10.2375 16.7769 10.3572 16.6644 10.5967 16.4395L17.5493 9.90821C19.5055 8.07059 19.743 5.0466 18.0978 2.92607L17.7885 2.52734C15.8203 -0.00942016 11.8696 0.416014 10.4867 3.31365C10.2913 3.72296 9.70868 3.72296 9.51333 3.31365C8.13037 0.416014 4.17972 -0.00941634 2.21154 2.52735L1.90219 2.92607C0.256947 5.0466 0.494498 8.07059 2.45067 9.90821Z" stroke="#FF0000"/>
                </Svg>
                <View className='flex flex-row justify-between w-[93%]' >
                  <View className='flex flex-col'>
                    <Text className='text-xl font-bold px-[13]'>Favorite Lectures</Text>
                    <Text className='text-gray-400 text-sm ml-3'>On Lectures Tap The Heart </Text>
                  </View>
                  <View className='flex flex-row items-center'>
                    <Text className='text-gray-400 text-sm'>View all</Text>
                    <Icon source={'chevron-right'} color='gray' size={30}/>
                  </View>
                </View>
                </Pressable>
              </Link>
            </View>

            <View style={{ flexDirection : "row", flexWrap : "wrap" }}>

               <View style={{ width : layout / 2, justifyContent : "center", alignItems : "center", paddingTop : 5}}>
                  <Link href={`/myPrograms/playlists/QuranPlaylist`} asChild>
                    <TouchableOpacity>
                    <View className='flex-col item-center px-2'>
                        <View style={{justifyContent: "center", alignItems: "center", borderRadius: 15, width: "30%",}}>
                              <View style={{ height : 140, width : 160, borderRadius : 20, alignItems : 'center', justifyContent : 'center', backgroundColor : 'white'}} >
                                  <Image source={require('@/assets/images/MasPlaylistDef.png')} style={{height : '70%', width : '70%', objectFit : 'fill'}} />
                              </View>
                        </View>
                        <View className='items-center justify-center w-[70%]'>
                            <Text className='text-xl font-bold' numberOfLines={1} allowFontScaling adjustsFontSizeToFit>Quran</Text>
                        </View>
                    </View>
                    </TouchableOpacity>
                  </Link>
               </View>

                <View style={{ width : layout / 2, justifyContent : "center", alignItems : "center", paddingTop : 5}}>
                  <Link href={`/myPrograms/playlists/AthkarPlaylist`} asChild>
                    <TouchableOpacity>
                    <View className='flex-col item-center px-2'>
                        <View style={{justifyContent: "center", alignItems: "center", borderRadius: 15, width: "30%",}}>
                              <View style={{ height : 140, width : 160, borderRadius : 20, alignItems : 'center', justifyContent : 'center', backgroundColor : 'white'}} >
                                  <Image source={require('@/assets/images/MasPlaylistDef.png')} style={{height : '70%', width : '70%', objectFit : 'fill'}} />
                              </View>
                        </View>
                        <View className='items-center justify-center w-[70%]'>
                            <Text className='text-xl font-bold' numberOfLines={1} allowFontScaling adjustsFontSizeToFit>Athkar</Text>
                        </View>
                    </View>
                    </TouchableOpacity>
                  </Link>
                </View>

              { 
              userPlayLists ? userPlayLists.map((item, index) => {
                return( 
                  <View key={index} style={{ width : layout / 2, justifyContent : "center", alignItems : "center", paddingTop : 5}} >
                    <RenderUserPlaylist playlist={item}/>
                  </View>
              )
              }) : 
              <Pressable className='border border-dotted border-[#0073EE] h-[150] w-[150] rounded-xl items-center justify-center flex flex-col ml-3' onPress={handlePresentModalPress}>
                <Icon source={'playlist-plus'} size={70} color='#0073EE'/>
                <Text className='text-center text-gray-400 text-sm'>Make a playlist to see it here</Text>
               </Pressable>
              }
            </View> 
        <CreatePlaylistBottomSheet ref={bottomSheetRef} />
      </ScrollView>
  )
}

export default PlaylistIndex