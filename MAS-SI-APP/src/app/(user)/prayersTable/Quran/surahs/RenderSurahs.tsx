import { View, Text, Pressable, TouchableOpacity } from 'react-native'
import React from 'react'
import { surahProp } from './Surahs'
import { Link } from 'expo-router'
import {Menu, MenuOptions, MenuOption, MenuTrigger,} from 'react-native-popup-menu';
import { Icon } from "react-native-paper"
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
type RenderSurahsProp = {
    surah : surahProp
    index : number
}

const RenderSurahs = ({ surah, index } : RenderSurahsProp) => {
    const { session } = useAuth()
    const addToLikedSurahs = async () => {
        const { error } = await supabase.from("user_liked_surahs").insert({ user_id : session?.user.id, surah_number : index + 1})
        if( error ){
            alert(error.message)
        }
    }
    const addToSurahBookmark = async () => {
        const { error } = await supabase.from("user_bookmarked_surahs").insert({ user_id : session?.user.id, surah_number : index + 1})
        if( error ){
            alert(error.message)
        }
    }
  const SurahPopupMenu = () => {
    return( 
    <Menu>
        <MenuTrigger>
            <Icon source={"dots-horizontal"} color='black' size={20}/>
        </MenuTrigger>
        <MenuOptions customStyles={{ optionsContainer: { borderRadius: 10 } }}>
            <MenuOption>
                <TouchableOpacity className='flex-row' onPress={addToLikedSurahs}>
                    <Icon source="cards-heart" color='red' size={20} />
                    <Text> Add to Favorites</Text>
                </TouchableOpacity>
            </MenuOption>
            <MenuOption>
                <TouchableOpacity className='flex-row' onPress={addToSurahBookmark}>
                    <Icon source="bookmark" color='black' size={20} />
                    <Text> Add to Bookmark</Text>
                </TouchableOpacity>
            </MenuOption>
        </MenuOptions>
    </Menu>
    )
  }
  return (
    <Link href={`prayersTable/Quran/surahs/${surah.number}`} asChild>
        <Pressable className='flex-row'>
        <View className='w-[50] h-[50] items-center justify-center'>
                <Text className='text-xl font-bold text-[#8a8a8a]'>{index + 1}</Text>
            </View>
            <View className='flex-col items-center justify-center w-[50%]'>
                <Text className='text-xl font-bold'>{surah.englishName}</Text>
                <View className='flex-row justify-center items-center'>
                    <Text className='text-xl font-bold'>{surah.numberOfAyahs} ayahs {surah.revelationType}</Text>
                </View>
            </View>
            <View className='justify-center w-[40%] flex-col'>
                <View className='items-end mr-5'>
                    <SurahPopupMenu />
                </View>
                <View className='items-center'>
                    <Text className='text-xl font-bold'>{surah.name}</Text>
                </View>
            </View>
        </Pressable>
    </Link>

  )
}

export default RenderSurahs