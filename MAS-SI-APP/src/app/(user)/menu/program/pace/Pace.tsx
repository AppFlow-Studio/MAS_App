import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import { Divider } from 'react-native-paper'
import RenderEvents from '@/src/components/EventsComponets/RenderEvents'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import PaceFlyers from '@/src/components/PaceComponents/PaceFlyers'

const Pace = () => {
  const tabBarHeight = useBottomTabBarHeight() + 35
  return (
    <View className='bg-[#0D509D] flex-1 '>
    <View className='bg-white pt-2 mt-1 flex-1'style={{borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingBottom: tabBarHeight }}>
    <View className='mb-5'/>
    <FlatList 
        data={[1,2,3,4,5,6]}
        renderItem={({item}) => (
             <PaceFlyers/>
        )}
        ItemSeparatorComponent={() => <Divider style={{width: "50%", alignSelf: "center", height: 0.5, backgroundColor : 'lightgray'}}/>}
        contentContainerStyle={{rowGap: 15}}
      />
    </View>
  </View>
  )
}

export default Pace