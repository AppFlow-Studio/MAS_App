import { Image, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { TouchableOpacity } from 'react-native'
import { Link } from 'expo-router'

const PaceFlyers = () => {
  return (
    <View>
      <Link  href={`/menu/program/pace/PaceFlyerDetails`} asChild>
        <TouchableOpacity>
            <View className='flex-row item-center justify-center'>
                    <Image source={{uri:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQg_7JzUkZJrybZdO44EKshHqhwmcWj7dKdFA&s'}}     
                    style={{width: 130, height: 100, objectFit: "fill", borderRadius: 8}}
               />
                      <View className='mt-2 items-center justify-center bg-white' style={{ borderRadius: 20, marginLeft: "10%", width: 200}}>
                          <Text style={{textAlign: "center", fontWeight: "bold"}}>Pace Name </Text>
                          <Text style={{textAlign: "center"}}>By: DR Zakir Naike</Text>
                      </View>
                </View>
               </TouchableOpacity>
               </Link>
    </View>
  )
}

export default PaceFlyers

const styles = StyleSheet.create({})