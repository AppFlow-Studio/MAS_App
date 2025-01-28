import { View, Text, Image, Pressable } from 'react-native'
import React from 'react'
import { Program } from '@/src/types'
import { Link } from 'expo-router'

type PopularProgramsFlierProp = {
    program : Program
    width : number
    height : number
}
const PopularProgramsFlier = ({ program, width, height }: PopularProgramsFlierProp) => {
  return (
    <Link href={`/more/ProgramsPage/${program.program_id}`} asChild>
        <Pressable className='flex-col gap-y-1' style={{ width : width / 2.5 }}>
            <Image 
                source={ program.program_img ? { uri : program.program_img} : require("@/assets/images/MASHomeLogo.png")}
                style={{ borderRadius : 10, height : height / 2.5, width : width / 2.5 }}
            />
            <View>
                <Text className='text-center font-bold'>{program.program_name}</Text>
            </View>
            <View>
                <Text className='text-center text-gray-400'>${program.program_price}/month</Text>
            </View>
        </Pressable>
    </Link>
  )
}

export default PopularProgramsFlier