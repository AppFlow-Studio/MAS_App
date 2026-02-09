import { View, Text, Pressable, Image, ScrollView, Animated, Dimensions, PanResponder } from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'expo-router'
import { FlyerSkeleton } from './FlyerSkeleton'
import { EventsType, SheikDataType } from '../types'
import { Icon, Modal, Portal } from 'react-native-paper'
import { supabase } from '@/src/lib/supabase'
import { useAuth } from '@/src/providers/AuthProvider'
import { isBefore } from 'date-fns'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import DeckSwiper from 'react-native-deck-swiper'
import * as Haptics from 'expo-haptics'
import Toast from 'react-native-toast-message'
import { glassyToastConfig } from '@/src/lib/toastConfig'

const toastConfig = glassyToastConfig

const EventImageComponent = ({item, autoOpen = false, onModalClose} : {item : EventsType, autoOpen?: boolean, onModalClose?: () => void}) => {
    const { session } = useAuth()
    const [ imageReady, setImageReady ] = useState(false)
    const [modalVisible, setModalVisible] = useState(autoOpen)
    const [event, setEvent] = useState<EventsType | null>(null)
    const [speakerData, setSpeakerData] = useState<SheikDataType[]>([])
    const [speakerString, setSpeakerString] = useState('')
    const [speakerModalVisible, setSpeakerModalVisible] = useState(false)
    const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(0)
    const deckSwiperRef = useRef<any>(null)
    const [modalImageReady, setModalImageReady] = useState(false)
    const [hasError, setHasError] = useState(false)
    const [eventInNotifications, setEventInNotifications] = useState(false)
    const [eventInPrograms, setEventInPrograms] = useState(false)
    const slideAnim = useRef(new Animated.Value(0)).current
    const panY = useRef(new Animated.Value(0)).current
    const panYValue = useRef(0)
    const modalScrollRef = useRef<ScrollView>(null)
    const isScrolling = useRef(false)
    const scrollOffset = useRef(0)
    const previousScrollOffset = useRef(0)
    const isClosing = useRef(false)
    const [modalToast, setModalToast] = useState<{ type: string; props: any } | null>(null)
    const router = useRouter()
    const { width, height } = Dimensions.get("window")
    
    // Pan responder for slide-down gesture - only on drag handle
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => {
                // Only respond if ScrollView is at the top
                return scrollOffset.current === 0 && !isScrolling.current;
            },
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                // Only respond to downward gestures when scroll is at top
                if (scrollOffset.current > 0 || isScrolling.current) return false;
                // Require significant downward movement to avoid conflicts
                return gestureState.dy > 15 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 2;
            },
            onPanResponderGrant: () => {
                panY.setValue(0);
                panYValue.current = 0;
            },
            onPanResponderMove: (evt, gestureState) => {
                // Only allow downward movement, with resistance at the top
                if (gestureState.dy > 0) {
                    // Add slight resistance for smoother feel
                    const resistance = gestureState.dy < 50 ? 0.5 : 1;
                    const newValue = gestureState.dy * resistance;
                    panY.setValue(newValue);
                    panYValue.current = newValue;
                }
            },
            onPanResponderTerminate: () => {
                // Snap back
                Animated.spring(panY, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 40,
                    friction: 8,
                }).start();
            },
            onPanResponderRelease: (evt, gestureState) => {
                const threshold = -10; // Dismiss immediately on any downward drag
                
                if (gestureState.dy > threshold || gestureState.vy > 0.5) {
                    // Mark as closing to prevent re-renders
                    isClosing.current = true;
                    
                    // Stop any ongoing animations
                    slideAnim.stopAnimation();
                    panY.stopAnimation();
                    
                    // Get current panY value from gesture
                    const currentPanY = gestureState.dy;
                    const remainingDistance = height - currentPanY;
                    
                    // Ensure panY is at current position before animating
                    panY.setValue(currentPanY);
                    panYValue.current = currentPanY;
                    
                    // Animate panY from current position to height
                    Animated.timing(panY, {
                        toValue: height,
                        duration: Math.max(150, Math.min(300, 300 * (remainingDistance / height))),
                        useNativeDriver: true,
                    }).start((finished) => {
                        if (finished) {
                            // Clean up after animation completes
                            setModalVisible(false);
                            setSpeakerData([]);
                            setSpeakerString('');
                            panY.setValue(0);
                            panYValue.current = 0;
                            slideAnim.setValue(0);
                            scrollOffset.current = 0;
                            previousScrollOffset.current = 0;
                            isScrolling.current = false;
                            isClosing.current = false;
                        }
                    });
                } else {
                    // Snap back to open position
                    Animated.spring(panY, {
                        toValue: 0,
                        useNativeDriver: true,
                        tension: 50,
                        friction: 9,
                    }).start(() => {
                        panYValue.current = 0;
                    });
                }
            },
        })
    ).current

    const closeModal = useCallback(() => {
        // Don't close if already closing via drag
        if (isClosing.current) return;
        
        // Haptic feedback for closing
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        // Stop all ongoing animations
        slideAnim.stopAnimation();
        panY.stopAnimation();
        
        panY.setValue(0);
        panYValue.current = 0;
        scrollOffset.current = 0; // Reset scroll position
        previousScrollOffset.current = 0; // Reset previous scroll position
        isScrolling.current = false; // Reset scrolling state
        
        Animated.parallel([
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 65,
                friction: 11,
            }),
            Animated.spring(panY, {
                toValue: 0,
                useNativeDriver: true,
                tension: 65,
                friction: 11,
            })
        ]).start(() => {
            setModalVisible(false);
            setSpeakerData([]);
            setSpeakerString('');
            setModalImageReady(false);
            panYValue.current = 0;
            previousScrollOffset.current = 0;
        });
    }, [slideAnim, panY]);

    const fetchEventData = async () => {
        if (!item.event_id) return;
        
        const { data: eventData, error } = await supabase
            .from('events')
            .select('*')
            .eq('event_id', item.event_id)
            .single();
        
        if (eventData && !error) {
            setEvent(eventData);
            // Check if event is in notifications/programs
            if (session?.user?.id) {
                const { data: notificationData } = await supabase
                    .from('program_notification_schedule')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .eq('program_event_name', eventData.event_name)
                    .single();
                setEventInNotifications(!!notificationData);

                const { data: programData } = await supabase
                    .from('user_programs')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .eq('program_event_id', eventData.event_id)
                    .single();
                setEventInPrograms(!!programData);
            }
        }
    };

    const fetchSpeakerData = async () => {
        const speakerArray = Array.isArray(item.event_speaker) ? item.event_speaker : (item.event_speaker ? [item.event_speaker] : []);
        if (speakerArray && speakerArray.length > 0) {
            const speakers: SheikDataType[] = [];
            let speaker_string: string[] = speakerArray.map(() => '');
            
            await Promise.all(
                speakerArray.map(async (speaker_id: string, index: number) => {
                    const { data: speakerInfo } = await supabase
                        .from('speaker_data')
                        .select('*')
                        .eq('speaker_id', speaker_id)
                        .single();
                    
                    if (speakerInfo) {
                        if (index === speakerArray.length - 1) {
                            speaker_string[index] = speakerInfo.speaker_name;
                        } else {
                            speaker_string[index] = speakerInfo.speaker_name + ' & ';
                        }
                        speakers.push(speakerInfo);
                    }
                })
            );
            
            setSpeakerData(speakers);
            setSpeakerString(speaker_string.join(''));
        }
    };

    const openModal = useCallback(() => {
        // Reset closing state
        isClosing.current = false;
        
        // Haptic feedback for opening
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        setModalVisible(true);
        setModalImageReady(false);
        setHasError(false);
        panY.setValue(0); // Reset pan gesture
        panYValue.current = 0;
        scrollOffset.current = 0; // Reset scroll position
        previousScrollOffset.current = 0; // Reset previous scroll position
        isScrolling.current = false; // Reset scrolling state
        
        // Stop any ongoing animations
        slideAnim.stopAnimation();
        panY.stopAnimation();
        
        // Enhanced spring animation for smoother feel
        Animated.spring(slideAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
        }).start();
        
        fetchEventData();
        fetchSpeakerData();
    }, [slideAnim, item.event_id]);

    // Reset error state when item changes
    useEffect(() => {
        setHasError(false);
        setImageReady(false);
    }, [item.event_id]);

    useEffect(() => {
        if (modalVisible) {
            fetchEventData();
            fetchSpeakerData();
        }
    }, [modalVisible, item.event_id]);

    // Reset speaker index when modal opens
    useEffect(() => {
        if (speakerModalVisible) {
            setCurrentSpeakerIndex(0);
            // Jump to first card when modal opens
            setTimeout(() => {
                if (deckSwiperRef.current && speakerData.length > 0) {
                    try {
                        deckSwiperRef.current.jumpToCardIndex(0);
                    } catch (error) {
                        console.log('Error jumping to card index:', error);
                    }
                }
            }, 100);
        }
    }, [speakerModalVisible]);

    // Auto-open modal when autoOpen prop is true
    const hasOpenedRef = useRef(false);
    useEffect(() => {
        if (autoOpen && !hasOpenedRef.current) {
            hasOpenedRef.current = true;
            // Trigger animation
            Animated.spring(slideAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 40,
                friction: 8,
            }).start();
            // Fetch data
            fetchEventData();
            fetchSpeakerData();
        }
    }, [autoOpen]);

    // Call onModalClose callback when modal closes (only after it was opened)
    useEffect(() => {
        if (!modalVisible && hasOpenedRef.current && onModalClose) {
            onModalClose();
        }
    }, [modalVisible]);

    const handleNotificationPress = async () => {
        if (!session?.user?.id || !event) return;
        
        if (eventInNotifications) {
            // Remove from notifications
            const { error } = await supabase
                .from('program_notification_schedule')
                .delete()
                .eq('user_id', session.user.id)
                .eq('program_event_name', event.event_name);
            
            if (!error) {
                setEventInNotifications(false);
            }
        } else {
            // Add to notifications
            const { error } = await supabase
                .from('program_notification_schedule')
                .insert({
                    user_id: session.user.id,
                    program_event_name: event.event_name,
                    notification_type: 'event',
                    title: event.event_name
                });
            
            if (!error) {
                setEventInNotifications(true);
                
                const goToNotificationCenter = () => {
                    setModalToast(null);
                    closeModal();
                    setTimeout(() => {
                        router.push('/myPrograms/notifications/NotificationEvents?initialTab=programs');
                    }, 400);
                };
                
                setModalToast({
                    type: 'addEventToNotificationsToast',
                    props: { props: event, onPress: goToNotificationCenter }
                });
                setTimeout(() => setModalToast(null), 3000);
            }
        }
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const handleAddToProgramsPress = async () => {
        if (!session?.user?.id || !event) return;
        
        if (eventInPrograms) {
            // Remove from programs
            const { error } = await supabase
                .from('user_programs')
                .delete()
                .eq('user_id', session.user.id)
                .eq('program_event_id', event.event_id);
            
            if (!error) {
                setEventInPrograms(false);
            }
        } else {
            // Add to programs
            const { error } = await supabase
                .from('user_programs')
                .insert({
                    user_id: session.user.id,
                    program_event_id: event.event_id,
                    program_event_name: event.event_name,
                    program_event_type: 'event'
                });
            
            if (!error) {
                setEventInPrograms(true);
                
                const goToLibrary = () => {
                    setModalToast(null);
                    closeModal();
                    setTimeout(() => {
                        router.push('/myPrograms');
                    }, 400);
                };
                
                setModalToast({
                    type: 'EventAddedToLibrary',
                    props: { props: event, onPress: goToLibrary }
                });
                setTimeout(() => setModalToast(null), 3000);
            }
        }
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const renderSpeakerCard = (speakerData: SheikDataType, index: number) => {
        const cardWidth = width * 0.85;
        const maxCardHeight = height * 0.55; // 55% of screen height
        
        return (
            <View style={{ 
                width: width,
                height: maxCardHeight,
                justifyContent: 'center', 
                alignItems: 'center',
            }}>
                <BlurView
                    intensity={80}
                    tint="dark"
                    style={{
                        borderRadius: 50,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 8,
                        elevation: 4,
                        backgroundColor: 'rgba(107, 114, 128, 0.6)',
                        overflow: 'hidden',
                        width: cardWidth,
                        height: maxCardHeight,
                    }}
                >
                    <ScrollView
                        showsVerticalScrollIndicator={true}
                        scrollEnabled={true}
                        nestedScrollEnabled={true}
                        scrollEventThrottle={16}
                        directionalLockEnabled={true}
                        alwaysBounceVertical={false}
                        bounces={false}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{
                            paddingTop: 24,
                            paddingBottom: 30,
                            paddingHorizontal: 24,
                        }}
                        style={{ flex: 1 }}
                    >
                        <View className='flex-row items-center mb-4'>
                            <View style={{
                                width: 100,
                                height: 100,
                                borderRadius: 50,
                                overflow: 'hidden',
                                borderWidth: 3,
                                borderColor: '#E5E7EB',
                                marginRight: 16,
                            }}>
                                <Image 
                                    source={speakerData?.speaker_img ? { uri: speakerData.speaker_img } : require("@/assets/images/MASHomeLogo.png")} 
                                    style={{ width: '100%', height: '100%' }} 
                                    resizeMode='cover'
                                />
                            </View>
                            <View className='flex-1'>
                                <Text className='text-xs text-gray-300 font-medium mb-1'>SPEAKER</Text>
                                <Text className='text-xl font-bold text-white' numberOfLines={2}>
                                    {speakerData?.speaker_name}
                                </Text>
                            </View>
                        </View>
                        <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(156, 163, 175, 0.4)', paddingTop: 16, marginTop: 4 }}>
                            {speakerData?.speaker_name === "MAS" ? (
                                <Text className='text-sm font-bold text-white mb-3'>Impact</Text>
                            ) : (
                                <Text className='text-sm font-bold text-white mb-3'>Credentials</Text>
                            )}
                            <View className='flex-col'>
                                {speakerData?.speaker_creds?.map((cred, i) => (
                                    <View key={i} className='flex-row items-start mb-2'>
                                        <View style={{ marginRight: 8, marginTop: 2 }}>
                                            <Icon source="cards-diamond-outline" size={16} color='#60A5FA'/>
                                        </View>
                                        <Text className='text-sm text-gray-100 flex-1'>{cred}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </ScrollView>
                </BlurView>
            </View>
        );
    };

    const GetSheikData = () => {
        if (!speakerData || speakerData.length === 0) {
            return (
                <View className='flex-1 items-center justify-center'>
                    <Text className='text-white'>No speaker data available</Text>
                </View>
            );
        }

        const cardWidth = width * 0.85;
        const maxCardHeight = height * 0.55;
        
        // If only one speaker, render the card directly without DeckSwiper
        if (speakerData.length === 1) {
            return (
                <View style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ height: maxCardHeight, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                        {renderSpeakerCard(speakerData[0], 0)}
                    </View>
                </View>
            );
        }
        
        // Multiple speakers - use DeckSwiper
        return (
            <View style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ height: maxCardHeight, width: '100%' }}>
                    <DeckSwiper
                        ref={deckSwiperRef}
                        cards={speakerData}
                        renderCard={renderSpeakerCard}
                        cardIndex={currentSpeakerIndex}
                        onSwiped={(swipedIndex) => {
                            // After swiping, the next card becomes visible
                            const nextIndex = swipedIndex + 1;
                            if (nextIndex < speakerData.length) {
                                setCurrentSpeakerIndex(nextIndex);
                            } else {
                                // If we've swiped all cards, reset to 0
                                setCurrentSpeakerIndex(0);
                            }
                        }}
                        onSwipedAll={() => {
                            setCurrentSpeakerIndex(0);
                        }}
                        cardVerticalMargin={0}
                        cardHorizontalMargin={0}
                        stackSize={3}
                        stackSeparation={0}
                        animateCardOpacity
                        animateOverlayLabels
                        disableTopSwipe
                        disableBottomSwipe
                        swipeBackCard
                        verticalSwipe={false}
                        backgroundColor="transparent"
                        overlayLabels={{
                            left: {
                                title: 'NOPE',
                                style: {
                                    label: {
                                        backgroundColor: 'transparent',
                                        borderColor: 'transparent',
                                        color: 'transparent',
                                    },
                                    wrapper: {
                                        flexDirection: 'column',
                                        alignItems: 'flex-end',
                                        justifyContent: 'flex-start',
                                        marginTop: 20,
                                        marginLeft: -20,
                                    }
                                }
                            },
                            right: {
                                title: 'LIKE',
                                style: {
                                    label: {
                                        backgroundColor: 'transparent',
                                        borderColor: 'transparent',
                                        color: 'transparent',
                                    },
                                    wrapper: {
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        justifyContent: 'flex-start',
                                        marginTop: 20,
                                        marginLeft: 20,
                                    }
                                }
                            }
                        }}
                    />
                </View>
                {/* Pagination Indicators */}
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: 16,
                    gap: 8,
                }}>
                    {speakerData.map((_, index) => (
                        <View
                            key={index}
                            style={{
                                width: currentSpeakerIndex === index ? 24 : 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: currentSpeakerIndex === index ? '#60A5FA' : 'rgba(255, 255, 255, 0.3)',
                            }}
                        />
                    ))}
                </View>
            </View>
        );
    };

    const handlePress = useCallback(async () => {
        // If event has lectures, check if lectures exist and have YouTube links
        if (item.has_lecture) {
            // Fetch event lectures to check for YouTube links
            const { data: eventLectures, error } = await supabase
                .from('events_lectures')
                .select('event_lecture_link')
                .eq('event_id', item.event_id);
            
            if (eventLectures && eventLectures.length > 0) {
                // Check if any lecture has a YouTube link
                const hasYouTubeLink = eventLectures.some(lecture => 
                    lecture.event_lecture_link && 
                    lecture.event_lecture_link.trim() !== '' && 
                    lecture.event_lecture_link !== 'N/A'
                );
                
                if (hasYouTubeLink) {
                    router.push(`/menu/program/events/${item.event_id}` as any);
                    return;
                }
            }
        }
        
        // If no YouTube lectures found, open the slide-up modal
        openModal();
    }, [item.has_lecture, item.event_id, router, openModal]);

    return (
        <>
            <View className='flex-col relative'>
                <Pressable onPress={handlePress}>
                    { !imageReady && 
                        <FlyerSkeleton width={150} height={150} style={{position : 'absolute', top : 0, zIndex : 2}}/>
                    }
                    <Image 
                        source={(hasError || !item.event_img || item.event_img.trim() === '') 
                            ? require("@/assets/images/massicliquidglassicon.png") 
                            : { uri : item.event_img }} 
                        style={{ width : 150, height : 150, borderRadius : 8, margin : 5 }}  
                        resizeMode="cover"
                        onLoad={() => setImageReady(true)}
                        onError={() => {
                            setImageReady(true);
                            setHasError(true);
                        }}
                    />
                    <Text className='text-black font-medium pl-2 text-[10px] w-[150px] text-center' numberOfLines={1}>{item.event_name}</Text>
                </Pressable>

                {/* Description Card - Show for all events with descriptions */}
                {item.event_desc && (
                    <View style={{
                        marginHorizontal: 5,
                        marginTop: 4,
                    }}>
                        <Pressable onPress={handlePress}>
                            <Text 
                                className="text-[#0D509D] text-[10px] text-center"
                            >
                                Read full description
                            </Text>
                        </Pressable>
                    </View>
                )}
            </View>

            {/* Event Detail Modal - Slide Up - Show if no lectures OR if autoOpen is true */}
            {(modalVisible || isClosing.current) && (autoOpen || !item.has_lecture) && (
                <Portal>
                    <Modal
                        visible={modalVisible}
                        onDismiss={() => {}}
                        dismissable={false}
                        contentContainerStyle={{
                            backgroundColor: 'transparent',
                            margin: 0,
                            padding: 0,
                            height: '100%',
                            width: '100%',
                            borderWidth: 0,
                        }}
                        style={{ justifyContent: 'flex-end', margin: 0, padding: 0 }}
                    >
                        <Animated.View
                            style={{
                                opacity: slideAnim,
                                flex: 1,
                                backgroundColor: 'transparent',
                            }}
                        >
                            {/* Full screen dark backdrop */}
                            <Pressable 
                                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                                onPress={closeModal}
                            />
                            {/* Bottom sheet positioned at bottom */}
                            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                            <Animated.View
                                style={{
                                    height: height * 0.90,
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: 40,
                                    marginHorizontal: 10,
                                    marginBottom: -20,
                                    overflow: 'hidden',
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: -4 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 20,
                                    elevation: 20,
                                    transform: [
                                        {
                                            translateY: Animated.add(
                                                slideAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [height, 0],
                                                }),
                                                panY
                                            )
                                        }
                                    ]
                                }}
                            >
                                {/* Drag Handle */}
                                <Animated.View
                                    {...panResponder.panHandlers}
                                    style={{
                                        width: '100%',
                                        paddingTop: 12,
                                        paddingBottom: 4,
                                        alignItems: 'center',
                                        backgroundColor: 'transparent',
                                        zIndex: 20,
                                    }}
                                >
                                    <View style={{
                                        width: 40,
                                        height: 4,
                                        borderRadius: 2,
                                        backgroundColor: '#D1D5DB',
                                    }} />
                                </Animated.View>
                                
                                {/* Floating Buttons - pinned over content */}
                                <View style={{ 
                                    position: 'absolute',
                                    top: 28,
                                    left: 20,
                                    right: 20,
                                    flexDirection: 'row', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    zIndex: 20,
                                    pointerEvents: 'box-none',
                                }}>
                                    <Pressable 
                                        onPress={closeModal} 
                                        style={{ 
                                            width: 36, 
                                            height: 36, 
                                            borderRadius: 18,
                                            backgroundColor: 'rgba(255,255,255,0.9)',
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            shadowColor: '#000',
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: 0.15,
                                            shadowRadius: 4,
                                            elevation: 3,
                                        }}
                                    >
                                        <Icon source="close" size={20} color="#374151" />
                                    </Pressable>
                                    
                                    <View style={{ flexDirection: 'row', gap: 10 }}>
                                        {event && isBefore(new Date().toISOString(), event.event_end_date || '') && (
                                            <Pressable
                                                onPress={handleNotificationPress} 
                                                style={{ 
                                                    width: 36, 
                                                    height: 36, 
                                                    borderRadius: 18,
                                                    backgroundColor: eventInNotifications ? '#0D509D' : 'rgba(255,255,255,0.9)',
                                                    alignItems: 'center', 
                                                    justifyContent: 'center',
                                                    shadowColor: '#000',
                                                    shadowOffset: { width: 0, height: 2 },
                                                    shadowOpacity: 0.15,
                                                    shadowRadius: 4,
                                                    elevation: 3,
                                                }}
                                            >
                                                <Icon source={eventInNotifications ? "bell-check" : "bell-outline"} size={18} color={eventInNotifications ? '#FFFFFF' : '#374151'}/>
                                            </Pressable>
                                        )}
                                        <Pressable 
                                            onPress={handleAddToProgramsPress} 
                                            style={{ 
                                                width: 36, 
                                                height: 36, 
                                                borderRadius: 18,
                                                backgroundColor: eventInPrograms ? 'rgba(16,185,129,0.9)' : 'rgba(255,255,255,0.9)',
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                shadowColor: '#000',
                                                shadowOffset: { width: 0, height: 2 },
                                                shadowOpacity: 0.15,
                                                shadowRadius: 4,
                                                elevation: 3,
                                            }}
                                        >
                                            <Icon source={eventInPrograms ? 'check' : 'plus'} size={18} color={eventInPrograms ? '#FFFFFF' : '#374151'}/>
                                        </Pressable>
                                    </View>
                                </View>

                                {/* Main Content */}
                                <ScrollView 
                                    ref={modalScrollRef}
                                    showsVerticalScrollIndicator={false}
                                    bounces={true}
                                    contentContainerStyle={{ paddingBottom: 120 }}
                                    style={{ flex: 1 }}
                                >
                                    {/* Image Section */}
                                    <View style={{ 
                                        marginHorizontal: 16, 
                                        borderRadius: 16, 
                                        overflow: 'hidden',
                                        marginBottom: 20,
                                    }}>
                                        <View>
                                        {!modalImageReady && (
                                            <FlyerSkeleton 
                                                    width={width - 32} 
                                                    height={height * 0.55} 
                                                    style={{ position: 'absolute', top: 0, zIndex: 2, borderRadius: 16 }} 
                                                />
                                            )}
                                            <Image
                                                source={(hasError || !item.event_img || item.event_img.trim() === '')
                                                    ? require("@/assets/images/massicliquidglassicon.png")
                                                    : { uri: item.event_img }}
                                                style={{
                                                    width: '100%',
                                                    height: undefined,
                                                    aspectRatio: 0.7,
                                                }}
                                                resizeMode="cover"
                                                onLoad={() => setModalImageReady(true)}
                                                onError={() => {
                                                    setHasError(true);
                                                    setModalImageReady(true);
                                                }}
                                            />
                                        </View>
                                    </View>
                                    
                                    {/* Event Info Section */}
                                    <View style={{ paddingHorizontal: 16 }}>
                                        {/* Event Name */}
                                        <Text style={{ 
                                            color: '#111827', 
                                            fontSize: 24, 
                                            fontWeight: '700',
                                            marginBottom: 8,
                                        }}>
                                            {event?.event_name || item.event_name}
                                        </Text>
                                        
                                        {/* Speaker Pill */}
                                        {speakerString && (
                                            <Pressable 
                                                onPress={() => setSpeakerModalVisible(true)} 
                                                style={{ 
                                                    alignSelf: 'flex-start',
                                                    marginBottom: 16,
                                                }}
                                            >
                                                <View style={{
                                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                                    paddingHorizontal: 12,
                                                    paddingVertical: 8,
                                                    borderRadius: 20,
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    borderWidth: 1,
                                                    borderColor: 'rgba(16, 185, 129, 0.3)',
                                                }}>
                                                    <Icon source="account" size={16} color="#059669" />
                                                    <Text style={{ color: '#059669', fontWeight: '600', fontSize: 14, marginLeft: 6, marginRight: 4 }}>
                                                    {speakerString}
                                                </Text>
                                                    <Icon source="chevron-right" size={14} color="#059669" />
                                                </View>
                                            </Pressable>
                                        )}

                                        {/* Description */}
                                        {(event?.event_desc || item.event_desc) && (
                                            <View style={{
                                                backgroundColor: '#F9FAFB',
                                                borderRadius: 16,
                                                padding: 16,
                                                marginBottom: 20,
                                                borderWidth: 1,
                                                borderColor: '#E5E7EB',
                                            }}>
                                                <Text style={{ 
                                                    color: '#6B7280', 
                                                    fontSize: 11, 
                                                    fontWeight: '600',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: 1,
                                                    marginBottom: 10,
                                                }}>
                                                    About
                                            </Text>
                                                <Text style={{ 
                                                    color: '#374151', 
                                                    fontSize: 15, 
                                                    lineHeight: 24,
                                                }}>
                                                        {event?.event_desc || item.event_desc}
                                                    </Text>
                                                </View>
                                        )}
                                    </View>
                                </ScrollView>

                                {/* Fixed Bottom Action Bar */}
                                <View style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    paddingHorizontal: 16,
                                    paddingTop: 16,
                                    paddingBottom: 20,
                                    backgroundColor: '#FFFFFF',
                                    borderTopWidth: 1,
                                    borderTopColor: '#E5E7EB',
                                    borderBottomLeftRadius: 32,
                                    borderBottomRightRadius: 32,
                                }}>
                                    <View style={{ flexDirection: 'row', gap: 12 }}>
                                        {(event?.is_paid || item.is_paid) && (
                                            <Pressable
                                                onPress={async () => {
                                                    const paidLink = event?.paid_link || item.paid_link;
                                                    if (paidLink) {
                                                        setModalVisible(false);
                                                        await WebBrowser.openBrowserAsync(paidLink);
                                                    }
                                                }}
                                                style={{
                                                    flex: 1,
                                                    backgroundColor: '#0D509D',
                                                    paddingVertical: 16,
                                                    borderRadius: 14,
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: 8,
                                                }}
                                            >
                                                <Icon source="cart-outline" size={20} color="#FFFFFF"/>
                                                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>
                                                    Register Now
                                                    </Text>
                                            </Pressable>
                                        )}
                                        
                                        <Pressable
                                            onPress={handleAddToProgramsPress}
                                            style={{
                                                width: (event?.is_paid || item.is_paid) ? 56 : '100%',
                                                flex: (event?.is_paid || item.is_paid) ? undefined : 1,
                                                backgroundColor: eventInPrograms ? 'rgba(16,185,129,0.15)' : '#F3F4F6',
                                                paddingVertical: 16,
                                                borderRadius: 14,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 8,
                                                borderWidth: 1,
                                                borderColor: eventInPrograms ? 'rgba(16,185,129,0.3)' : '#E5E7EB',
                                            }}
                                        >
                                            <Icon 
                                                source={eventInPrograms ? 'heart' : 'heart-outline'} 
                                                size={22} 
                                                color={eventInPrograms ? '#10B981' : '#374151'}
                                            />
                                            {!(event?.is_paid || item.is_paid) && (
                                                <Text style={{ color: eventInPrograms ? '#10B981' : '#374151', fontWeight: '700', fontSize: 16 }}>
                                                    {eventInPrograms ? 'Saved' : 'Save to Library'}
                                                </Text>
                                            )}
                                        </Pressable>
                                        </View>
                                    </View>
                            </Animated.View>
                            </View>
                        </Animated.View>
                        
                        {/* Speaker Modal */}
                        <Portal>
                            <Modal
                                visible={speakerModalVisible}
                                onDismiss={() => {
                                    setSpeakerModalVisible(false);
                                    setCurrentSpeakerIndex(0);
                                    // Reset to first card when closing
                                    setTimeout(() => {
                                        if (deckSwiperRef.current && speakerData.length > 0) {
                                            try {
                                                deckSwiperRef.current.jumpToCardIndex(0);
                                            } catch (error) {
                                                console.log('Error jumping to card index:', error);
                                            }
                                        }
                                    }, 100);
                                }}
                                contentContainerStyle={{
                                    backgroundColor: 'transparent',
                                    padding: 20,
                                    minHeight: 400,
                                    maxHeight: "70%",
                                    width: "95%",
                                    borderRadius: 35,
                                    alignSelf: "center"
                                }}
                            >
                                <View style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                                    <GetSheikData />
                                </View>
                            </Modal>
                        </Portal>
                    </Modal>
                    
                    {/* Custom Toast Notification - Renders inside modal Portal to appear on top */}
                    {modalToast && (
                        <View
                            style={{
                                position: 'absolute',
                                top: 50,
                                left: 0,
                                right: 0,
                                zIndex: 9999,
                                alignItems: 'center',
                                justifyContent: 'center',
                                pointerEvents: 'box-none',
                                paddingHorizontal: 16,
                            }}
                        >
                            <View style={{ width: '100%', maxWidth: '100%' }}>
                                <Pressable 
                                    onPress={() => {
                                        if (modalToast.props.onPress) {
                                            modalToast.props.onPress();
                                        }
                                        setModalToast(null);
                                    }}
                                    className='rounded-xl overflow-hidden'
                                    style={{ width: '100%', maxWidth: '100%' }}
                                >
                                    <View style={{ maxWidth: '100%', overflow: 'hidden' }}>
                                        {toastConfig[modalToast.type as keyof typeof toastConfig]?.({ props: modalToast.props } as any)}
                                    </View>
                                </Pressable>
                            </View>
                        </View>
                    )}
                </Portal>
            )}
        </>
    )
}

export default EventImageComponent
