import { View, Text, Pressable, TouchableOpacity } from 'react-native'
import React from 'react'
import { ayahsProp } from '@/src/app/(user)/prayersTable/Quran/surahs/[surah_id]'
import {Menu, MenuOptions, MenuOption, MenuTrigger,} from 'react-native-popup-menu';
import { Icon } from 'react-native-paper';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
type RenderAyahProp = {
    ayah : ayahsProp
    english : ayahsProp
    index : number
    surah_id : string | string[] | undefined
}
 const RenderAyah = ( {ayah, english, index, surah_id} : RenderAyahProp) => {
    const { session } = useAuth()
    const addToLikedAyahs = async () => {
        const { error } = await supabase.from("user_liked_ayahs").insert({user_id : session?.user.id, surah_number : surah_id, ayah_number : index + 1})
        if( error ){
            console.log( error )
        }
    }
    const addToBookmarkAyah = async () => {
        const { error } = await supabase.from("user_bookmarked_ayahs").insert({ user_id : session?.user.id, surah_number : surah_id, ayah_number : index + 1})
        if( error ){
            alert(error.message)
        }
    }
    const PopupMenu = () => {
        return( 
            <Menu>
                <MenuTrigger>
                    <Icon source={"dots-horizontal"} color='black' size={20}/>
                </MenuTrigger>
                <MenuOptions customStyles={{ optionsContainer: { borderRadius: 10 } }}>
                    <MenuOption>
                        <TouchableOpacity className='flex-row' onPress={addToLikedAyahs}>
                            <Icon source="cards-heart" color='red' size={20} />
                            <Text> Add to Favorites</Text>
                        </TouchableOpacity>
                    </MenuOption>
                    <MenuOption>
                    <TouchableOpacity className='flex-row' onPress={addToBookmarkAyah}>
                        <Icon source="bookmark" color='black' size={20} />
                        <Text> Add to Bookmark</Text>
                    </TouchableOpacity>
                </MenuOption>
                </MenuOptions>
            </Menu>
        )
    }
  return (
    <View className='flex-row items-center justify-center'>
        <View className='flex-col  justify-center w-[100%] mx-2'>
            <View className='flex-row justify-between'>
                <Text className='text-xl font-bold text-[#8a8a8a]'>{surah_id}:{index + 1}</Text>
                <PopupMenu />
            </View>
            <Text className='text-xl font-bold text-right'>{ayah.text}</Text>
            <Text className='text-left mt-1'>{english.text}</Text>
        </View>
       
    </View>
  )
}

export default RenderAyah