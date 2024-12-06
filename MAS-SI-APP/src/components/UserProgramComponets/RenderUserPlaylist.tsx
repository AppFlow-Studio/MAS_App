import { View, Text, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import { Link } from "expo-router"
import { defaultProgramImage } from '../ProgramsListProgram'
import { UserPlaylistType } from '@/src/types'
type RenderUserPlaylistProp = {
    playlist : UserPlaylistType
}
const RenderUserPlaylist = ({ playlist } : RenderUserPlaylistProp) => {
  console.log(playlist)
  return (
        <Link  href={`/myPrograms/playlists/${playlist.playlist_id}`} asChild className='items-center h-[170] w-[100%]'>
            <TouchableOpacity>
                <View className='flex-col item-center px-2'>
                    <View style={{justifyContent: "center", alignItems: "center", borderRadius: 15, width: "30%",}}>
                               { playlist.playlist_img ? <Image 
                                    source={{ uri: playlist.playlist_img || defaultProgramImage }}
                                    style={{width: 160, height: 140, objectFit: "fill", borderRadius: 8}}
                                />
                                :
                                    <View style={{ height : 140, width : 160, borderRadius : 20, alignItems : 'center', justifyContent : 'center', backgroundColor : playlist.def_background }} >
                                        <Image source={require('@/assets/images/MasPlaylistDef.png')} style={{height : '70%', width : '70%', objectFit : 'fill'}} />
                                    </View>
                            }
                    </View>
                    <View className='items-center justify-center w-[70%]'>
                        <Text className='text-xl font-bold' numberOfLines={1} allowFontScaling adjustsFontSizeToFit> {playlist.playlist_name} </Text>
                    </View>
                </View>
                
            </TouchableOpacity>
        </Link>
  )
}

export default RenderUserPlaylist