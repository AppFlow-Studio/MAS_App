import { View, Text, Linking, Pressable, FlatList } from 'react-native'
import React from 'react'
import X from '@/src/components/Icons/X';
import WhatsApp from '@/src/components/Icons/Whatsapp';
import Instagram from '@/src/components/Icons/Instagram';
import TikTok from '@/src/components/Icons/Tiktok';
import Meta from '@/src/components/Icons/Meta';
import YouTube from '@/src/components/Icons/Youtube';
export default function SocialPlatforms() {
    const MasjidPlatforms : { platform : any, link : string, name : string, bg: string }[]= [
        { platform : <TikTok />, link : '', name : 'TikTok', bg : '#000' },
        { platform : <YouTube />, link : '', name : 'YouTube', bg : '#FFF' },
        { platform : <WhatsApp />, link : '', name : 'WhatsApp', bg : '#00E676' },
        { platform : <Meta />, link : '' , name : 'Meta', bg : 'white'},
        { platform : <X />, link : '', name : 'X' , bg : '#000'},
        { platform : <Instagram />, link : '', name : 'Instagram' , bg : 'bg-custom-gradient'},
    ]
  return (
    <View className='w-[100%] flex-1 p-2 pb-10 '>
       <FlatList 
        horizontal
        data={MasjidPlatforms}
        renderItem={({item}) => (
            <View className='flex-col flex'>
            <Pressable
              onPress={() => console.log(`Navigating to: ${item.link}`)}
              className=' w-[100] h-[100] rounded-full items-center  justify-center p-2'
              style={{ backgroundColor : item.bg }}
            >
              {item.platform}
            </Pressable>
           <Text className='text-gray-400 text-sm text-center mt-1'>{item.name}</Text>
           </View>
        )}
       />
    </View>
  )
}

//const onPress = () => Linking.canOpenURL(platform.link).then(() => {
   // Linking.openURL(platform.link);
//});

{/*
    MasjidPlatforms.map((item) => (
        <View className='flex-col flex'>
        <Pressable
          onPress={() => console.log(`Navigating to: ${item.link}`)}
          className=' w-[100] h-[100] rounded-full items-center  justify-center p-2'
          style={{ backgroundColor : item.bg }}
        >
          {item.platform}
        </Pressable>
       <Text className='text-gray-400 text-sm text-center mt-1'>{item.name}</Text>
       </View>
    ))
*/}