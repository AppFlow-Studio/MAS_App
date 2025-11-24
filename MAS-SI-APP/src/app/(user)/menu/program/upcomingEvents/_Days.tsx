import { View, Text, Pressable, FlatList, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { EventsType, Program } from '@/src/types'
import { AccordionItem } from './_Accordion'
import { Link } from 'expo-router'
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import Animated from 'react-native-reanimated'
import { Icon } from 'react-native-paper'
import { FlyerSkeleton } from '@/src/components/FlyerSkeleton'
import FlyerImageComponent from '@/src/components/FlyerImageComponent'
import EventImageComponent from '@/src/components/EventImageComponent'

const Days = ( {Programs , Day, Kids, Pace, Events, TodaysDate, index } : {Programs : Program[], Day : string, Kids : Program[], Pace : EventsType[], Events : EventsType[], TodaysDate : number, index : number }) => {
  const Section = useSharedValue(false);
  const [ rotateChevron , setRotateChevron ] = useState(false)
  const isToday = index === TodaysDate - 1;
  const totalItems = (Kids?.length || 0) + (Programs?.length || 0) + (Events?.length || 0) + (Pace?.length || 0);
  
  const onPress = () => {
    Section.value = !Section.value
    setRotateChevron(!rotateChevron)
  } 
  
  useEffect(() => {
    if (isToday) {
        Section.value = true
        setRotateChevron(true)
    }
  }, [])

  const chevronStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: withSpring(Section.value ? '90deg' : '0deg', { damping: 15, stiffness: 200 }) }],
    };
  });

  // Get day abbreviation for icon
  const dayAbbreviation = Day.substring(0, 3).toUpperCase();
  const dayColors = {
    'MON': { main: '#3B82F6', light: '#DBEAFE' },
    'TUE': { main: '#8B5CF6', light: '#EDE9FE' },
    'WED': { main: '#10B981', light: '#D1FAE5' },
    'THU': { main: '#F59E0B', light: '#FEF3C7' },
    'FRI': { main: '#EF4444', light: '#FEE2E2' },
    'SAT': { main: '#EC4899', light: '#FCE7F3' },
    'SUN': { main: '#06B6D4', light: '#CFFAFE' },
  };
  const dayColorData = dayColors[dayAbbreviation as keyof typeof dayColors] || { main: '#0D509D', light: '#DBEAFE' };
  const dayColor = dayColorData.main;
  const dayColorLight = dayColorData.light;

  return (
    <View className='flex-col w-[100%] mb-4'>
        <Pressable 
          onPress={onPress} 
          className='w-[100%] flex-row items-center rounded-3xl overflow-hidden mx-4'
          style={{
            backgroundColor: '#FFFFFF',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 5,
            borderWidth: isToday ? 2 : 0,
            borderColor: isToday ? dayColor : 'transparent',
          }}
        >
          {/* Icon Container */}
          <View 
            className='w-20 h-20 items-center justify-center'
            style={{ backgroundColor: isToday ? dayColorLight : '#F3F4F6' }}
          >
            <View 
              className='w-14 h-14 rounded-2xl items-center justify-center'
              style={{ backgroundColor: dayColor }}
            >
              <Text 
                className='font-bold text-white'
                style={{ fontSize: 20 }}
              >
                {dayAbbreviation}
              </Text>
            </View>
          </View>

          {/* Content Area */}
          <View className='flex-1 px-4 py-5'>
            <View className='flex-row items-center justify-between mb-1'>
              <Text 
                className='font-bold'
                style={{ 
                  color: '#1F2937',
                  fontSize: 20,
                  letterSpacing: 0.2,
                }}
              >
                {Day}
              </Text>
              <Animated.View style={chevronStyle}>
                <Icon size={20} source={'chevron-right'} color='#9CA3AF'/>
              </Animated.View>
            </View>
            
            {totalItems > 0 ? (
              <View className='flex-row items-center mt-1'>
                <View 
                  className='w-2 h-2 rounded-full mr-2'
                  style={{ backgroundColor: '#10B981' }}
                />
                <Text 
                  className='text-sm'
                  style={{ color: '#6B7280' }}
                >
                  {totalItems} {totalItems === 1 ? 'program' : 'programs'} scheduled
                </Text>
              </View>
            ) : (
              <Text 
                className='text-sm mt-1'
                style={{ color: '#9CA3AF' }}
              >
                No programs scheduled
              </Text>
            )}
          </View>
        </Pressable>
            <AccordionItem isExpanded={Section}  viewKey={Day} style={{ flexDirection:'column', gap: 24, width : '100%', alignItems : 'flex-start', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
            {
            Kids && Kids.length > 0 ? <>
                <View className='flex-row items-center mb-3'>
                  <View className='w-1 h-5 rounded-full mr-3' style={{ backgroundColor: '#F59E0B' }} />
                  <Text className='text-gray-800 font-semibold text-base'>Kids Programs</Text>
                </View>
                <FlatList 
                    data={Kids}
                    renderItem={({item}) => <FlyerImageComponent item={item} />
                }
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 16 }}
                />
            </> : <></>
            }
            {
            Programs && Programs.length > 0 ? <>
                <View className='flex-row items-center mt-2 mb-3'>
                  <View className='w-1 h-5 rounded-full mr-3' style={{ backgroundColor: '#0D509D' }} />
                  <Text className='text-gray-800 font-semibold text-base'>Programs</Text>
                </View>
                <FlatList 
                    data={Programs.filter(program => program.is_kids == false)}
                    renderItem={({item}) => <FlyerImageComponent item={item} /> }
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 16 }}
                /> 
            </> : <></>
            }
            {
              Events && Events.length > 0 ? <>
               <View className='flex-row items-center mt-2 mb-3'>
                  <View className='w-1 h-5 rounded-full mr-3' style={{ backgroundColor: '#10B981' }} />
                  <Text className='text-gray-800 font-semibold text-base'>Events</Text>
                </View>
                <FlatList 
                    data={Events}
                    renderItem={({item}) => <EventImageComponent item={item}/>}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 16 }}
                /> 
            </> : <></>
            }
            {
            Pace && Pace.length > 0 ? <>
              <View className='flex-row items-center mt-2 mb-3'>
                  <View className='w-1 h-5 rounded-full mr-3' style={{ backgroundColor: '#8B5CF6' }} />
                  <Text className='text-gray-800 font-semibold text-base'>PACE</Text>
                </View>
                <FlatList 
                    data={Pace}
                    renderItem={({item}) => <EventImageComponent item={item}/>}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 16 }}
                />
            </> : <></>
            }
            </AccordionItem>
    </View>
  )
}

export default Days