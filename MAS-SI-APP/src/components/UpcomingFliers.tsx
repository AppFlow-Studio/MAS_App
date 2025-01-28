import { View, Text, Image, Pressable } from 'react-native'
import React from 'react'
import { EventsType, Program, UserPlaylistType } from '../types'
import { Link } from 'expo-router'
type UpcomingProgramFliersProp = {
    program : Program
}
const UpcomingProgramFliers = ( {program} : UpcomingProgramFliersProp) => {
  return (
    <Link  href={`/menu/program/${program.program_id}`} asChild>
        <Pressable style={{justifyContent: "center", alignItems: "center", backgroundColor: "white", borderRadius: 15, shadowColor : "black", shadowOffset : {width : 0, height : 1}, shadowOpacity : 1, shadowRadius :1}} className=''>
        <Image 
            source={ program.program_img ? { uri: program.program_img } : require("@/assets/images/MASHomeLogo.png")}
            style={{width: 130, height: 130, objectFit: "fill", borderRadius: 15}}
            className=''
        />
        </Pressable>
    </Link>
  )
}

type UpcomingEventFliersProp = {
    event : EventsType
}

export const UpcomingEventFliers = ( {event} : UpcomingEventFliersProp) => {
    return (
      <Link  href={`/menu/events/${event.event_id}`} asChild>
          <Pressable style={{justifyContent: "center", alignItems: "center", backgroundColor: "white", borderRadius: 15, shadowColor : "black", shadowOffset : {width : 0, height : 0}, shadowOpacity : 1, shadowRadius :1.5}} className=''>
          <Image 
              source={ event.event_img ? { uri: event.event_img } : require("@/assets/images/MASHomeLogo.png")}
              style={{width: 130, height: 130, objectFit: "fill", borderRadius: 15}}
              className=''
          />
          </Pressable>
      </Link>
    )
  }

type UpcomingKidsFliersProp = {
    kids : Program
}
export const UpcomingKidsFliers = ( {kids} : UpcomingKidsFliersProp) => {
    return (
        <Link  href={`/menu/program/${kids.program_id}`} asChild>
            <Pressable style={{justifyContent: "center", alignItems: "center", backgroundColor: "white", borderRadius: 15, shadowColor : "black", shadowOffset : {width : 0, height : 0}, shadowOpacity : 1, shadowRadius :1.5}} className=''>
            <Image 
                source={ kids.program_img ? { uri: kids.program_img } : require("@/assets/images/MASHomeLogo.png")}
                style={{width: 130, height: 130, objectFit: "fill", borderRadius: 15}}
                className=''
            />
            </Pressable>
        </Link>
    )
}
type UserPlaylistFliersProp = {
    playlist : UserPlaylistType
}
export const UserPlaylistFliers = ( {playlist} : UserPlaylistFliersProp ) => {
    return (
        <Link  href={`/myPrograms/playlists/${playlist.playlist_id}`} asChild>
            <Pressable style={{justifyContent: "center", alignItems: "center", backgroundColor: "white", borderRadius: 15, shadowColor : "black", shadowOffset : {width : 0, height : 0}, shadowOpacity : 1, shadowRadius :1.5}} className=''>
            <Image 
                source={ playlist.playlist_img ? { uri: playlist.playlist_img } : require("@/assets/images/MASHomeLogo.png")}
                style={{width: 130, height: 130, objectFit: "cover", borderRadius: 15}}
                className=''
            />
            </Pressable>
        </Link>
    )
}
export default UpcomingProgramFliers