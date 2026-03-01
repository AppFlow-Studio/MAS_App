import { View, Text, Pressable, Image, Alert, Modal, Animated, Dimensions, Platform } from 'react-native'
import React, { forwardRef, useImperativeHandle, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/src/providers/AuthProvider';
import { supabase } from '@/src/lib/supabase';
import * as ImagePicker from "expo-image-picker"
import { File } from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { Camera, Image as ImageIcon, X, User } from 'lucide-react-native';
import { Icon, ActivityIndicator } from 'react-native-paper';

const { height, width } = Dimensions.get('window')

type Ref = {
    present: () => void
    dismiss: () => void
}

type ProfilePictureBottomSheetProps = {
    currentProfilePic?: string | null
    onProfilePicUpdated?: (newUrl: string | null) => void
}

const ProfilePictureBottomSheet = forwardRef<Ref, ProfilePictureBottomSheetProps>(
    ({ currentProfilePic, onProfilePicUpdated }, ref) => {
        const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null)
        const [isLoading, setIsLoading] = useState(false)
        const { session } = useAuth()
        const [visible, setVisible] = useState(false)

        const slideAnim = useRef(new Animated.Value(height)).current
        const fadeAnim = useRef(new Animated.Value(0)).current

        useImperativeHandle(ref, () => ({
            present: () => {
                setVisible(true)
            },
            dismiss: () => {
                handleClose()
            },
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
                setSelectedImage(null)
                setIsLoading(false)
            })
        }

        const requestCameraPermission = async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync()
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Please allow camera access to take a profile photo.',
                    [{ text: 'OK' }]
                )
                return false
            }
            return true
        }

        const requestGalleryPermission = async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Please allow photo library access to choose a profile photo.',
                    [{ text: 'OK' }]
                )
                return false
            }
            return true
        }

        const takePhoto = async () => {
            const hasPermission = await requestCameraPermission()
            if (!hasPermission) return

            const options: ImagePicker.ImagePickerOptions = {
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            }

            const result = await ImagePicker.launchCameraAsync(options)

            if (!result.canceled) {
                const img = result.assets[0]
                setSelectedImage(img)
            }
        }

        const pickFromGallery = async () => {
            const hasPermission = await requestGalleryPermission()
            if (!hasPermission) return

            const options: ImagePicker.ImagePickerOptions = {
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            }

            const result = await ImagePicker.launchImageLibraryAsync(options)

            if (!result.canceled) {
                const img = result.assets[0]
                setSelectedImage(img)
            }
        }

        const uploadProfilePic = async () => {
            if (!selectedImage || !session?.user.id) return

            setIsLoading(true)
            try {
                const base64 = await new File(selectedImage.uri).base64();
                const filePath = `${session.user.id}/profile_${new Date().getTime()}.png`;
                const { data: image, error: uploadError } = await supabase.storage
                    .from('user_playlist_img')
                    .upload(filePath, decode(base64), {
                        contentType: 'image/png',
                        upsert: true,
                    });

                if (uploadError) {
                    console.error('Upload error:', uploadError)
                    Alert.alert('Error', 'Failed to upload profile picture. Please try again.')
                    setIsLoading(false)
                    return
                }

                if (image) {
                    const { data: urlData } = supabase.storage
                        .from('user_playlist_img')
                        .getPublicUrl(image.path)

                    if (urlData?.publicUrl) {
                        const { error: updateError } = await supabase
                            .from('profiles')
                            .update({ profile_pic: urlData.publicUrl })
                            .eq('id', session.user.id)

                        if (updateError) {
                            console.error('Update error:', updateError)
                            Alert.alert('Error', 'Failed to update profile. Please try again.')
                        } else {
                            onProfilePicUpdated?.(urlData.publicUrl)
                            handleClose()
                        }
                    }
                }
            } catch (error) {
                console.error('Error uploading profile picture:', error)
                Alert.alert('Error', 'Failed to upload profile picture. Please try again.')
            } finally {
                setIsLoading(false)
            }
        }

        const removeProfilePic = async () => {
            if (!session?.user.id) return

            Alert.alert(
                'Remove Photo',
                'Are you sure you want to remove your profile photo?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Remove',
                        style: 'destructive',
                        onPress: async () => {
                            setIsLoading(true)
                            try {
                                const { error } = await supabase
                                    .from('profiles')
                                    .update({ profile_pic: null })
                                    .eq('id', session.user.id)

                                if (error) {
                                    Alert.alert('Error', 'Failed to remove profile picture.')
                                } else {
                                    onProfilePicUpdated?.(null)
                                    handleClose()
                                }
                            } catch (error) {
                                Alert.alert('Error', 'Failed to remove profile picture.')
                            } finally {
                                setIsLoading(false)
                            }
                        }
                    }
                ]
            )
        }

        if (!visible) return null

        const displayImage = selectedImage?.uri || currentProfilePic

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
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
                            backgroundColor: '#0E519F',
                            borderRadius: 40,
                            marginHorizontal: 10,
                            marginBottom: Platform.OS === 'ios' ? 12 : 10,
                            overflow: 'hidden',
                            transform: [{ translateY: slideAnim }],
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: -4 },
                            shadowOpacity: 0.2,
                            shadowRadius: 20,
                            elevation: 20,
                        }}
                    >
                        {/* Handle */}
                        <View style={{
                            width: 36,
                            height: 4,
                            backgroundColor: 'rgba(255, 255, 255, 0.4)',
                            borderRadius: 2,
                            alignSelf: 'center',
                            marginTop: 10,
                            marginBottom: 10,
                        }} />

                        {/* Header */}
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingHorizontal: 20,
                            paddingBottom: 16,
                        }}>
                            <Pressable
                                onPress={handleClose}
                                style={{
                                    width: 36,
                                    height: 36,
                                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                    borderRadius: 18,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                <X color="#ffffff" size={20} />
                            </Pressable>

                            <Text style={{ fontSize: 18, fontWeight: '700', color: '#ffffff' }}>
                                Profile Photo
                            </Text>

                            <View style={{ width: 36 }} />
                        </View>

                        {/* Profile Picture Preview */}
                        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                            <Text style={{
                                fontSize: 24,
                                color: '#ffffff',
                                fontWeight: '700',
                                textAlign: 'center',
                                marginBottom: 20,
                            }}>
                                {displayImage ? 'Update Your Photo' : 'Add a Profile Photo'}
                            </Text>
                            
                            <Pressable
                                onPress={pickFromGallery}
                                style={{
                                    width: 120,
                                    height: 120,
                                    borderRadius: 60,
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    borderWidth: 4,
                                    borderColor: displayImage ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
                                    borderStyle: displayImage ? 'solid' : 'dashed',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    overflow: 'hidden',
                                }}
                            >
                                {displayImage ? (
                                    <Image
                                        source={{ uri: displayImage }}
                                        style={{ width: '100%', height: '100%' }}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={{ alignItems: 'center' }}>
                                        <Icon source="camera-plus" size={32} color="#0E519F" />
                                        <Text style={{ fontSize: 12, color: '#0E519F', marginTop: 4, fontWeight: '500' }}>
                                            Tap to add
                                        </Text>
                                    </View>
                                )}
                            </Pressable>

                            {/* Remove/Cancel Selection */}
                            {(currentProfilePic || selectedImage) && (
                                <Pressable
                                    onPress={() => {
                                        if (selectedImage) {
                                            setSelectedImage(null)
                                        } else {
                                            removeProfilePic()
                                        }
                                    }}
                                    disabled={isLoading}
                                    style={{
                                        marginTop: 10,
                                        paddingVertical: 6,
                                        paddingHorizontal: 14,
                                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                        borderRadius: 16,
                                        opacity: isLoading ? 0.5 : 1,
                                    }}
                                >
                                    <Text style={{ fontSize: 13, color: '#fca5a5', fontWeight: '500' }}>
                                        {selectedImage ? 'Cancel Selection' : 'Remove Photo'}
                                    </Text>
                                </Pressable>
                            )}
                        </View>

                        {/* Action Buttons */}
                        <View style={{ paddingHorizontal: 20, paddingBottom: 16, gap: 10 }}>
                            {/* Take Photo Button */}
                            <Pressable
                                onPress={takePhoto}
                                disabled={isLoading}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    paddingVertical: 14,
                                    borderRadius: 25,
                                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                    gap: 10,
                                    opacity: isLoading ? 0.5 : 1,
                                }}
                            >
                                <Camera color="#ffffff" size={20} />
                                <Text style={{ fontSize: 16, fontWeight: '600', color: '#ffffff' }}>
                                    Take Photo
                                </Text>
                            </Pressable>

                            {/* Choose from Gallery Button */}
                            <Pressable
                                onPress={pickFromGallery}
                                disabled={isLoading}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    paddingVertical: 14,
                                    borderRadius: 25,
                                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                    gap: 10,
                                    opacity: isLoading ? 0.5 : 1,
                                }}
                            >
                                <ImageIcon color="#ffffff" size={20} />
                                <Text style={{ fontSize: 16, fontWeight: '600', color: '#ffffff' }}>
                                    Choose from Gallery
                                </Text>
                            </Pressable>

                            {/* Save Button - only show when image is selected */}
                            {selectedImage && (
                                <Pressable
                                    onPress={uploadProfilePic}
                                    disabled={isLoading}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        paddingVertical: 14,
                                        borderRadius: 25,
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        gap: 8,
                                    }}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator size="small" color="#0E519F" />
                                    ) : (
                                        <>
                                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E519F' }}>
                                                Save Photo
                                            </Text>
                                            <Icon source="check" size={20} color="#0E519F" />
                                        </>
                                    )}
                                </Pressable>
                            )}
                        </View>
                    </Animated.View>
                </Animated.View>
            </Modal>
        )
    }
)

export default ProfilePictureBottomSheet
