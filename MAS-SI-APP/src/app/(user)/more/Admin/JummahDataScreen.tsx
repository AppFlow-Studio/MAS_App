import { View, Text, ScrollView, TouchableOpacity, ImageBackground } from 'react-native'
import React from 'react'
import { IconButton } from 'react-native-paper'
import { Link, Stack } from 'expo-router'
const InfoIcon = () => {
    return(
      <IconButton 
        icon="information-outline"
        iconColor='#57BA47'
        size={25}
      />
    )
  } 
const JummahDataScreen = () => {

  return (
    <ImageBackground style={{width:"100%", height: '100%', justifyContent: "center", alignSelf : 'center', paddingBottom : '10%', backgroundColor : 'white', alignItems  : 'center'}} source={require("@/assets/images/jummahSheetBackImg.png")} resizeMode='stretch' imageStyle={{ borderRadius: 20, height: 450, marginTop : '30%' }}>
    <Stack.Screen options={{ 
        headerStyle : { backgroundColor : 'white'},
        headerTintColor : 'black',
        headerTitle : ''
    }}/>
    <View className="ml-14 mr-14 items-center"style={{height: 350}}>
        <ScrollView className='flex-col pt-3'  contentContainerStyle={{justifyContent: "center",  alignItems : "center", height: "100%" }} >
            <Link href={`/more/Admin/${1}`} asChild>
                <TouchableOpacity style={{height:75, width:250, shadowColor:"black", shadowOffset: { width: 0, height: 0},shadowOpacity: 1, shadowRadius: 8 }} className='justify-center rounded-lg bg-white' >
                <View className='flex-row'>
                    <InfoIcon />
                    <View className='flex-col items-center justify-center px-9'>
                    <Text>12:15PM</Text>
                    <Text className='font-bold'>Jummah 1</Text>
                    </View>
                </View>
                </TouchableOpacity>
            </Link>
            <Link href={`/more/Admin/${2}`} asChild>
                <TouchableOpacity style={{height:75, width:250, shadowColor:"black", shadowOffset: { width: 0, height: 0},shadowOpacity: 0.8, shadowRadius: 5}} className='justify-center rounded-lg  bg-white mt-3'>
                <View className='flex-row'>
                    <InfoIcon />
                    <View className='flex-col items-center justify-center px-9'>
                    <Text>1:00PM</Text>
                    <Text className='font-bold'>Jummah 2</Text>
                    </View>
                </View>
                </TouchableOpacity>
            </Link>

            <Link href={`/more/Admin/${3}`} asChild>
                <TouchableOpacity style={{height:75, width:250, shadowColor:"black", shadowOffset: { width: 0, height: 0},shadowOpacity: 0.8, shadowRadius: 5}} className='justify-center rounded-lg bg-white mt-3' >
                <View className='flex-row'>
                    <InfoIcon />
                    <View className='flex-col items-center justify-center px-9'>
                        <Text>1:45PM</Text>
                        <Text className='font-bold'>Jummah 3</Text>
                    </View>
                </View>
                </TouchableOpacity>
            </Link>

            <Link href={`/more/Admin/${4}`} asChild>
                <TouchableOpacity style={{height:75, width:250, shadowColor:"black", shadowOffset: { width: 0, height: 0},shadowOpacity: 0.8, shadowRadius: 5}} className='justify-center rounded-lg bg-white mt-3'>
                <View className='flex-row'>
                    <InfoIcon />
                    <View className='flex-col items-center justify-center px-3'>
                        <Text>3:40PM</Text>
                        <Text className='font-bold'>Student Jummah</Text>
                    </View>
                </View>
                </TouchableOpacity>
            </Link>
        </ScrollView>
    </View>
    </ImageBackground>
  )
}

export default JummahDataScreen