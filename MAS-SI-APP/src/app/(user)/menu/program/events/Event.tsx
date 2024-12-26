import { View, Text, ScrollView, TouchableOpacity, Image, Pressable, RefreshControl } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useAuth } from '@/src/providers/AuthProvider'
import { supabase } from '@/src/lib/supabase'
import { EventsType } from '@/src/types'
import { FlatList } from 'react-native'
import RenderEvents from '@/src/components/EventsComponets/RenderEvents'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { Divider, Icon, Searchbar } from "react-native-paper"
import { Link } from 'expo-router'
import { useSharedValue } from 'react-native-reanimated'
import { AccordionItem } from '../upcomingEvents/_Accordion'
const Event = () => {
  const tabBarHeight = useBottomTabBarHeight() + 35
  const [ eventsData, setEventsData ] = useState<EventsType[]>()
  const [ prevEventsData, setPrevEventsData ] = useState<EventsType[]>()
  const [ searchBarInput, setSearchBarInput ] = useState("")
  const pastEventsAccordionValue = useSharedValue(false)
  const [ pastChevronValue, setPastChevronValue ] = useState(false)
  const specialEventsAccordionValue = useSharedValue(false)
  const [ specialEventsChev, setSpecialEventsChev ] = useState(false)
  const [refreshing, setRefreshing] = React.useState(false);
  const  fetchEventsData =  async () => {
    setRefreshing(true)
    const date = new Date()
    const isoString = date.toISOString()
    const { data : CurrentEvents , error } = await supabase.from("events").select("*").eq('pace', false).gte('event_end_date', isoString)
    const { data : PastRecordedEvents , error : PastError } = await supabase.from('events').select('*').eq('has_lecture', true).eq('pace', false).lte('event_end_date', isoString)
    if( error ) {
      console.log(error)
    }
    if( CurrentEvents ){
      setEventsData(CurrentEvents)
    }
    if( PastRecordedEvents ){
      setPrevEventsData(PastRecordedEvents)
    }
    setRefreshing(false)
  }


  useEffect(() => {
    fetchEventsData()
  }, [])
  return (
    <View className='bg-[#0D509D] flex-1 '>
      <ScrollView style={{borderTopLeftRadius: 40, borderTopRightRadius: 40, height : '100%', backgroundColor : 'white'}} contentContainerStyle={{
      paddingTop : 2, backgroundColor : 'white',  paddingBottom : tabBarHeight + 30}}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={ async () =>  await fetchEventsData()}/>}
      >      
         <View className='mt-5 w-[100%]'>
          <Text className='font-bold text-black text-lg ml-3 mb-8'>Current Events</Text>
          <View className='flex-row flex flex-wrap gap-y-5 mb-[61]'>
            {
              eventsData?.map((item) => (
                <View style={{ width: "50%"}}>
                  <Link  href={ `/menu/program/events/${item.event_id}`}
                      asChild >
                      <TouchableOpacity className='items-center'>
                          <View style={{flexDirection: "column",alignItems: "center", justifyContent: "center"}}>
                              <View style={{justifyContent: "center", alignItems: "center", backgroundColor: "white", borderRadius: 15}}>
                                  <Image 
                                      source={{ uri: item.event_img || require('@/assets/images/MASHomeLogo.png') }}
                                      style={{width: 150, height: 150, objectFit: "cover", borderRadius: 15}}                                    
                                  />
                              </View>
                              <View>
                                  <View className='mt-2 items-center justify-center bg-white w-[80%] self-center'>
                                      <Text style={{textAlign: "center"}} className='text-md text-center' numberOfLines={1} >{item.event_name}</Text>
                                  </View>
                              </View>
                          </View>
                      </TouchableOpacity>
                  </Link>
              </View>
              ))
            }
          </View>
          <Divider className='h-[0.5] w-[70%] self-center'/>

          <Pressable className='w-[100%] justify-between flex flex-row pr-3 mt-2' onPress={() => { specialEventsAccordionValue.value = !specialEventsAccordionValue.value; setSpecialEventsChev(!specialEventsChev)}}>
            <Text className={`font-bold text-black text-lg ml-3 ${!specialEventsChev ? 'mb-[61]' : 'mb-0'}`}>Special Events</Text>
            <View style={{ transform : [{ rotate : specialEventsChev ? '90deg' : '0deg'}]}}>
              <Icon  source={'chevron-right'} size={30} color='gray'/>
            </View>
          </Pressable>
          <AccordionItem isExpanded={specialEventsAccordionValue} style={{}} viewKey={'Past'}>
            <View className='w-[100%] '>
              <Text className='text-left ml-3 mb-[61] mt-[23] font-bold'>Outreach Activities: </Text>
            </View>
            <Divider className='h-[0.5] w-[70%] self-center'/>
            <View className='w-[100%] mb-[61] mt-[23]'>
              <Text className='text-left ml-3 font-bold'>Reverts Event: </Text>
            </View>
            <Divider className='h-[0.5] w-[70%] self-center'/>
            <View className='w-[100%] mb-[61] mt-[23]'>
              <Text className='text-left ml-3 font-bold'>Fundrasing: </Text>
            </View>
          </AccordionItem>
          <Divider className='h-[0.5] w-[70%] self-center'/>


          <Pressable className='w-[100%] justify-between flex flex-row pr-3 mt-2' onPress={() => {pastEventsAccordionValue.value = !pastEventsAccordionValue.value; setPastChevronValue(!pastChevronValue)} }>
            <Text className={`font-bold text-black text-lg ml-3 ${!pastChevronValue ? 'mb-[61]' : 'mb-0'}`}>Past Recorded Events</Text>
            <View style={{ transform : [{ rotate : pastChevronValue ? '90deg' : '0deg'}]}}>
              <Icon  source={'chevron-right'} size={30} color='gray'/>
            </View>
          </Pressable>
          <AccordionItem isExpanded={pastEventsAccordionValue} style={{}} viewKey={'Past'}>
          
          <View className='flex-row flex flex-wrap gap-y-5 mt-7'>
            {
              prevEventsData?.map((item) => (
                <View style={{ width: "50%"}}>
                  <Link  href={ `/menu/program/events/${item.event_id}`}
                      asChild >
                      <TouchableOpacity className='items-center'>
                          <View style={{flexDirection: "column",alignItems: "center", justifyContent: "center"}}>
                              <View style={{justifyContent: "center", alignItems: "center", backgroundColor: "white", borderRadius: 15}}>
                                  <Image 
                                      source={{ uri: item.event_img || require('@/assets/images/MASHomeLogo.png') }}
                                      style={{width: 150, height: 150, objectFit: "cover", borderRadius: 15}}                                    
                                  />
                              </View>
                              <View>
                                  <View className='mt-2 items-center justify-center bg-white w-[80%] self-center'>
                                      <Text style={{textAlign: "center"}} className='text-md text-center' numberOfLines={1} >{item.event_name}</Text>
                                  </View>
                              </View>
                          </View>
                      </TouchableOpacity>
                  </Link>
              </View>
              ))
            }
          </View>
          </AccordionItem>
        </View>
      </ScrollView>
    </View>
  )
}

export default Event