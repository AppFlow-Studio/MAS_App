import { View, Text, ScrollView, StatusBar, RefreshControl, ActivityIndicator, FlatList, Pressable, Dimensions, useWindowDimensions, TextInput, Platform, Image } from 'react-native'
import React, { useEffect, useState, useRef, useMemo, useCallback, memo } from 'react'
import { Stack, useRouter, useNavigation } from 'expo-router'
import { Icon } from 'react-native-paper'
import { Ionicons } from '@expo/vector-icons'
import { Program, EventsType } from '@/src/types'
import { useProgramsWithRecordedLectures } from '@/src/hooks/usePrograms'
import { useEventsWithRecordedLectures } from '@/src/hooks/useEvents'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeIn, withSpring, interpolate, useAnimatedScrollHandler, runOnJS } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LiquidGlassView, isLiquidGlassSupported } from '@/src/lib/liquidGlass'

// Memoized Program Card Component for better list performance
const ProgramCard = memo(({ item, onPress }: { item: Program, onPress: () => void }) => {
  const [imageError, setImageError] = useState(false)

  return (
    <Pressable
      onPress={onPress}
      style={{ marginHorizontal: 16, marginBottom: 20 }}
    >
      <View style={{
        backgroundColor: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
      }}>
        {/* Image */}
        <View style={{ width: '100%', height: 200, backgroundColor: '#F3F4F6' }}>
          <Image
            source={(imageError || !item.program_img || item.program_img.trim() === '')
              ? require("@/assets/images/massicliquidglassicon.png")
              : { uri: item.program_img }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        </View>

        {/* Content */}
        <View style={{
          padding: 16,
          borderTopWidth: 1,
          borderTopColor: '#D1D5DB'
        }}>
          <Text
            className="text-xl font-bold text-gray-900 mb-2"
            numberOfLines={2}
          >
            {item.program_name}
          </Text>

          {item.program_desc && (
            <Text
              className="text-sm text-gray-600 leading-5"
              numberOfLines={3}
              style={{ marginTop: 8 }}
            >
              {item.program_desc}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  )
});

ProgramCard.displayName = 'ProgramCard';

// Memoized Event Card Component for better list performance
const EventCard = memo(({ item, onPress }: { item: EventsType, onPress: () => void }) => {
  const [imageError, setImageError] = useState(false)

  return (
    <Pressable
      onPress={onPress}
      style={{ marginHorizontal: 16, marginBottom: 20 }}
    >
      <View style={{
        backgroundColor: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
      }}>
        {/* Image */}
        <View style={{ width: '100%', height: 200, backgroundColor: '#F3F4F6' }}>
          <Image
            source={(imageError || !item.event_img || item.event_img.trim() === '')
              ? require("@/assets/images/massicliquidglassicon.png")
              : { uri: item.event_img }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        </View>

        {/* Content */}
        <View style={{
          padding: 16,
          borderTopWidth: 1,
          borderTopColor: '#D1D5DB'
        }}>
          <Text
            className="text-xl font-bold text-gray-900 mb-2"
            numberOfLines={2}
          >
            {item.event_name}
          </Text>

          {item.event_desc && (
            <Text
              className="text-sm text-gray-600 leading-5"
              numberOfLines={3}
              style={{ marginTop: 8 }}
            >
              {item.event_desc}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  )
});

EventCard.displayName = 'EventCard';

const RecordedLectures = () => {
  const router = useRouter()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const { data: programsWithLectures = [], isLoading: programsLoading, refetch: refetchPrograms } = useProgramsWithRecordedLectures()
  const { data: eventsWithLectures = [], isLoading: eventsLoading, refetch: refetchEvents } = useEventsWithRecordedLectures()
  const loading = programsLoading || eventsLoading
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'programs' | 'events'>('programs')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchActive, setIsSearchActive] = useState(false)
  const searchInputRef = useRef<TextInput>(null)
  const pagerRef = useRef<Animated.ScrollView>(null)
  const tabPosition = useSharedValue(0)
  const scrollX = useSharedValue(0)
  const searchBarWidth = useSharedValue(0)

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await Promise.all([refetchPrograms(), refetchEvents()])
    } finally {
      setRefreshing(false)
    }
  }

  const handleTabChange = (tab: 'programs' | 'events') => {
    setActiveTab(tab)
    const targetX = tab === 'programs' ? 0 : width
    pagerRef.current?.scrollTo({ x: targetX, animated: true })
  }

  const updateActiveTab = useCallback((index: number) => {
    setActiveTab(index === 0 ? 'programs' : 'events')
  }, [])

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x
      tabPosition.value = event.contentOffset.x / width
    },
    onMomentumEnd: (event) => {
      const index = Math.round(event.contentOffset.x / width)
      runOnJS(updateActiveTab)(index)
    },
  })

  const tabContainerPadding = 1
  const tabIndicatorWidthValue = useSharedValue(0)
  
  const handleTabLayout = (e: { nativeEvent: { layout: { width: number } } }) => {
    const containerWidth = e.nativeEvent.layout.width
    const indicatorWidth = (containerWidth - tabContainerPadding * 2) / 2
    tabIndicatorWidthValue.value = indicatorWidth
  }

  const tabAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: tabIndicatorWidthValue.value,
      transform: [{ translateX: tabPosition.value * tabIndicatorWidthValue.value }]
    }
  })

  // Filter programs and events based on search query
  const filteredPrograms = useMemo(() => {
    if (!searchQuery.trim()) {
      return programsWithLectures
    }
    const query = searchQuery.toLowerCase().trim()
    return programsWithLectures.filter(program => 
      program.program_name?.toLowerCase().includes(query) ||
      program.program_desc?.toLowerCase().includes(query)
    )
  }, [programsWithLectures, searchQuery])

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) {
      return eventsWithLectures
    }
    const query = searchQuery.toLowerCase().trim()
    return eventsWithLectures.filter(event => 
      event.event_name?.toLowerCase().includes(query) ||
      event.event_desc?.toLowerCase().includes(query)
    )
  }, [eventsWithLectures, searchQuery])

  // Memoized render function for Program Card
  const renderProgramCard = useCallback(({ item }: { item: Program }) => (
    <ProgramCard
      item={item}
      onPress={() => router.push(`/myPrograms/programs/${item.program_id}` as any)}
    />
  ), [router]);

  // Memoized render function for Event Card
  const renderEventCard = useCallback(({ item }: { item: EventsType }) => (
    <EventCard
      item={item}
      onPress={() => router.push(`/myPrograms/events/${item.event_id}` as any)}
    />
  ), [router]);

  // Memoized keyExtractors
  const programKeyExtractor = useCallback((item: Program) => item.program_id, []);
  const eventKeyExtractor = useCallback((item: EventsType) => item.event_id, []);

  // Memoized getItemLayout (estimated item height: image 200 + padding 32 + text ~80 = ~312)
  const getItemLayout = useCallback((data: any, index: number) => ({
    length: 332,
    offset: 332 * index,
    index,
  }), []);

  const activateSearch = () => {
    setIsSearchActive(true)
    searchBarWidth.value = withSpring(1, { damping: 20, stiffness: 90, mass: 0.8 })
    setTimeout(() => searchInputRef.current?.focus(), 250)
  }

  const deactivateSearch = () => {
    searchInputRef.current?.blur()
    searchBarWidth.value = withSpring(0, { damping: 22, stiffness: 100, mass: 0.8 })
    setTimeout(() => {
      setIsSearchActive(false)
      setSearchQuery('')
    }, 300)
  }

  const searchBarAnimatedStyle = useAnimatedStyle(() => ({
    width: interpolate(searchBarWidth.value, [0, 1], [40, width - 32]),
  }))

  const searchIconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(searchBarWidth.value, [0, 0.3], [1, 0]),
    transform: [{ scale: interpolate(searchBarWidth.value, [0, 0.3], [1, 0.8]) }],
  }))

  const searchContentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(searchBarWidth.value, [0.4, 0.7], [0, 1]),
  }))

  const backButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(searchBarWidth.value, [0, 0.5], [1, 0]),
    transform: [{ 
      translateX: interpolate(searchBarWidth.value, [0, 1], [0, -60]) 
    }],
  }))

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(searchBarWidth.value, [0, 0.3], [1, 0]),
  }))

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }}
      />
      <StatusBar barStyle="light-content" />
      
      {/* Custom Header with Liquid Glass morphing search */}
      <View style={{ backgroundColor: '#214E91', paddingTop: insets.top }}>
        <View style={{ 
          height: 56, 
          flexDirection: 'row', 
          alignItems: 'center', 
          paddingHorizontal: 16,
          position: 'relative',
        }}>
          {/* Liquid Glass Back Button - slides out when searching */}
          <Animated.View style={[{ zIndex: 1, position: 'absolute', left: 16 }, backButtonAnimatedStyle]}>
            {isLiquidGlassSupported ? (
              <LiquidGlassView
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  overflow: 'hidden',
                }}
                interactive
                effect="clear"
              >
                <Pressable 
                  onPress={() => {
                    if (!isSearchActive) {
                      navigation.getParent()?.getState().index == 0 ? router.replace('/myPrograms') : router.back()
                    }
                  }}
                  style={{
                    width: 40,
                    height: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="chevron-back" size={22} color="white" />
                </Pressable>
              </LiquidGlassView>
            ) : (
              <Pressable 
                onPress={() => {
                  if (!isSearchActive) {
                    navigation.getParent()?.getState().index == 0 ? router.replace('/myPrograms') : router.back()
                  }
                }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="chevron-back" size={22} color="white" />
              </Pressable>
            )}
          </Animated.View>
          
          {/* Title - fades out when searching */}
          <Animated.Text style={[{ 
            flex: 1,
            color: 'white', 
            fontSize: 17, 
            fontWeight: '600',
            textAlign: 'center',
          }, titleAnimatedStyle]}>
            Recorded Lectures
          </Animated.Text>
          
          {/* Morphing Liquid Glass Search Button → Search Bar */}
          <Animated.View 
            style={[
              {
                position: 'absolute',
                right: 16,
                height: 40,
                borderRadius: 20,
                overflow: 'hidden',
              },
              searchBarAnimatedStyle
            ]}
          >
            {isLiquidGlassSupported ? (
              <LiquidGlassView 
                style={{
                  flex: 1,
                  borderRadius: 20,
                  overflow: 'hidden',
                }}
                interactive
                effect="clear"
              >
                <View style={{ flex: 1, position: 'relative' }}>
                  {/* Centered search icon (visible when collapsed) */}
                  <Animated.View 
                    style={[
                      {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        alignItems: 'center',
                        justifyContent: 'center',
                      },
                      searchIconAnimatedStyle
                    ]}
                  >
                    <Pressable 
                      onPress={activateSearch}
                      style={{
                        width: 40,
                        height: 40,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="search" size={20} color="white" />
                    </Pressable>
                  </Animated.View>
                  
                  {/* Search bar content (visible when expanded) */}
                  <Animated.View 
                    style={[
                      {
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingLeft: 12,
                        paddingRight: 4,
                      },
                      searchContentAnimatedStyle
                    ]}
                  >
                    <Ionicons name="search" size={17} color="rgba(255, 255, 255, 0.8)" />
                    <TextInput
                      ref={searchInputRef}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder="Search..."
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      style={{
                        flex: 1,
                        color: 'white',
                        fontSize: 15,
                        marginLeft: 6,
                        paddingVertical: 0,
                      }}
                      returnKeyType="search"
                    />
                    <Pressable 
                      onPress={searchQuery.length > 0 ? () => setSearchQuery('') : deactivateSearch}
                      style={{ paddingLeft: 6, paddingRight: 10, paddingVertical: 6 }}
                    >
                      <Ionicons name="close" size={20} color="white" />
                    </Pressable>
                  </Animated.View>
                </View>
              </LiquidGlassView>
            ) : (
              <View style={{
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 20,
              }}>
                <View style={{ flex: 1, position: 'relative' }}>
                  {/* Centered search icon (visible when collapsed) */}
                  <Animated.View 
                    style={[
                      {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        alignItems: 'center',
                        justifyContent: 'center',
                      },
                      searchIconAnimatedStyle
                    ]}
                  >
                    <Pressable 
                      onPress={activateSearch}
                      style={{
                        width: 40,
                        height: 40,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="search" size={20} color="white" />
                    </Pressable>
                  </Animated.View>
                  
                  {/* Search bar content (visible when expanded) */}
                  <Animated.View 
                    style={[
                      {
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingLeft: 12,
                        paddingRight: 4,
                      },
                      searchContentAnimatedStyle
                    ]}
                  >
                    <Ionicons name="search" size={17} color="rgba(255, 255, 255, 0.7)" />
                    <TextInput
                      ref={searchInputRef}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder="Search..."
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      style={{
                        flex: 1,
                        color: 'white',
                        fontSize: 15,
                        marginLeft: 6,
                        paddingVertical: 0,
                      }}
                      returnKeyType="search"
                    />
                    <Pressable 
                      onPress={searchQuery.length > 0 ? () => setSearchQuery('') : deactivateSearch}
                      style={{ paddingLeft: 6, paddingRight: 10, paddingVertical: 6 }}
                    >
                      <Ionicons name="close" size={20} color="white" />
                    </Pressable>
                  </Animated.View>
                </View>
              </View>
            )}
          </Animated.View>
        </View>
      </View>
      {loading ? (
        <View className="flex-1 items-center justify-center bg-white">
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : programsWithLectures.length === 0 && eventsWithLectures.length === 0 ? (
        <ScrollView 
          contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 16, paddingTop: 16 }}
          className="bg-white flex-1"
        >
          <View className="items-center justify-center" style={{ minHeight: 400 }}>
            <Icon source="video-off" size={64} color="#9CA3AF" />
            <Text className="text-2xl font-bold mt-4 text-center text-gray-700">No Recorded Lectures</Text>
            <Text className="text-gray-500 text-center mt-2">
              There are no programs or events with YouTube videos at this time.
            </Text>
          </View>
        </ScrollView>
      ) : (
        <View className="bg-white flex-1">
          {/* Custom Tab Bar */}
          <View className="bg-white" style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}>
            <View 
              className="flex-row relative" 
              style={{ backgroundColor: '#F3F4F6', borderRadius: 20, padding: tabContainerPadding }}
              onLayout={handleTabLayout}
            >
              <Animated.View 
                style={[
                  {
                    position: 'absolute',
                    backgroundColor: 'rgba(33, 78, 145, 0.15)',
                    borderRadius: 19,
                    top: tabContainerPadding,
                    bottom: tabContainerPadding,
                    left: tabContainerPadding,
                  },
                  tabAnimatedStyle
                ]}
              />
              <Pressable 
                onPress={() => handleTabChange('programs')}
                style={{ flex: 1, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', zIndex: 1 }}
              >
                <View className="flex-row items-center">
                  <Icon 
                    source="book-open-variant" 
                    size={18} 
                    color={activeTab === 'programs' ? '#214E91' : '#6B7280'} 
                  />
                  <Text 
                    className="font-semibold ml-2"
                    style={{ color: activeTab === 'programs' ? '#214E91' : '#6B7280', fontSize: 14 }}
                  >
                    Programs
                  </Text>
                  {filteredPrograms.length > 0 && (
                    <View style={{ 
                      marginLeft: 6, 
                      backgroundColor: activeTab === 'programs' ? 'rgba(33, 78, 145, 0.2)' : '#D1D5DB',
                      borderRadius: 10,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      minWidth: 20,
                      alignItems: 'center'
                    }}>
                      <Text style={{ 
                        color: activeTab === 'programs' ? '#214E91' : '#6B7280',
                        fontSize: 11,
                        fontWeight: 'bold'
                      }}>
                        {filteredPrograms.length}
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
              <Pressable 
                onPress={() => handleTabChange('events')}
                style={{ flex: 1, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', zIndex: 1 }}
              >
                <View className="flex-row items-center">
                  <Icon 
                    source="calendar-star" 
                    size={18} 
                    color={activeTab === 'events' ? '#214E91' : '#6B7280'} 
                  />
                  <Text 
                    className="font-semibold ml-2"
                    style={{ color: activeTab === 'events' ? '#214E91' : '#6B7280', fontSize: 14 }}
                  >
                    Events
                  </Text>
                  {filteredEvents.length > 0 && (
                    <View style={{ 
                      marginLeft: 6, 
                      backgroundColor: activeTab === 'events' ? 'rgba(33, 78, 145, 0.2)' : '#D1D5DB',
                      borderRadius: 10,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      minWidth: 20,
                      alignItems: 'center'
                    }}>
                      <Text style={{ 
                        color: activeTab === 'events' ? '#214E91' : '#6B7280',
                        fontSize: 11,
                        fontWeight: 'bold'
                      }}>
                        {filteredEvents.length}
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            </View>
          </View>

          {/* Tab Content - Horizontal Pager */}
          <Animated.ScrollView
            ref={pagerRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            bounces={false}
            style={{ flex: 1 }}
          >
            {/* Programs Page */}
            <View style={{ width, flex: 1 }}>
              {filteredPrograms.length > 0 ? (
                <FlatList
                  data={filteredPrograms}
                  renderItem={renderProgramCard}
                  keyExtractor={programKeyExtractor}
                  getItemLayout={getItemLayout}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
                  refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                  }
                  // Performance optimizations
                  initialNumToRender={4}
                  maxToRenderPerBatch={4}
                  windowSize={5}
                  removeClippedSubviews={true}
                />
              ) : (
                <ScrollView 
                  contentContainerStyle={{ paddingBottom: 100, paddingTop: 40, flexGrow: 1 }}
                  style={{ flex: 1, backgroundColor: 'white' }}
                  refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                  }
                  showsVerticalScrollIndicator={false}
                >
                  <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
                    <Icon source="book-open-variant" size={64} color="#9CA3AF" />
                    <Text className="text-xl font-bold mt-4 text-center text-gray-700">
                      {searchQuery.trim() ? 'No Programs Found' : 'No Programs'}
                    </Text>
                    <Text className="text-gray-500 text-center mt-2">
                      {searchQuery.trim() 
                        ? 'Try adjusting your search terms.'
                        : 'There are no programs with YouTube videos at this time.'}
                    </Text>
                  </View>
                </ScrollView>
              )}
            </View>

            {/* Events Page */}
            <View style={{ width, flex: 1 }}>
              {filteredEvents.length > 0 ? (
                <FlatList
                  data={filteredEvents}
                  renderItem={renderEventCard}
                  keyExtractor={eventKeyExtractor}
                  getItemLayout={getItemLayout}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
                  refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                  }
                  // Performance optimizations
                  initialNumToRender={4}
                  maxToRenderPerBatch={4}
                  windowSize={5}
                  removeClippedSubviews={true}
                />
              ) : (
                <ScrollView 
                  contentContainerStyle={{ paddingBottom: 100, paddingTop: 40, flexGrow: 1 }}
                  style={{ flex: 1, backgroundColor: 'white' }}
                  refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                  }
                  showsVerticalScrollIndicator={false}
                >
                  <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
                    <Icon source="calendar-star" size={64} color="#9CA3AF" />
                    <Text className="text-xl font-bold mt-4 text-center text-gray-700">
                      {searchQuery.trim() ? 'No Events Found' : 'No Events'}
                    </Text>
                    <Text className="text-gray-500 text-center mt-2">
                      {searchQuery.trim() 
                        ? 'Try adjusting your search terms.'
                        : 'There are no events with YouTube videos at this time.'}
                    </Text>
                  </View>
                </ScrollView>
              )}
            </View>
          </Animated.ScrollView>
        </View>
      )}

    </>
  )
}

export default RecordedLectures

