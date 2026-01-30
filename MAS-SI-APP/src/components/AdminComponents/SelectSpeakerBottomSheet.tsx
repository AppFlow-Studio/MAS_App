import { View, Text, Pressable, FlatList, Image, TextInput as RNTextInput, Modal, Platform, StyleSheet, Dimensions, Keyboard } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import Svg, { Path } from 'react-native-svg'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.9

interface Speaker {
  speaker_id: string
  speaker_name: string
  speaker_img?: string
  speaker_creds?: string[]
}

interface SelectSpeakerBottomSheetProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  speakers: Speaker[]
  selectedSpeakers?: string[]
  onSelectSpeaker: (speakerId: string) => void
  multiSelect?: boolean
  title?: string
}

const SelectSpeakerBottomSheet = ({
  isOpen,
  setIsOpen,
  speakers,
  selectedSpeakers = [],
  onSelectSpeaker,
  multiSelect = false,
  title = "Select Speaker"
}: SelectSpeakerBottomSheetProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const insets = useSafeAreaInsets()
  
  const translateY = useSharedValue(SHEET_HEIGHT)
  const backdropOpacity = useSharedValue(0)

  // Listen for keyboard events
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    )
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    )
    return () => {
      keyboardWillShow.remove()
      keyboardWillHide.remove()
    }
  }, [])

  const filteredSpeakers = speakers.filter(speaker =>
    speaker.speaker_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isSelected = (speakerId: string) => selectedSpeakers.includes(speakerId)

  const closeSheet = useCallback(() => {
    setIsVisible(false)
    translateY.value = SHEET_HEIGHT
    backdropOpacity.value = 0
    setSearchQuery('')
  }, [])

  const openSheet = useCallback(() => {
    translateY.value = withSpring(0, { 
      damping: 25, 
      stiffness: 300,
      mass: 0.8,
    })
    backdropOpacity.value = withTiming(1, { duration: 250 })
  }, [])

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setTimeout(() => {
        openSheet()
      }, 50)
    } else if (isVisible) {
      translateY.value = withTiming(SHEET_HEIGHT, { duration: 250 }, () => {
        runOnJS(closeSheet)()
      })
      backdropOpacity.value = withTiming(0, { duration: 200 })
    }
  }, [isOpen])

  const handleSelect = (speakerId: string) => {
    onSelectSpeaker(speakerId)
    if (!multiSelect) {
      translateY.value = withTiming(SHEET_HEIGHT, { duration: 250 }, () => {
        runOnJS(closeSheet)()
        runOnJS(setIsOpen)(false)
      })
      backdropOpacity.value = withTiming(0, { duration: 200 })
    }
  }

  const handleClose = () => {
    Keyboard.dismiss()
    translateY.value = withTiming(SHEET_HEIGHT, { duration: 250 }, () => {
      runOnJS(closeSheet)()
      runOnJS(setIsOpen)(false)
    })
    backdropOpacity.value = withTiming(0, { duration: 200 })
  }

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }))

  if (!isVisible) return null

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={{ flex: 1 }}>
        {/* Backdrop */}
        <Pressable 
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
        >
          <Animated.View style={[styles.backdrop, animatedBackdropStyle]} />
        </Pressable>

        {/* Floating Sheet Container */}
        <View style={styles.sheetWrapper}>
          <Animated.View 
            style={[
              styles.sheetContainer,
              { 
                height: SHEET_HEIGHT - (keyboardHeight > 0 ? keyboardHeight : 0),
                marginBottom: keyboardHeight > 0 ? keyboardHeight : Platform.OS === 'ios' ? 12 : 10,
              },
              animatedSheetStyle
            ]}
          >
            {/* Handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* Header */}
            <View style={styles.headerContainer}>
              <View style={styles.headerRow}>
                <Text style={styles.headerTitle}>{title}</Text>
                <Pressable 
                  onPress={handleClose}
                  style={styles.closeButton}
                >
                  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <Path d="M15 5L5 15M5 5L15 15" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/>
                  </Svg>
                </Pressable>
              </View>

              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <Path 
                    d="M8.25 14.25C11.5637 14.25 14.25 11.5637 14.25 8.25C14.25 4.93629 11.5637 2.25 8.25 2.25C4.93629 2.25 2.25 4.93629 2.25 8.25C2.25 11.5637 4.93629 14.25 8.25 14.25Z" 
                    stroke="#9CA3AF" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <Path 
                    d="M15.75 15.75L12.4875 12.4875" 
                    stroke="#9CA3AF" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </Svg>
                <RNTextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search speakers..."
                  placeholderTextColor="#9CA3AF"
                  style={styles.searchInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  clearButtonMode="while-editing"
                />
              </View>
            </View>

            {/* Speaker List */}
            <FlatList
              data={filteredSpeakers}
              keyExtractor={(item) => item.speaker_id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              style={{ flex: 1 }}
              renderItem={({ item }) => {
                const selected = isSelected(item.speaker_id)
                return (
                  <Pressable
                    onPress={() => handleSelect(item.speaker_id)}
                    style={[
                      styles.speakerItem,
                      selected && styles.speakerItemSelected
                    ]}
                  >
                    {/* Avatar */}
                    <View style={styles.avatarContainer}>
                      {item.speaker_img ? (
                        <Image
                          source={{ uri: item.speaker_img }}
                          style={styles.avatar}
                        />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarText}>
                            {item.speaker_name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Info */}
                    <View style={styles.speakerInfo}>
                      <Text 
                        style={[
                          styles.speakerName,
                          selected && styles.speakerNameSelected
                        ]}
                        numberOfLines={1}
                      >
                        {item.speaker_name}
                      </Text>
                      {item.speaker_creds && item.speaker_creds.length > 0 && (
                        <Text 
                          style={[
                            styles.speakerCreds,
                            selected && styles.speakerCredsSelected
                          ]}
                          numberOfLines={1}
                        >
                          {item.speaker_creds[0]}
                        </Text>
                      )}
                    </View>

                    {/* Checkmark */}
                    {selected && (
                      <View style={styles.checkmark}>
                        <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <Path 
                            d="M11.6667 3.5L5.25 9.91667L2.33333 7" 
                            stroke="white" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          />
                        </Svg>
                      </View>
                    )}
                  </Pressable>
                )
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No speakers found</Text>
                </View>
              }
            />

            {multiSelect && selectedSpeakers.length > 0 && (
              <View style={[styles.footer, { paddingBottom: 20 }]}>
                <Pressable
                  onPress={handleClose}
                  style={styles.doneButton}
                >
                  <Text style={styles.doneButtonText}>
                    Done ({selectedSpeakers.length} selected)
                  </Text>
                </Pressable>
              </View>
            )}
          </Animated.View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheetWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: 'white',
    borderRadius: 40,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  searchContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  speakerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  speakerItemSelected: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7280',
  },
  speakerInfo: {
    flex: 1,
  },
  speakerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  speakerNameSelected: {
    color: '#1D4ED8',
  },
  speakerCreds: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  speakerCredsSelected: {
    color: '#3B82F6',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  doneButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
})

export default SelectSpeakerBottomSheet
