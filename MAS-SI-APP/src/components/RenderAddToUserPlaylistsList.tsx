import { View, Text, TouchableOpacity, Image } from 'react-native'
import React, { useState } from 'react'
import { UserPlaylistType } from '../types'
import { defaultProgramImage } from './ProgramsListProgram'
import { useAuth } from '../providers/AuthProvider'
import { supabase } from '../lib/supabase'
import { Icon, ToggleButton } from 'react-native-paper'
type RenderAddToUserPlaylistsListProp = {
    playlist : UserPlaylistType
    lectureToBeAdded : string
    setAddToPlaylistVisible : ( addToPlaylistVisible : boolean ) => void
    setPlaylistAddingTo : ( playlistAddingTo : string[]) => void
    playListAddingTo : string[] | undefined
}


const RenderAddToUserPlaylistsListProgram = ( { playlist, lectureToBeAdded, setAddToPlaylistVisible, setPlaylistAddingTo, playListAddingTo } : RenderAddToUserPlaylistsListProp ) => {
  const { session } = useAuth()
  const [status, setStatus ] = useState<"checked" | "unchecked" | undefined>("unchecked")
  const handlePress = async () => {
    const { error } = await supabase.from("user_playlist_lectures").insert({user_id : session?.user.id, playlist_id : playlist.playlist_id, program_lecture_id : lectureToBeAdded })
    if( error ){
      console.log( error )
    }
    setAddToPlaylistVisible(false)
  }
  const onButtonToggle = () => {
    if( status == "checked") {
      if( playListAddingTo ){
        const setPlaylist = playListAddingTo?.filter(id => id !== playlist.playlist_id)
        setPlaylistAddingTo(setPlaylist)
      }
    }
    else{
      setPlaylistAddingTo([playlist.playlist_id])
    }
  };
  return (
    <TouchableOpacity className='flex-row items-center' onPress={onButtonToggle}>
        <View className=' ml-2'>
        { playlist.playlist_img ? <Image source={{ uri : playlist.playlist_img }} style={{width : 60, height : 60, objectFit: "fill", borderRadius: 10}}/> : <Image source={require('@/assets/images/MasPlaylistDef.png')} style={{width : 60, height : 60, objectFit: "fill", borderRadius: 10, backgroundColor  : playlist.def_background }}/>}
        </View>
        <Text className='text-xl font-bold'> {playlist.playlist_name} </Text>
    </TouchableOpacity>
  )
}

export const RenderAddToUserPlaylistsListEvent = ( { playlist, lectureToBeAdded, setAddToPlaylistVisible, setPlaylistAddingTo, playListAddingTo } : RenderAddToUserPlaylistsListProp ) => {
  const { session } = useAuth()
  const [status, setStatus ] = useState<"checked" | "unchecked" | undefined>("unchecked")
  const handlePress = async () => {
    const { error } = await supabase.from("user_playlist_lectures").insert({user_id : session?.user.id, playlist_id : playlist.playlist_id, event_lecture_id : lectureToBeAdded })
    if( error ){
      console.log( error )
    }
    setAddToPlaylistVisible(false)
  }
  const onButtonToggle = () => {
    if( status == "checked") {
      if( playListAddingTo ){
        const setPlaylist = playListAddingTo?.filter(id => id !== playlist.playlist_id)
        setPlaylistAddingTo(setPlaylist)
      }
    }
    else{
      setPlaylistAddingTo([playlist.playlist_id])       
    }
  };
  return (
    <TouchableOpacity className='flex-row items-center' onPress={onButtonToggle}>
        <View className=' ml-2 rounded-[10px] ' style={{ backgroundColor  : playlist.def_background }}>
           { playlist.playlist_img ? <Image source={{ uri : playlist.playlist_img }} style={{width : 60, height : 60, objectFit: "fill", borderRadius: 10}}/> : <Image source={require('@/assets/images/MasPlaylistDef.png')} style={{width : 60, height : 60, objectFit: "fill", borderRadius: 10, backgroundColor  : playlist.def_background }}/>}
        </View>
        <Text className='text-xl font-bold'> {playlist.playlist_name} </Text>
    </TouchableOpacity>
  )
}
export default RenderAddToUserPlaylistsListProgram