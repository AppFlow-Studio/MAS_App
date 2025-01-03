import { View, Text, Pressable, Image, ScrollView, KeyboardAvoidingView, useWindowDimensions } from 'react-native'
import React, { useEffect, useState } from 'react'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import Svg, { Path } from 'react-native-svg'
import { TextInput } from 'react-native-paper'
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from 'expo-file-system';
import Toast from 'react-native-toast-message'
import { decode } from 'base64-arraybuffer'
const handleSubmit = () => {
    Toast.show({
      type: "success",
      text1: "Speaker/Sheik Successfully Updated",
      position: "top",
      topOffset: 50,
      visibilityTime: 2000,
    });
};
const EditSpeakerInfo = () => {
  const { speaker_id, speaker_name, speaker_img, speaker_creds  } = useLocalSearchParams<{ speaker_id : string, speaker_name : string, speaker_img : string, speaker_creds : string[]}>()
  const [ speakerName, setSpeakerName ] = useState<string>(speaker_name as string)
  const [ speakerCreds, setSpeakerCreds ] = useState<string[]>()
  const [ speakerImg, setSpeakerImg ] = useState<string>(speaker_img as string)
  const [ uploadedImg, setUploadedImg ] = useState<ImagePicker.ImagePickerAsset>()
  const [ newCred, setNewCred ] = useState<string>('')
  const [ pressAddCred, setPressAddCred ] = useState(false) 
  const tabHeight = useBottomTabBarHeight() + 30
  const layoutHeight = useWindowDimensions().height
  const getCreds = async ( ) => {
    const { data , error } = await supabase.from('speaker_data').select('speaker_creds').eq('speaker_id', speaker_id).single()
    if( data?.speaker_creds ){
        setSpeakerCreds(data.speaker_creds)
    }
  }
  const pickImage = async () => {
        const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
        alert("Permission to access camera roll is required!");
        return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        });
        if (!result.canceled && result.assets) {
        const img = result.assets[0]

        setUploadedImg(img);
        }
  };

  const onUpdate = async () => {
    if( uploadedImg ){
        const base64 = await FileSystem.readAsStringAsync(uploadedImg.uri, { encoding: 'base64' });
        if( speakerName == speaker_name ){
            const filePath = `${speakerName.trim().split(" ").join("_")}.${uploadedImg.type === 'image' ? 'png' : 'mp4'}`;
            const { data : image, error :image_upload_error } = await supabase.storage.from('sheikh_img').update(filePath, decode(base64));
            const { error } = await supabase.from('speaker_data').update({ speaker_name : speakerName, speaker_creds : speakerCreds }).eq('speaker_id', speaker_id)
            handleSubmit()
            router.back()
        return
        }
        const filePath = `${speakerName.trim().split(" ").join("_")}.${uploadedImg.type === 'image' ? 'png' : 'mp4'}`;
        const { error : remove} = await supabase.storage.from('sheikh_img').remove([`${speaker_name.trim().split(" ").join("_")}.png`]);
        const { data : image, error :image_upload_error } = await supabase.storage.from('sheikh_img').upload(filePath, decode(base64));
        if( image ){
            const { data : speakerimage} = await supabase.storage.from('sheikh_img').getPublicUrl(image?.path)
            const { error } = await supabase.from('speaker_data').update({ speaker_name : speakerName, speaker_creds : speakerCreds, speaker_img : speakerimage }).eq('speaker_id', speaker_id)
        }
    }
    if( speakerCreds && speakerName ){
        const { error } = await supabase.from('speaker_data').update({ speaker_name : speakerName, speaker_creds : speakerCreds }).eq('speaker_id', speaker_id)
        handleSubmit()
    }
    return
  }
  useEffect(() => {
    getCreds()
  }, []);
  return (
         <View className='flex-1 grow bg-white pt-[220px]' style={{ paddingBottom : tabHeight }}>
            <Stack.Screen 
            options={{
                headerTransparent : true,
                header : () => (
                <View className="relative">
                    <View className="h-[110px] w-[100%] rounded-br-[65px] bg-[#5E636B] items-start justify-end pb-[5%] z-[1]">
                    <Pressable className="flex flex-row items-center justify-between w-[65%]" onPress={() => router.dismiss(2)}>
                        <Svg width="29" height="29" viewBox="0 0 29 29" fill="none">
                        <Path d="M18.125 7.25L10.875 14.5L18.125 21.75" stroke="#1B85FF" stroke-width="2"/>
                        </Svg>
                        <Text className=" text-[25px] text-white">Speakers & Sheiks</Text>
                    </Pressable>
                    </View>
                    <View className="h-[120px] w-[100%] rounded-br-[65px] bg-[#BBBEC6] items-start justify-end pb-[5%] absolute top-[50]">
                    <View className="w-[75%] items-center"> 
                    <Text className=" text-[15px] text-black ">Edit Speaker & Sheik Info</Text>
                    </View>
                    </View>
                    <View className="h-[120px] w-[100%] rounded-br-[65px] bg-[#E3E3E3] items-start justify-end pb-[5%] absolute top-[100] z-[-1]">
                    <Pressable className="w-[100%] items-center flex flex-row px-6" onPress={() => router.back()}> 
                        <View className='w-[10%]'>
                            <Svg  width="16" height="9" viewBox="0 0 16 9" fill="none">
                                <Path d="M4.5 8.22607L1 4.61303M1 4.61303L4.5 0.999987M1 4.61303H15" stroke="#6077F5" stroke-linecap="round"/>
                            </Svg>
                        </View>
                        <View><Text className=" text-[15px] text-black " numberOfLines={1} adjustsFontSizeToFit>{speaker_name}</Text></View>
                    </Pressable>
                    </View>
                </View>
                )
            }}
            />
            <View className='px-4'>
                <Text className='font-bold text-black text-lg my-1'>Upload Speaker Image </Text>
                <Pressable className={`max-h-[20%] w-[90%] ${!speakerImg ? 'border-2 border-dotted border-[#6077F5]' : ' my-3' } items-center justify-center self-center rounded-[15px]`} onPress={pickImage}>
                    {
                    uploadedImg ? 
                        <Image src={uploadedImg.uri} style={{width: 110, height: 110, borderRadius: 50}}/>
                    :
                    speakerImg ? 
                        <Image src={speakerImg as string} style={{width: 110, height: 110, borderRadius: 50}}/>
                    :
                    <Svg width="55" height="55" viewBox="0 0 55 55" fill="none">
                        <Path d="M27.5 18.3333L27.5 36.6666" stroke="#6077F5" stroke-linejoin="round"/>
                        <Path d="M36.668 27.5L18.3346 27.5" stroke="#6077F5" stroke-linejoin="round"/>
                    </Svg>
                    }
                </Pressable>

                <Text className='font-bold text-black text-md my-1'>Title & Full Name</Text>
                <TextInput
                mode="outlined"
                theme={{ roundness: 10 }}
                style={{ width: "100%", height: 45, marginBottom: 10, backgroundColor  : 'white' }}
                activeOutlineColor="#0D509D"
                value={speakerName}
                onChangeText={setSpeakerName}
                placeholder="Enter The Name..."
                textColor="black"
                />

                <Text className='font-bold text-black text-md my-1'>Credentials</Text>
               <View className='max-h-[32%] border border-gray-400 border-solid rounded-[15px] p-4'>
                    <ScrollView contentContainerStyle={{  }}>
                        {
                            speakerCreds ? speakerCreds?.map((item, index) => (
                                <Pressable onPress={ () => {
                                    const removeFromCred = speakerCreds.filter(cred => cred != item)
                                    setSpeakerCreds(removeFromCred)
                                } }
                                key={index}
                                >
                                    <Text numberOfLines={3}>* {item}</Text>
                                    <View className='h-[0.5] bg-black w-[70%] self-center my-2 '/>
                                </Pressable>
                            )) : <></>
                        }
                    </ScrollView>
               </View>
                {
                    pressAddCred && (
                        <KeyboardAvoidingView behavior='position' keyboardVerticalOffset={layoutHeight * .25} className='bg-white'>
                         <View className='bg-white h-[100]'>
                            <TextInput
                            mode="outlined"
                            theme={{ roundness: 10 }}
                            style={{ width: "100%", height: 45, marginBottom: 10, backgroundColor  : 'white' }}
                            activeOutlineColor="#0D509D"
                            value={newCred}
                            onChangeText={setNewCred}
                            placeholder="Enter New Credential..."
                            textColor="black"
                            />

                            <View className='flex flex-row items-center justify-between w-[100%]'>
                                <Pressable className='bg-gray-400 w-[40%] h-[30px] p-1 items-center justify-center rounded-[15px]' onPress={() => { setPressAddCred(false); setNewCred('')}}>
                                    <Text className='text-white font-bold'>Cancel</Text>
                                </Pressable>
                                <Pressable className='bg-[#57BA49] w-[40%] h-[30px] p-1 items-center justify-center rounded-[15px]' onPress={() => {setPressAddCred(false); setSpeakerCreds(prev => [...prev, newCred]); setNewCred('')}}>
                                    <Text className='font-bold text-white '>Confirm</Text>
                                </Pressable>
                            </View>
                         </View>
                        </KeyboardAvoidingView>
                    )
                }
                <Text className='text-blue-600 underline self-center' onPress={() => { pressAddCred != true && setPressAddCred(true) }}>
                {
                    pressAddCred ? '' : 'Add Credentials'
                }
                </Text>


               { 
               !pressAddCred &&
                <Pressable className='bg-[#57BA49] w-[60%] h-[35px] p-1 items-center justify-center rounded-[15px] self-end my-10' onPress={ async () => await onUpdate() }>
                    <Text className='font-bold text-white '>Confirm Speaker Updates</Text>
                </Pressable>
                }
            </View>
    </View>
  )
}

export default EditSpeakerInfo