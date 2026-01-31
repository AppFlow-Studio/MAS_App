import { View, Text, Pressable, Image, Alert, Modal, Animated, Dimensions, Platform, ScrollView, Keyboard } from 'react-native'
import React, { forwardRef, useImperativeHandle, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/src/providers/AuthProvider';
import { supabase } from '@/src/lib/supabase';
import * as ImagePicker from "expo-image-picker"
import * as FileSystem from 'expo-file-system/legacy';
import { Icon, TextInput } from 'react-native-paper';
import { decode } from 'base64-arraybuffer';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Image as ImageIcon, Check, X } from 'lucide-react-native';

const { height, width } = Dimensions.get('window')

type Ref = {
    present: () => void
    dismiss: () => void
    snapToIndex: (index: number) => void
}

const CreatePlaylistBottomSheet = forwardRef<Ref, {}>((props, ref) => {
    const [playlistImg, setPlaylistImg] = useState<ImagePicker.ImagePickerAsset>()
    const [playlistName, setPlaylistName] = useState<string>('')
    const [isReady, setIsReady] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { session } = useAuth()
    const [selectedColor, setSelectedColor] = useState("#1E3A5F")
    const [visible, setVisible] = useState(false)
    
    const slideAnim = useRef(new Animated.Value(height)).current
    const fadeAnim = useRef(new Animated.Value(0)).current
    const keyboardOffset = useRef(new Animated.Value(0)).current

    // Darker, richer color palette
    const colors = [
        { name: "Navy", value: "#1E3A5F", gradient: ['#1E3A5F', '#0F2744'] },
        { name: "Forest", value: "#1D4E3E", gradient: ['#1D4E3E', '#0F2A21'] },
        { name: "Wine", value: "#722F37", gradient: ['#722F37', '#4A1F24'] },
        { name: "Royal", value: "#4A3B7C", gradient: ['#4A3B7C', '#2D2449'] },
        { name: "Slate", value: "#475569", gradient: ['#475569', '#1E293B'] },
        { name: "Ember", value: "#9A3412", gradient: ['#9A3412', '#5C1F0B'] },
        { name: "Midnight", value: "#1E1B4B", gradient: ['#1E1B4B', '#0F0D26'] },
    ]

    useImperativeHandle(ref, () => ({
        present: () => {
            setVisible(true)
        },
        dismiss: () => {
            handleClose()
        },
        snapToIndex: (index: number) => {
            if (index >= 0) {
                setVisible(true)
            } else {
                handleClose()
            }
        }
    }))

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 65,
                    friction: 11,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 350,
                    useNativeDriver: true,
                }),
            ]).start()
        } else {
            slideAnim.setValue(height)
            fadeAnim.setValue(0)
        }
    }, [visible])

    // Keyboard handling
    useEffect(() => {
        const keyboardWillShow = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (e) => {
                Animated.timing(keyboardOffset, {
                    toValue: -e.endCoordinates.height * 0.4,
                    duration: 250,
                    useNativeDriver: true,
                }).start()
            }
        )
        const keyboardWillHide = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => {
                Animated.timing(keyboardOffset, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }).start()
            }
        )

        return () => {
            keyboardWillShow.remove()
            keyboardWillHide.remove()
        }
    }, [])

    const handleClose = () => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: height,
                duration: 280,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 280,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setVisible(false)
            setPlaylistImg(undefined)
            setPlaylistName("")
            setSelectedColor("#1E3A5F")
            setIsLoading(false)
        })
    }

    const uploadImage = async () => {
        setIsLoading(true)
        try {
            if (playlistImg) {
                setIsReady(false)
                const base64 = await FileSystem.readAsStringAsync(playlistImg.uri, { encoding: 'base64' });
                const filePath = `${session?.user.id}/${new Date().getTime()}.${playlistImg.type === 'image' ? 'png' : 'mp4'}`;
                const { data: image, error: image_upload_error } = await supabase.storage.from('user_playlist_img').upload(filePath, decode(base64));

                if (image) {
                    const { data: playlist_img_url } = await supabase.storage.from('user_playlist_img').getPublicUrl(image?.path)
                    if (playlist_img_url) {
                        const { error } = await supabase.from("user_playlist").insert({ user_id: session?.user.id, playlist_name: playlistName, playlist_img: playlist_img_url.publicUrl })
                    }
                }
                handleClose()
            }
            else {
                setIsReady(false)
                const { error } = await supabase.from("user_playlist").insert({ user_id: session?.user.id, playlist_name: playlistName, def_background: selectedColor })
                handleClose()
            }
        } catch (error) {
            setIsLoading(false)
            Alert.alert('Error', 'Failed to create playlist. Please try again.')
        }
    }

    const onSelectImage = async () => {
        const options: ImagePicker.ImagePickerOptions = {
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        }

        const result = await ImagePicker.launchImageLibraryAsync(options)

        if (!result.canceled) {
            const img = result.assets[0]
            setPlaylistImg(img)
        }
    }

    useEffect(() => {
        if (playlistName && playlistName.trim().length > 0) {
            setIsReady(true)
        } else {
            setIsReady(false)
        }
    }, [playlistName])

    if (!visible) return null

    const selectedColorData = colors.find(c => c.value === selectedColor) || colors[0]

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="none"
            statusBarTranslucent
            onRequestClose={handleClose}
        >
            <Animated.View
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    justifyContent: 'flex-end',
                    opacity: fadeAnim
                }}
            >
                <Pressable
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                    onPress={handleClose}
                />

                <Animated.View
                    style={{
                        backgroundColor: '#ffffff',
                        borderRadius: 40,
                        marginHorizontal: 10,
                        marginBottom: Platform.OS === 'ios' ? 12 : 10,
                        maxHeight: height * 0.85,
                        transform: [
                            { translateY: slideAnim },
                            { translateY: keyboardOffset }
                        ],
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: -10 },
                        shadowOpacity: 0.3,
                        shadowRadius: 25,
                        elevation: 25,
                    }}
                >
                        {/* Handle */}
                        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
                            <View style={{
                                width: 36,
                                height: 4,
                                backgroundColor: '#e5e7eb',
                                borderRadius: 2,
                            }} />
                        </View>

                        {/* Header */}
                        <View style={{ 
                            flexDirection: 'row', 
                            alignItems: 'center', 
                            paddingHorizontal: 20, 
                            paddingBottom: 20,
                            paddingTop: 4,
                            borderBottomWidth: 1,
                            borderBottomColor: '#f1f5f9',
                        }}>
                            {/* Cancel */}
                            <Pressable 
                                onPress={handleClose}
                                hitSlop={8}
                            >
                                <Text style={{ fontSize: 16, color: '#6b7280' }}>
                                    Cancel
                                </Text>
                            </Pressable>
                            
                            {/* Title - centered */}
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={{ fontSize: 17, fontWeight: '600', color: '#1f2937' }}>
                                    New Playlist
                                </Text>
                            </View>

                            {/* Create Button */}
                            <Pressable
                                onPress={() => {
                                    if (playlistName.trim().length === 0) {
                                        Alert.alert('Name Required', 'Please enter a playlist name')
                                    } else {
                                        uploadImage()
                                    }
                                }}
                                disabled={isLoading}
                                hitSlop={8}
                            >
                                <Text style={{
                                    fontSize: 16,
                                    fontWeight: '600',
                                    color: '#007AFF',
                                }}>
                                    {isLoading ? '...' : 'Create'}
                                </Text>
                            </Pressable>
                        </View>

                        <ScrollView 
                            contentContainerStyle={{ paddingBottom: 40 }}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Playlist Image Preview */}
                            <View style={{ alignItems: 'center', paddingTop: 16 }}>
                                <View style={{
                                    width: 180,
                                    height: 180,
                                    borderRadius: 24,
                                    overflow: 'hidden',
                                    shadowColor: selectedColor,
                                    shadowOffset: { width: 0, height: 8 },
                                    shadowOpacity: 0.4,
                                    shadowRadius: 16,
                                    elevation: 12,
                                }}>
                                    {playlistImg ? (
                                        <View style={{ width: '100%', height: '100%' }}>
                                            <Image 
                                                source={{ uri: playlistImg.uri }} 
                                                style={{ width: '100%', height: '100%' }} 
                                                resizeMode="cover"
                                            />
                                            {/* Overlay buttons for image selected */}
                                            <View style={{
                                                position: 'absolute',
                                                bottom: 10,
                                                left: 0,
                                                right: 0,
                                                flexDirection: 'row',
                                                justifyContent: 'center',
                                                gap: 12,
                                            }}>
                                                <Pressable 
                                                    onPress={onSelectImage}
                                                    style={({ pressed }) => ({
                                                        backgroundColor: pressed ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.6)',
                                                        borderRadius: 20,
                                                        paddingVertical: 8,
                                                        paddingHorizontal: 14,
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                    })}
                                                >
                                                    <ImageIcon color="#fff" size={16} />
                                                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Change</Text>
                                                </Pressable>
                                                <Pressable 
                                                    onPress={() => setPlaylistImg(undefined)}
                                                    style={({ pressed }) => ({
                                                        backgroundColor: pressed ? 'rgba(239,68,68,0.9)' : 'rgba(239,68,68,0.8)',
                                                        borderRadius: 20,
                                                        paddingVertical: 8,
                                                        paddingHorizontal: 14,
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                    })}
                                                >
                                                    <X color="#fff" size={16} />
                                                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Remove</Text>
                                                </Pressable>
                                            </View>
                                        </View>
                                    ) : (
                                        <Pressable 
                                            onPress={onSelectImage}
                                            style={({ pressed }) => ({ 
                                                width: '100%', 
                                                height: '100%',
                                                opacity: pressed ? 0.9 : 1,
                                            })}
                                        >
                                            <LinearGradient
                                                colors={selectedColorData.gradient as [string, string]}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={{ 
                                                    width: '100%', 
                                                    height: '100%', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Image 
                                                    source={require('@/assets/images/MasPlaylistDef.png')} 
                                                    style={{ height: '50%', width: '50%', opacity: 0.9 }}
                                                    resizeMode="contain"
                                                />
                                                {/* Add Image Button */}
                                                <View style={{
                                                    position: 'absolute',
                                                    bottom: 12,
                                                    backgroundColor: 'rgba(255,255,255,0.25)',
                                                    borderRadius: 20,
                                                    paddingVertical: 8,
                                                    paddingHorizontal: 14,
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                }}>
                                                    <Camera color="#fff" size={16} />
                                                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Add Cover</Text>
                                                </View>
                                            </LinearGradient>
                                        </Pressable>
                                    )}
                                </View>
                            </View>

                            {/* Playlist Name Input */}
                            <View style={{ 
                                marginTop: 28, 
                                marginHorizontal: 24,
                                backgroundColor: '#f8fafc',
                                borderRadius: 16,
                                borderWidth: 1,
                                borderColor: '#e2e8f0',
                            }}>
                                <TextInput
                                    placeholder='Enter playlist name'
                                    placeholderTextColor="#94a3b8"
                                    style={{ 
                                        backgroundColor: 'transparent',
                                        fontSize: 17,
                                        paddingHorizontal: 4,
                                    }}
                                    value={playlistName}
                                    onChangeText={setPlaylistName}
                                    selectionColor='#0E519F'
                                    underlineColor='transparent'
                                    activeUnderlineColor='transparent'
                                    textColor='#1e293b'
                                    contentStyle={{ paddingVertical: 16 }}
                                />
                            </View>

                            {/* Color Selection Section */}
                            <View style={{ marginTop: 32, paddingHorizontal: 24 }}>
                                <Text style={{ 
                                    color: '#1e293b', 
                                    fontWeight: '700', 
                                    fontSize: 16,
                                    marginBottom: 16,
                                }}>
                                    Background Color
                                </Text>
                                
                                <View style={{ 
                                    flexDirection: 'row', 
                                    flexWrap: 'wrap',
                                    gap: 12,
                                    justifyContent: 'center',
                                }}>
                                    {colors.map((color) => (
                                        <Pressable
                                            key={color.value}
                                            onPress={() => setSelectedColor(color.value)}
                                            style={({ pressed }) => ({
                                                transform: [{ scale: pressed ? 0.92 : selectedColor === color.value ? 1.08 : 1 }],
                                            })}
                                        >
                                            <LinearGradient
                                                colors={color.gradient as [string, string]}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={{
                                                    width: 52,
                                                    height: 52,
                                                    borderRadius: 16,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderWidth: selectedColor === color.value ? 3 : 0,
                                                    borderColor: '#0E519F',
                                                    shadowColor: color.value,
                                                    shadowOffset: { width: 0, height: 4 },
                                                    shadowOpacity: selectedColor === color.value ? 0.5 : 0.2,
                                                    shadowRadius: 8,
                                                    elevation: selectedColor === color.value ? 8 : 3,
                                                }}
                                            >
                                                {selectedColor === color.value && (
                                                    <Check color="#fff" size={22} strokeWidth={3} />
                                                )}
                                            </LinearGradient>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>

                        </ScrollView>
                    </Animated.View>
            </Animated.View>
        </Modal>
    )
})

export default CreatePlaylistBottomSheet
