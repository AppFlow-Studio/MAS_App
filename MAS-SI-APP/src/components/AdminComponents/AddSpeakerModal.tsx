import { View, Text, Pressable, FlatList, ScrollView, Image, Alert, KeyboardAvoidingView, useWindowDimensions } from 'react-native'
import React, { useState } from 'react'
import { Dialog, TextInput } from 'react-native-paper';
import Svg, { Circle, Path } from 'react-native-svg'
import { supabase } from '@/src/lib/supabase';
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import Toast from 'react-native-toast-message';

const AddSpeakerModal = ( { isOpen, setIsOpen } : { isOpen : boolean , setIsOpen : ( isOpen : boolean) => void }  ) => {
  const hideDialog = () => setIsOpen(false);
  const [ speakerName, setSpeakerName ] = useState('')
  const [ speakerImg, setSpeakerImg ] = useState<ImagePicker.ImagePickerAsset>()
  const [ creds , setCreds ] = useState<string[]>([])
  const [ newCred, setNewCred ] = useState<string>('')
  const [ pressAddCred, setPressAddCred ] = useState(false) 
  const layoutHeight = useWindowDimensions().height
  const [ submitDisabled, setSubmitDisabled ] = useState(true)
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

      setSpeakerImg(img);
    }
  };
  const handleSubmit = () => {
    setSpeakerName('')
    setSpeakerImg(undefined)
    setCreds([])
    setNewCred('')
    setPressAddCred(false)
    setIsOpen(false)
    Toast.show({
        type: "success",
        text1: "Speaker added",
        position: "top",
        topOffset: 50,
        visibilityTime: 2000,
      });
  }
   const UploadNewSpeaker = async () => {
        if ( speakerName && speakerImg ) {
            setSubmitDisabled(false)
            const base64 = await FileSystem.readAsStringAsync(speakerImg.uri, { encoding: 'base64' });
            const filePath = `${speakerName.trim().split(" ").join("_")}.${speakerImg.type === 'image' ? 'png' : 'mp4'}`;
            const contentType = speakerImg.type === 'image' ? 'image/png' : 'video/mp4';
            const { data : image, error :image_upload_error } = await supabase.storage.from('sheikh_img').upload(filePath, decode(base64));
            if( image ){
              const { data : speaker_img_url} = await supabase.storage.from('sheikh_img').getPublicUrl(image?.path)
              const { error } = await supabase.from('speaker_data').insert({ speaker_name : speakerName, speaker_img : speaker_img_url.publicUrl, speaker_creds : creds })
              if( error ){
                console.log(error)
              }
              handleSubmit()
              setSubmitDisabled(true)
            }else{
              Alert.alert(image_upload_error.message)
              return
            }
          }else{
            Alert.alert('Please Fill All Info Before Proceeding')
          }
        }  
  return (
    <Dialog visible={isOpen} onDismiss={hideDialog} style={{ backgroundColor : "white", height : '80%', marginTop : 60}}>
        <Dialog.Content className='h-[100%]'>
            <View>
                <Text className='font-bold text-black text-lg my-1'>Upload Speaker Image </Text>
                <Pressable className={`max-h-[20%] w-[90%] ${!speakerImg ? 'border-2 border-dotted border-[#6077F5]' : ' my-2' } items-center justify-center self-center rounded-[15px]`} onPress={pickImage}>
                    {
                    speakerImg ? 
                        <Image src={speakerImg.uri} style={{width: 110, height: 110, borderRadius: 50}}/>
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
               <View className='max-h-[35%] border border-gray-400 border-solid rounded-[15px] p-4'>
                    <ScrollView contentContainerStyle={{  }}>
                        {
                            creds.map((item, index) => (
                                <Pressable onPress={ () => {
                                    const removeFromCred = creds.filter(cred => cred != item)
                                    setCreds(removeFromCred)
                                } }
                                key={index}
                                >
                                    <Text numberOfLines={3}>* {item}</Text>
                                    <View className='h-[0.5] bg-black w-[70%] self-center my-2 '/>
                                </Pressable>
                            ))
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
                                <Pressable className='bg-[#57BA49] w-[40%] h-[30px] p-1 items-center justify-center rounded-[15px]' onPress={() => {setPressAddCred(false); setCreds(prev => [...prev, newCred]); setNewCred('')}}>
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
                <Pressable className='bg-[#57BA49] w-[60%] h-[35px] p-1 items-center justify-center rounded-[15px] self-end my-10' onPress={async () => await UploadNewSpeaker() }
                disabled={!submitDisabled}
                >
                    <Text className='font-bold text-white '>Confirm New Speaker</Text>
                </Pressable>
                }
            </View>
        </Dialog.Content>
    </Dialog>
  )
}

export default AddSpeakerModal