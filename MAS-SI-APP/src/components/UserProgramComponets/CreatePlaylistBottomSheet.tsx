import { View, Text, Button, Pressable, Image } from 'react-native'
import React, {forwardRef, useCallback, useEffect, useMemo, useRef, useState, } from 'react'
import BottomSheet, { BottomSheetModal, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { useAuth } from '@/src/providers/AuthProvider';
import { FileObject } from '@supabase/storage-js';
import { supabase } from '@/src/lib/supabase';
import * as ImagePicker from "expo-image-picker"
import * as FileSystem from 'expo-file-system';
import { Divider, Icon, TextInput } from 'react-native-paper';
import { decode } from 'base64-arraybuffer';
import { BlurView } from 'expo-blur';
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { err } from 'react-native-svg';

type CreatePlaylistBottomSheetProp = {
    playlist_img : string
    playlist_name : string
}
type Ref = BottomSheetModal
const CreatePlaylistBottomSheet = forwardRef<Ref, {}>((props, ref) => {
    const [ playlistImg, setPlaylistImg ] = useState<ImagePicker.ImagePickerAsset>()
    const [ playlistName, setPlaylistName ] = useState<string>()
    const [ isReady, setIsReady ] = useState(false)
    const { session } = useAuth()
    const [selectedColor, setSelectedColor] = useState("#E5E7EB")
    const [files, setFiles] = useState<FileObject[]>([])
    const selectedColorScaleValue = useSharedValue(1)

    const selectedColorAnimation = useAnimatedStyle(() => (
        {
            transform : [ { scale :  selectedColorScaleValue.value }]
        }
    ))
    const colors = [
        { name: "Gray", value: "#E5E7EB" },
        { name: "Red", value: "#FEE2E2" },
        { name: "Orange", value: "#FFEDD5" },
        { name: "Green", value: "#DCFCE7" },
        { name: "Blue", value: "#DBEAFE" },
        { name: "Purple", value: "#F3E8FF" },
        { name: "Pink", value: "#FCE7F3" },
    ]

    const handleClose = () => {
        if (ref && 'current' in ref && ref.current) {
            setPlaylistImg(undefined)
            setPlaylistName("")
            ref.current.dismiss();
        }
    };
    
    const loadImages = async () => {
      const { data } = await supabase.storage.from('files').list(session?.user.id)
      if (data) {
        setFiles(data)
      }
    }
    
    const uploadImage = async () => {
        if( playlistImg ){
            const base64 = await FileSystem.readAsStringAsync(playlistImg.uri, { encoding: 'base64' });
            const filePath = `${session?.user.id}/${new Date().getTime()}.${playlistImg.type === 'image' ? 'png' : 'mp4'}`;
            const contentType = playlistImg.type === 'image' ? 'image/png' : 'video/mp4';
            const { data : image, error :image_upload_error } = await supabase.storage.from('user_playlist_img').upload(filePath, decode(base64));

            if( image ){
                const { data : playlist_img_url} = await supabase.storage.from('user_playlist_img').getPublicUrl(image?.path)
                if( playlist_img_url ) {
                    const { error } = await supabase.from("user_playlist").insert({ user_id : session?.user.id, playlist_name : playlistName, playlist_img: playlist_img_url.publicUrl})
                }
            }
            handleClose()
        }
        else{
            const { error } = await supabase.from("user_playlist").insert({ user_id : session?.user.id, playlist_name : playlistName, def_background : selectedColor})
            handleClose()
        }
    }

    const onSelectImage = async () => {
      const options : ImagePicker.ImagePickerOptions = {
        mediaTypes : ImagePicker.MediaTypeOptions.Images,
        allowsEditing : true
      }

      const result = await ImagePicker.launchImageLibraryAsync(options)

      if( !result.canceled ){
        const img = result.assets[0]
        setPlaylistImg(img)
      }
    }
    const snapPoints = useMemo(() => ["50%", "95%"], []);
    const [ visible, setVisible ] = useState(false);
    const showModal = () => setVisible(true);
    const hideModal = () => setVisible(false);
    const renderBackDrop = useCallback( (props : any ) => <BottomSheetBackdrop appearsOnIndex={0} disappearsOnIndex={-1} {...props}/> , [])

    useEffect(() => {
        if( playlistName ){
            setIsReady(true)
        }else{
            setIsReady(false)
        }
    }, [playlistName])

    return(
        <BottomSheetModal
        ref={ref}
        index={1}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        backgroundStyle={{backgroundColor: "white"}}
        backdropComponent={renderBackDrop}
        {...props}
        >
            <View className='flex-row justify-between items-center px-5'> 
                <Button title='Cancel' onPress={handleClose} />
                <Text className='text-xl font-semibold'> New Playlist </Text>
                <Button title='Create' disabled={!isReady} onPress={async () => await uploadImage()}/>
            </View>
            
            <View className='items-center pt-[10%]'>
                <Pressable className='h-[140] w-[160] items-center justify-center' style={{ borderRadius : 20, backgroundColor : selectedColor }} >
                    {playlistImg ? <Image source={{ uri : playlistImg.uri || undefined}} style={{width: "100%", height:"100%", objectFit: "fill", borderRadius : 20 }} /> : (
                        <View className={`overflow-hidden w-[100%] h-[100%] bg-[${selectedColor}]`} style={{ borderRadius : 20 }}>
                            <View style={{ height : '100%', width : '100%', borderRadius : 20, alignItems : 'center', justifyContent : 'center'}} >
                                <Image source={require('@/assets/images/MasPlaylistDef.png')} style={{height : '70%', width : '70%', objectFit : 'fill'}} />
                            </View>
                        </View>
                        )}
                </Pressable>
                <View className='mt-[5] w-[90%] items-center'>
                    <TextInput
                        placeholder='Playlist Title'
                        style={{ width : "100%", height: 50, textAlign : 'center' }}
                        value={playlistName}
                        onChangeText={setPlaylistName}
                        selectionColor='red'
                        underlineColor='gray'
                        activeUnderlineColor='gray'
                        contentStyle={{ backgroundColor : 'white'}}
                        textColor='black'
                    />
                </View>

                <Text className='text-black font-bold text-lg text-left w-[100%] ml-[10%] mt-3'>Playlist Cover</Text>
                <View className="space-y-2 items-center">
                    <View className="text-sm text-gray-500 px-1 mt-5">
                        <Text className='text-black '>Choose Background Color</Text>
                    </View>
                    <View className="flex gap-1 py-2 px-6 flex-row">
                        {colors.map((color) => (
                        <Pressable
                            key={color.value}
                            onPress={() => setSelectedColor(color.value)}
                            className={
                            `w-12 h-12 rounded-full flex-shrink-0 transition-transform,
                            ${selectedColor === color.value && 'ring-2 ring-blue-500 ring-offset-2 scale-110'}
                            `}
                            style={{ backgroundColor: color.value }}
                        />
                        ))}
                    </View>
                </View>

                <Divider  className=' bg-black w-[90%] mt-5 mb-5'/>
                <Pressable className='w-[100%] px-5 flex flex-row justify-between' onPress={onSelectImage}>

                    <Text className='text-[17px]'>Choose from Library</Text>
                    <Icon source={'file-image'} size={20} color='#007AFF'/>
                </Pressable>

                
            </View>

        </BottomSheetModal>
    )
})

export default CreatePlaylistBottomSheet