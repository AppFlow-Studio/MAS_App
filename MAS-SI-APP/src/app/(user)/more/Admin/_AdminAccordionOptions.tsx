import { View, Text, Pressable } from 'react-native'
import React, { useState } from 'react'
import { useSharedValue } from 'react-native-reanimated';
import { Icon } from 'react-native-paper';
import { AccordionItem } from '../../menu/program/upcomingEvents/_Accordion';
import { Link } from 'expo-router';
import Svg, { Path } from 'react-native-svg';

type AdminOptions = {
    title : string, 
    screens : { buttonTitle : string, link : string }[] 
}
const AdminAccordionOptions = ({ options, index } : { options : AdminOptions, index : number }) => {
  const Section = useSharedValue(false);
  const [ rotateChevron , setRotateChevron ] = useState(false)
  const onPress = () => {
    Section.value = !Section.value
    setRotateChevron(!rotateChevron)
  } 

  return (
    <View className='flex-col p-2 w-[100%] gap-1'>
        <Pressable onPress={onPress} className='w-[90%] justify-between flex-row pl-5 rounded-xl self-center' style={{ backgroundColor : index % 2 == 0 ?  '#6077F5' : '#6077F5'}}>
            <Text className='font-semibold text-lg text-white'>{options.title}</Text>
            <View style={{ transform : [{ rotate : rotateChevron ?  '90deg' : '0deg' }] }}>
                <Icon size={30} source={'chevron-right'} color='white'/>
            </View>
        </Pressable>
        <AccordionItem isExpanded={Section}  viewKey={index} style={{ flexDirection:'column', gap: 20, width : '100%', alignItems : 'flex-start' }}>
            {
                options.screens.map((screen) => (
                    <Link href={screen.link} asChild>
                        <Pressable className=' w-[80%] bg-[#BBBEC6] flex flex-row justify-between px-2 rounded-xl p-2 my-1'>
                            <Text className='text-gray-500 font-medium text-left text-[10px]' numberOfLines={1}>{screen.buttonTitle}</Text>
                            <Svg width="16" height="11" viewBox="0 0 16 11" fill="none">
                                <Path d="M11.5 1L15 5.5M15 5.5L11.5 10M15 5.5H1" stroke="#6077F5" stroke-linecap="round"/>
                            </Svg>
                        </Pressable>
                    </Link>
                ))
            }
        </AccordionItem>
    </View>
  )
}

export default AdminAccordionOptions