import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native'
import React from 'react'
import { Link, Stack } from 'expo-router'

export default function ProgramsButton() {
  return (
    <Link href={"menu/program/allPrograms"} asChild>
    <TouchableOpacity style={styles.ButtonBox} className='' >
        <ImageBackground 
            style={{width: 320, height: 150, borderRadius: 50}} 
            source={require("@/assets/images/programbutton4.png")}
            resizeMode='stretch'
        >
            <Text className='text-center text-2xl font-bold bg-[#0D509D] text-white opacity-1'>PROGRAMS</Text>
        </ImageBackground>
    </TouchableOpacity>
    </Link>
  )
}

const styles = StyleSheet.create({
    ButtonBox:{
        width: 200,
        height: 150,
        borderColor: "black",
        borderRadius: 50,
        backgroundColor: "white",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden"
    }
})