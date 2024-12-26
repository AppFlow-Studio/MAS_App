import { View, Text, Pressable, FlatList, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { EventsType, Program } from '@/src/types'
import { AccordionItem } from './_Accordion'
import { Link } from 'expo-router'
import { useSharedValue } from 'react-native-reanimated'
import { Icon } from 'react-native-paper'


const Days = ( {Programs , Day, Kids, Pace, Events, TodaysDate, index } : {Programs : Program[], Day : string, Kids : Program[], Pace : EventsType[], Events : EventsType[], TodaysDate : number, index : number }) => {
  const Section = useSharedValue(false);
  const [ rotateChevron , setRotateChevron ] = useState(false)
  const onPress = () => {
    Section.value = !Section.value
    setRotateChevron(!rotateChevron)
  } 
  useEffect(() => {
    if ( index == TodaysDate  - 1) {
        Section.value = true
        setRotateChevron(true)
    }
  }, [])
  return (
    <View className='flex-col p-2 w-[100%] gap-1'>
        <Pressable onPress={onPress} className='w-[100%] justify-between flex-row'>
            <Text className='font-bold text-xl'>{Day}</Text>
            <View style={{ transform : [{ rotate : rotateChevron ?  '90deg' : '0deg' }] }}>
                <Icon size={30} source={'chevron-right'} color='gray'/>
            </View>
        </Pressable>
            <AccordionItem isExpanded={Section}  viewKey={Day} style={{ flexDirection:'column', gap: 20, width : '100%', alignItems : 'flex-start' }}>
            {
            Kids && Kids.length > 0 ? <>
                <Text className='text-black text-left border self-start text-[15px]'>Kids Programs: </Text>
                <FlatList 
                    data={Kids}
                    renderItem={({item}) => (
                        <Link href={`/menu/program/${item.program_id}`} asChild>
                            <Pressable className='flex-col'>
                                <Image source={{ uri : item.program_img || undefined }} style={{ width : 150, height : 150, borderRadius : 8, margin : 5 }}/>
                                <Text className='text-gray-500 font-medium text-left pl-2 text-[10px]' numberOfLines={1}>{item.program_name}</Text>
                            </Pressable>
                        </Link>
                    )}
                    horizontal
                />
            </> : <></>
            }
            {
            Programs && Programs.length > 0 ? <>
                <Text className='text-black mt-4 mb-4 self-start text-[15px]'>Programs: </Text>
                <FlatList 
                    data={Programs}
                    renderItem={({item}) => (
                        <Link href={`/menu/program/${item.program_id}`} asChild>
                            <Pressable className='flex-col'>
                                <Image source={{ uri : item.program_img || undefined }} style={{ width : 150, height : 150, borderRadius : 8, margin : 5 }}/>
                                <Text className='text-gray-500 font-medium text-[10px] pl-2' numberOfLines={1}>{item.program_name}</Text>
                            </Pressable>
                        </Link>
                    )}
                    horizontal
                /> 
            </> : <></>
            }
            {
              Events && Events.length > 0 ? <>
               <Text className='text-black mt-4 mb-4 self-start text-[15px]'>Events: </Text>
                <FlatList 
                    data={Events}
                    renderItem={({item}) => (
                        <Link href={`/menu/program/events${item.event_id}`} asChild>
                            <Pressable className='flex-col'>
                                <Image source={{ uri : item.event_img || undefined }} style={{ width : 150, height : 150, borderRadius : 8, margin : 5 }}/>
                                <Text className='text-gray-500 font-medium text-[10px] pl-2' numberOfLines={1}>{item.event_name}</Text>
                            </Pressable>
                        </Link>
                    )}
                    horizontal
                /> 
            </> : <></>
            }
            {
            Pace && Pace.length > 0 ? <>
              <Text className='text-black mt-4 mb-4 self-start text-[15px]'>Pace:</Text>
                <FlatList 
                    data={Pace}
                    renderItem={({item}) => (
                        <Link href={`/menu/program/events/${item.event_id}`} asChild>
                            <Pressable className='flex-col'>
                                <Image source={{ uri : item.event_img || undefined }} style={{ width : 150, height : 150, borderRadius : 8, margin : 5 }}/>
                                <Text className='text-gray-500 font-medium text-[10px] pl-2' numberOfLines={1}>{item.event_name}</Text>
                            </Pressable>
                        </Link>
                    )}
                    horizontal
                />
            </> : <></>
            }
            </AccordionItem>
    </View>
  )
}

export default Days