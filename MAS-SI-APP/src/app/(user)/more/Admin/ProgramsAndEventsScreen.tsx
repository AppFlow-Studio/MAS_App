import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { Link } from 'expo-router'

const ProgramsAndEventsScreen = () => {
  const ProgramAndEvents =[
    {
      name: "Program And Events 1",
      description: "This is dummy static Program And Events 1",
      date:'18/10/2024'
    },
    {
      name: "Program And Events 2",
      description: "This is dummy static Program And Events 2 ",
      date:'18/10/2024'
    },
    {
      name: "Program And Events 3",
      description: "This is dummy static Program And Events 3",
      date:'18/10/2024'
    },
  ]
  return (
    <View className='flex-1'>
      <Text className="font-bold text-2xl p-4 ">Programs and Events</Text>
      <View>
        <FlatList 
        data={ProgramAndEvents}
        renderItem={({item}) =>(
          <View style={{marginHorizontal: 5}}>
          <Link  href={{pathname: '/(user)/more/Admin/ProgramsEventNotificationScreen', params: {name: item.name}}}

              asChild >
              <TouchableOpacity>
                      <View>
                          <View className='mt-2 self-center justify-center bg-white p-4' style={{ borderRadius: 20, width: '90%'}}>
                              <Text className='text-xl text-black font-bold '>{item.name}</Text>
                              <Text className='my-2  text-sm text-black font-bold' numberOfLines={1}>{item.description}</Text>
                              <Text className='my-2  text-sm text-black' numberOfLines={1}>{item.date}</Text>
                          </View>
                      </View>
              
              </TouchableOpacity>
          </Link>
      </View>
        )}
        />
      </View>

    </View>
  )
}

export default ProgramsAndEventsScreen

const styles = StyleSheet.create({})