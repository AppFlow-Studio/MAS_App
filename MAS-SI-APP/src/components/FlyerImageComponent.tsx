import { View, Text, Pressable, Image, ScrollView, Animated, Dimensions, StatusBar } from 'react-native'
import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Link, useRouter } from 'expo-router'
import { FlyerSkeleton } from './FlyerSkeleton'
import { Program, Lectures } from '../types'
import { Icon, Portal } from 'react-native-paper'
import { parse } from 'date-fns'
import moment from 'moment'
import { BlurView } from 'expo-blur'
import { ExpoLiquidGlassView, LiquidGlassType, CornerStyle } from 'expo-liquid-glass-view'
import { supabase } from '@/src/lib/supabase'

const FlyerImageComponent = ({item} : {item : Program}) => {
    const [ imageReady, setImageReady ] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const [lectures, setLectures] = useState<Lectures[]>([])
    const slideAnim = useRef(new Animated.Value(0)).current
    const router = useRouter()

    // Helper function to convert time string to moment and format as 12-hour
    const parseTimeToMoment = (timeString: string) => {
        if (!timeString) return moment();
        
        try {
            const parsed12 = parse(timeString, 'h:mm a', new Date());
            if (!isNaN(parsed12.getTime())) {
                return moment(parsed12);
            }
        } catch (error) {
            // Continue to try other formats
        }
        
        try {
            const parsed24 = parse(timeString, 'HH:mm', new Date());
            if (!isNaN(parsed24.getTime())) {
                return moment(parsed24);
            }
        } catch (error) {
            // Continue to try other formats
        }
        
        try {
            const parsed24Sec = parse(timeString, 'HH:mm:ss', new Date());
            if (!isNaN(parsed24Sec.getTime())) {
                return moment(parsed24Sec);
            }
        } catch (error) {
            // Continue
        }
        
        const momentTime = moment(timeString, ['h:mm a', 'HH:mm', 'HH:mm:ss', 'h:mm:ss a'], true);
        if (momentTime.isValid()) {
            return momentTime;
        }
        
        return moment();
    };
    
    // Helper function to format time as 12-hour format
    const formatTime12Hour = (timeString: string): string => {
        if (!timeString) return 'TBD';
        
        try {
            const time = parseTimeToMoment(timeString);
            if (time.isValid()) {
                return time.format('h:mm A');
            }
        } catch (error) {
            console.error('Error formatting time:', error);
        }
        
        return timeString;
    };

    const closeModal = useCallback(() => {
        setModalVisible(false);
        Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 40,
            friction: 8,
        }).start();
    }, [slideAnim]);

    const openModal = useCallback(() => {
        setModalVisible(true);
        Animated.spring(slideAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 40,
            friction: 8,
        }).start();
        
        // Fetch lectures if program has them
        if (item.has_lectures) {
            fetchLectures();
        }
    }, [slideAnim, item.has_lectures, item.program_id]);

    const fetchLectures = async () => {
        const { data, error } = await supabase
            .from("program_lectures")
            .select("*")
            .eq("lecture_program", item.program_id)
            .order('lecture_date', { ascending: false })
            .limit(5);
        
        if (data && !error) {
            setLectures(data);
        }
    };

    return (
        <>
            <View className='flex-col relative'>
                <Link href={`/menu/program/${item.program_id}`} asChild>
                    <Pressable>
                        { !imageReady && 
                            <FlyerSkeleton width={150} height={150} style={{position : 'absolute', top : 0, zIndex : 2}}/>
                        }
                        <Image source={{ uri : item.program_img || undefined }} style={{ width : 150, height : 150, borderRadius : 8, margin : 5 }}  
                            onLoad={() => setImageReady(true)}
                            onError={() => setImageReady(false)}
                        />
                        <Text className='text-black font-medium pl-2 text-[10px] w-[150px] text-center' numberOfLines={1}>{item.program_name}</Text>
                    </Pressable>
                </Link>

                {/* Description Card */}
                {item.program_desc && (
                    <View style={{
                        marginHorizontal: 5,
                        marginTop: 4,
                    }}>
                        <Pressable onPress={openModal}>
                            <Text 
                                className="text-[#0D509D] text-[10px] text-center"
                            >
                                Read full description
                            </Text>
                        </Pressable>
                    </View>
                )}
            </View>

            {/* Full Description Modal */}
            {item.program_desc && modalVisible && (
                <>
                    {/* Blur Background */}
                    <Portal>
                        <Animated.View
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                zIndex: 1000,
                                opacity: slideAnim,
                            }}
                        >
                            <Pressable
                                style={{
                                    flex: 1,
                                }}
                                onPress={closeModal}
                            >
                                <BlurView
                                    intensity={20}
                                    tint="dark"
                                    style={{
                                        flex: 1,
                                    }}
                                />
                            </Pressable>
                        </Animated.View>
                    </Portal>

                    {/* Modal Content */}
                    <Portal>
                        <View
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                justifyContent: 'flex-end',
                                zIndex: 1001,
                            }}
                        >
                            <Animated.View
                                style={{
                                    height: Dimensions.get('window').height - 50,
                                    backgroundColor: 'white',
                                    borderTopLeftRadius: 20,
                                    borderTopRightRadius: 20,
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: -4 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 8,
                                    elevation: 10,
                                    transform: [
                                        {
                                            translateY: slideAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [Dimensions.get('window').height, 50],
                                            }),
                                        },
                                    ],
                                }}
                            >
                                <View
                                    style={{
                                        backgroundColor: 'white',
                                        borderTopLeftRadius: 20,
                                        borderTopRightRadius: 20,
                                        padding: 0,
                                        width: '100%',
                                        height: '100%',
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: -4 },
                                        shadowOpacity: 0.3,
                                        shadowRadius: 8,
                                        elevation: 10,
                                        overflow: 'hidden',
                                        flexDirection: 'column',
                                    }}
                                >
                                    <Pressable
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            zIndex: 999,
                                        }}
                                        onPress={closeModal}
                                    />
                                    {/* Program Image */}
                                    <View style={{
                                        width: '100%',
                                        height: 400,
                                        overflow: 'hidden',
                                        position: 'relative',
                                        backgroundColor: '#f5f5f5',
                                    }}>
                                        <Image
                                            source={item.program_img ? { uri: item.program_img } : require("@/assets/images/MASHomeLogo.png")}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                            }}
                                            resizeMode="cover"
                                        />
                                        {/* Close Button */}
                                        <ExpoLiquidGlassView
                                            type={LiquidGlassType.Tint}
                                            tint="systemUltraThinMaterialDark"
                                            cornerRadius={18}
                                            cornerStyle={CornerStyle.Continuous}
                                            style={{
                                                position: 'absolute',
                                                top: 12,
                                                right: 12,
                                                width: 36,
                                                height: 36,
                                                borderRadius: 18,
                                                overflow: 'hidden',
                                                zIndex: 10,
                                            }}
                                        >
                                            <Pressable
                                                onPress={closeModal}
                                                style={{
                                                    width: 36,
                                                    height: 36,
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <Icon source="close" size={20} color="#FFFFFF" />
                                            </Pressable>
                                        </ExpoLiquidGlassView>
                                    </View>
                                    
                                    <ScrollView 
                                        showsVerticalScrollIndicator={true}
                                        style={{ flex: 1, zIndex: 1000 }}
                                        contentContainerStyle={{ paddingBottom: 60, paddingTop: 0, borderWidth: 0, flexGrow: 1 }}
                                        nestedScrollEnabled={true}
                                        onStartShouldSetResponder={() => true}
                                        onMoveShouldSetResponder={() => true}
                                    >
                                        <View className="px-5 pt-4" style={{ borderWidth: 0 }}>
                                            {/* Header with Time */}
                                            {item.program_start_time && (
                                                <View className="flex-row items-center mb-3">
                                                    <View className="flex-row items-center">
                                                        <Icon source="clock-outline" size={18} color="#0D509D" />
                                                        <Text className="text-[#0D509D] font-semibold text-base ml-2">
                                                            {formatTime12Hour(item.program_start_time)}
                                                        </Text>
                                                    </View>
                                                </View>
                                            )}

                                            {/* Program Name */}
                                            <View className="items-center justify-center mb-4">
                                                <Text className="text-black font-bold text-center" style={{ fontSize: 24, lineHeight: 32 }}>
                                                    {item.program_name}
                                                </Text>
                                            </View>

                                            {/* Full Description */}
                                            <Text className="text-gray-800 text-sm leading-6">
                                                {item.program_desc}
                                            </Text>

                                            {/* YouTube Videos Section */}
                                            {item.has_lectures && lectures.length > 0 && (
                                                <View className="mt-6">
                                                    <View className="flex-row items-center mb-3">
                                                        <Icon source="youtube" size={20} color="#FF0000" />
                                                        <Text className="text-[#0D509D] font-bold text-lg ml-2">
                                                            Recorded Videos
                                                        </Text>
                                                    </View>
                                                    {lectures.map((lecture, index) => (
                                                        <Pressable
                                                            key={lecture.lecture_id}
                                                            onPress={() => {
                                                                closeModal();
                                                                router.push(`/menu/program/lectures/${lecture.lecture_id}`);
                                                            }}
                                                            style={{
                                                                backgroundColor: '#f5f5f5',
                                                                borderRadius: 8,
                                                                padding: 12,
                                                                marginBottom: 8,
                                                            }}
                                                        >
                                                            <View className="flex-row items-center justify-between">
                                                                <View className="flex-1">
                                                                    <Text className="text-black font-semibold text-sm" numberOfLines={1}>
                                                                        {lecture.lecture_name}
                                                                    </Text>
                                                                    {lecture.lecture_speaker && (
                                                                        <Text className="text-gray-600 text-xs mt-1">
                                                                            {lecture.lecture_speaker}
                                                                        </Text>
                                                                    )}
                                                                    {lecture.lecture_date && (
                                                                        <Text className="text-gray-500 text-xs mt-1">
                                                                            {moment(lecture.lecture_date).format('MMM DD, YYYY')}
                                                                        </Text>
                                                                    )}
                                                                </View>
                                                                <Icon source="play-circle" size={24} color="#FF0000" />
                                                            </View>
                                                        </Pressable>
                                                    ))}
                                                </View>
                                            )}
                                        </View>
                                    </ScrollView>
                                </View>
                            </Animated.View>
                        </View>
                    </Portal>
                </>
            )}
        </>
    )
}

export default FlyerImageComponent