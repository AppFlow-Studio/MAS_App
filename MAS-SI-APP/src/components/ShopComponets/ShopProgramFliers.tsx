import { View, Text, Image, Pressable } from 'react-native'
import React from 'react'
import { Link } from 'expo-router'
type ShopProgramFliersProp = {
    width : number
    program_id : string
    img : string | null
}
const ShopProgramFliers = ({ width, program_id, img } : ShopProgramFliersProp) => {
  
  return (
    <Link href={`more/ProgramsPage/${program_id}`} asChild>
        <Pressable style={{ width : 170, height : 150, alignItems : "center", marginTop : 12 }} className=''>
            <Image
            source={ img ? { uri : img  }  :require("@/assets/images/MASHomeLogo.png")}
            style={{ width : 170, height : 150, objectFit: "fill", borderRadius: 15 }}
            />
        </Pressable>
    </Link>
  )
}

export default ShopProgramFliers