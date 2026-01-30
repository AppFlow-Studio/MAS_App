import { View, Text, Pressable, ScrollView, Alert, Modal, FlatList, TextInput as RNTextInput, StyleSheet, Dimensions, Keyboard, Platform, ActivityIndicator, KeyboardAvoidingView } from 'react-native'
import React, { useEffect, useState, useCallback, useRef } from 'react'
import Svg, { Path, Circle } from 'react-native-svg'
import { Stack } from 'expo-router'
import { TextInput } from 'react-native-paper'
import { supabase } from '@/src/lib/supabase'
import Toast from 'react-native-toast-message'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
  useAnimatedProps,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.9

// Total ayahs in Quran
const TOTAL_AYAHS = 6236

// Surah data with cumulative ayah counts for progress calculation
const Surahs = [
  { number: 1, name: "Al-Fatiha", ayahs: 7, cumulativeAyahs: 7 },
  { number: 2, name: "Al-Baqara", ayahs: 286, cumulativeAyahs: 293 },
  { number: 3, name: "Aal-E-Imran", ayahs: 200, cumulativeAyahs: 493 },
  { number: 4, name: "An-Nisa", ayahs: 176, cumulativeAyahs: 669 },
  { number: 5, name: "Al-Maeda", ayahs: 120, cumulativeAyahs: 789 },
  { number: 6, name: "Al-Anaam", ayahs: 165, cumulativeAyahs: 954 },
  { number: 7, name: "Al-Araf", ayahs: 206, cumulativeAyahs: 1160 },
  { number: 8, name: "Al-Anfal", ayahs: 75, cumulativeAyahs: 1235 },
  { number: 9, name: "At-Tawba", ayahs: 129, cumulativeAyahs: 1364 },
  { number: 10, name: "Yunus", ayahs: 109, cumulativeAyahs: 1473 },
  { number: 11, name: "Hud", ayahs: 123, cumulativeAyahs: 1596 },
  { number: 12, name: "Yusuf", ayahs: 111, cumulativeAyahs: 1707 },
  { number: 13, name: "Ar-Rad", ayahs: 43, cumulativeAyahs: 1750 },
  { number: 14, name: "Ibrahim", ayahs: 52, cumulativeAyahs: 1802 },
  { number: 15, name: "Al-Hijr", ayahs: 99, cumulativeAyahs: 1901 },
  { number: 16, name: "An-Nahl", ayahs: 128, cumulativeAyahs: 2029 },
  { number: 17, name: "Al-Isra", ayahs: 111, cumulativeAyahs: 2140 },
  { number: 18, name: "Al-Kahf", ayahs: 110, cumulativeAyahs: 2250 },
  { number: 19, name: "Maryam", ayahs: 98, cumulativeAyahs: 2348 },
  { number: 20, name: "Taha", ayahs: 135, cumulativeAyahs: 2483 },
  { number: 21, name: "Al-Anbiya", ayahs: 112, cumulativeAyahs: 2595 },
  { number: 22, name: "Al-Hajj", ayahs: 78, cumulativeAyahs: 2673 },
  { number: 23, name: "Al-Mumenoon", ayahs: 118, cumulativeAyahs: 2791 },
  { number: 24, name: "An-Noor", ayahs: 64, cumulativeAyahs: 2855 },
  { number: 25, name: "Al-Furqan", ayahs: 77, cumulativeAyahs: 2932 },
  { number: 26, name: "Ash-Shuara", ayahs: 227, cumulativeAyahs: 3159 },
  { number: 27, name: "An-Naml", ayahs: 93, cumulativeAyahs: 3252 },
  { number: 28, name: "Al-Qasas", ayahs: 88, cumulativeAyahs: 3340 },
  { number: 29, name: "Al-Ankaboot", ayahs: 69, cumulativeAyahs: 3409 },
  { number: 30, name: "Ar-Room", ayahs: 60, cumulativeAyahs: 3469 },
  { number: 31, name: "Luqman", ayahs: 34, cumulativeAyahs: 3503 },
  { number: 32, name: "As-Sajda", ayahs: 30, cumulativeAyahs: 3533 },
  { number: 33, name: "Al-Ahzab", ayahs: 73, cumulativeAyahs: 3606 },
  { number: 34, name: "Saba", ayahs: 54, cumulativeAyahs: 3660 },
  { number: 35, name: "Fatir", ayahs: 45, cumulativeAyahs: 3705 },
  { number: 36, name: "Ya-Seen", ayahs: 83, cumulativeAyahs: 3788 },
  { number: 37, name: "As-Saaffat", ayahs: 182, cumulativeAyahs: 3970 },
  { number: 38, name: "Sad", ayahs: 88, cumulativeAyahs: 4058 },
  { number: 39, name: "Az-Zumar", ayahs: 75, cumulativeAyahs: 4133 },
  { number: 40, name: "Al-Ghafir", ayahs: 85, cumulativeAyahs: 4218 },
  { number: 41, name: "Fussilat", ayahs: 54, cumulativeAyahs: 4272 },
  { number: 42, name: "Ash-Shura", ayahs: 53, cumulativeAyahs: 4325 },
  { number: 43, name: "Az-Zukhruf", ayahs: 89, cumulativeAyahs: 4414 },
  { number: 44, name: "Ad-Dukhan", ayahs: 59, cumulativeAyahs: 4473 },
  { number: 45, name: "Al-Jathiya", ayahs: 37, cumulativeAyahs: 4510 },
  { number: 46, name: "Al-Ahqaf", ayahs: 35, cumulativeAyahs: 4545 },
  { number: 47, name: "Muhammad", ayahs: 38, cumulativeAyahs: 4583 },
  { number: 48, name: "Al-Fath", ayahs: 29, cumulativeAyahs: 4612 },
  { number: 49, name: "Al-Hujraat", ayahs: 18, cumulativeAyahs: 4630 },
  { number: 50, name: "Qaf", ayahs: 45, cumulativeAyahs: 4675 },
  { number: 51, name: "Adh-Dhariyat", ayahs: 60, cumulativeAyahs: 4735 },
  { number: 52, name: "At-Tur", ayahs: 49, cumulativeAyahs: 4784 },
  { number: 53, name: "An-Najm", ayahs: 62, cumulativeAyahs: 4846 },
  { number: 54, name: "Al-Qamar", ayahs: 55, cumulativeAyahs: 4901 },
  { number: 55, name: "Ar-Rahman", ayahs: 78, cumulativeAyahs: 4979 },
  { number: 56, name: "Al-Waqia", ayahs: 96, cumulativeAyahs: 5075 },
  { number: 57, name: "Al-Hadid", ayahs: 29, cumulativeAyahs: 5104 },
  { number: 58, name: "Al-Mujadila", ayahs: 22, cumulativeAyahs: 5126 },
  { number: 59, name: "Al-Hashr", ayahs: 24, cumulativeAyahs: 5150 },
  { number: 60, name: "Al-Mumtahina", ayahs: 13, cumulativeAyahs: 5163 },
  { number: 61, name: "As-Saff", ayahs: 14, cumulativeAyahs: 5177 },
  { number: 62, name: "Al-Jumua", ayahs: 11, cumulativeAyahs: 5188 },
  { number: 63, name: "Al-Munafiqoon", ayahs: 11, cumulativeAyahs: 5199 },
  { number: 64, name: "At-Taghabun", ayahs: 18, cumulativeAyahs: 5217 },
  { number: 65, name: "At-Talaq", ayahs: 12, cumulativeAyahs: 5229 },
  { number: 66, name: "At-Tahrim", ayahs: 12, cumulativeAyahs: 5241 },
  { number: 67, name: "Al-Mulk", ayahs: 30, cumulativeAyahs: 5271 },
  { number: 68, name: "Al-Qalam", ayahs: 52, cumulativeAyahs: 5323 },
  { number: 69, name: "Al-Haaqqa", ayahs: 52, cumulativeAyahs: 5375 },
  { number: 70, name: "Al-Maarij", ayahs: 44, cumulativeAyahs: 5419 },
  { number: 71, name: "Nooh", ayahs: 28, cumulativeAyahs: 5447 },
  { number: 72, name: "Al-Jinn", ayahs: 28, cumulativeAyahs: 5475 },
  { number: 73, name: "Al-Muzzammil", ayahs: 20, cumulativeAyahs: 5495 },
  { number: 74, name: "Al-Muddaththir", ayahs: 56, cumulativeAyahs: 5551 },
  { number: 75, name: "Al-Qiyama", ayahs: 40, cumulativeAyahs: 5591 },
  { number: 76, name: "Al-Insan", ayahs: 31, cumulativeAyahs: 5622 },
  { number: 77, name: "Al-Mursalat", ayahs: 50, cumulativeAyahs: 5672 },
  { number: 78, name: "An-Naba", ayahs: 40, cumulativeAyahs: 5712 },
  { number: 79, name: "An-Naziat", ayahs: 46, cumulativeAyahs: 5758 },
  { number: 80, name: "Abasa", ayahs: 42, cumulativeAyahs: 5800 },
  { number: 81, name: "At-Takwir", ayahs: 29, cumulativeAyahs: 5829 },
  { number: 82, name: "Al-Infitar", ayahs: 19, cumulativeAyahs: 5848 },
  { number: 83, name: "Al-Mutaffifin", ayahs: 36, cumulativeAyahs: 5884 },
  { number: 84, name: "Al-Inshiqaq", ayahs: 25, cumulativeAyahs: 5909 },
  { number: 85, name: "Al-Burooj", ayahs: 22, cumulativeAyahs: 5931 },
  { number: 86, name: "At-Tariq", ayahs: 17, cumulativeAyahs: 5948 },
  { number: 87, name: "Al-Ala", ayahs: 19, cumulativeAyahs: 5967 },
  { number: 88, name: "Al-Ghashiya", ayahs: 26, cumulativeAyahs: 5993 },
  { number: 89, name: "Al-Fajr", ayahs: 30, cumulativeAyahs: 6023 },
  { number: 90, name: "Al-Balad", ayahs: 20, cumulativeAyahs: 6043 },
  { number: 91, name: "Ash-Shams", ayahs: 15, cumulativeAyahs: 6058 },
  { number: 92, name: "Al-Lail", ayahs: 21, cumulativeAyahs: 6079 },
  { number: 93, name: "Ad-Dhuha", ayahs: 11, cumulativeAyahs: 6090 },
  { number: 94, name: "Al-Inshirah", ayahs: 8, cumulativeAyahs: 6098 },
  { number: 95, name: "At-Tin", ayahs: 8, cumulativeAyahs: 6106 },
  { number: 96, name: "Al-Alaq", ayahs: 19, cumulativeAyahs: 6125 },
  { number: 97, name: "Al-Qadr", ayahs: 5, cumulativeAyahs: 6130 },
  { number: 98, name: "Al-Bayyina", ayahs: 8, cumulativeAyahs: 6138 },
  { number: 99, name: "Az-Zalzala", ayahs: 8, cumulativeAyahs: 6146 },
  { number: 100, name: "Al-Adiyat", ayahs: 11, cumulativeAyahs: 6157 },
  { number: 101, name: "Al-Qaria", ayahs: 11, cumulativeAyahs: 6168 },
  { number: 102, name: "At-Takathur", ayahs: 8, cumulativeAyahs: 6176 },
  { number: 103, name: "Al-Asr", ayahs: 3, cumulativeAyahs: 6179 },
  { number: 104, name: "Al-Humaza", ayahs: 9, cumulativeAyahs: 6188 },
  { number: 105, name: "Al-Fil", ayahs: 5, cumulativeAyahs: 6193 },
  { number: 106, name: "Quraish", ayahs: 4, cumulativeAyahs: 6197 },
  { number: 107, name: "Al-Maun", ayahs: 7, cumulativeAyahs: 6204 },
  { number: 108, name: "Al-Kauther", ayahs: 3, cumulativeAyahs: 6207 },
  { number: 109, name: "Al-Kafiroon", ayahs: 6, cumulativeAyahs: 6213 },
  { number: 110, name: "An-Nasr", ayahs: 3, cumulativeAyahs: 6216 },
  { number: 111, name: "Al-Masadd", ayahs: 5, cumulativeAyahs: 6221 },
  { number: 112, name: "Al-Ikhlas", ayahs: 4, cumulativeAyahs: 6225 },
  { number: 113, name: "Al-Falaq", ayahs: 5, cumulativeAyahs: 6230 },
  { number: 114, name: "An-Nas", ayahs: 6, cumulativeAyahs: 6236 }
]

// Calculate progress
const calculateProgress = (surahNumber: number, ayahNumber: number) => {
  if (!surahNumber || !ayahNumber) return { completed: 0, percentage: 0 }
  
  const surah = Surahs.find(s => s.number === surahNumber)
  if (!surah) return { completed: 0, percentage: 0 }
  
  const previousSurahsCumulative = surahNumber > 1 ? Surahs[surahNumber - 2].cumulativeAyahs : 0
  const completed = previousSurahsCumulative + ayahNumber
  const percentage = Math.round((completed / TOTAL_AYAHS) * 100)
  
  return { completed, percentage }
}

// Create AnimatedCircle outside component
const AnimatedCircle = Animated.createAnimatedComponent(Circle)

// Circular Progress Component
const CircularProgress = ({ percentage, size = 120, strokeWidth = 10 }: { percentage: number, size?: number, strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const progressAnimation = useSharedValue(0)
  
  useEffect(() => {
    progressAnimation.value = withTiming(percentage, { duration: 1000 })
  }, [percentage])
  
  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference - (progressAnimation.value / 100) * circumference
    return { strokeDashoffset }
  })
  
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#10B981"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#10B981' }}>{percentage}%</Text>
        <Text style={{ fontSize: 12, color: '#6B7280' }}>Complete</Text>
      </View>
    </View>
  )
}

// Surah Selection Bottom Sheet
interface SurahSheetProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (surah: typeof Surahs[0]) => void
  selectedSurah: typeof Surahs[0] | null
}

const SelectSurahBottomSheet = ({ isOpen, onClose, onSelect, selectedSurah }: SurahSheetProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const insets = useSafeAreaInsets()
  
  const translateY = useSharedValue(SHEET_HEIGHT)
  const backdropOpacity = useSharedValue(0)

  const filteredSurahs = Surahs.filter(surah =>
    surah.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    surah.number.toString().includes(searchQuery)
  )

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

  const closeSheet = useCallback(() => {
    setIsVisible(false)
    translateY.value = SHEET_HEIGHT
    backdropOpacity.value = 0
    setSearchQuery('')
  }, [])

  const openSheet = useCallback(() => {
    translateY.value = withSpring(0, { damping: 25, stiffness: 300, mass: 0.8 })
    backdropOpacity.value = withDelay(100, withTiming(1, { duration: 200 }))
  }, [])

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setTimeout(() => openSheet(), 50)
    } else if (isVisible) {
      translateY.value = withTiming(SHEET_HEIGHT, { duration: 250 }, () => runOnJS(closeSheet)())
      backdropOpacity.value = withTiming(0, { duration: 200 })
    }
  }, [isOpen])

  const handleSelect = (surah: typeof Surahs[0]) => {
    onSelect(surah)
    translateY.value = withTiming(SHEET_HEIGHT, { duration: 250 }, () => {
      runOnJS(closeSheet)()
      runOnJS(onClose)()
    })
    backdropOpacity.value = withTiming(0, { duration: 200 })
  }

  const handleClose = () => {
    translateY.value = withTiming(SHEET_HEIGHT, { duration: 250 }, () => {
      runOnJS(closeSheet)()
      runOnJS(onClose)()
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
    <Modal visible={isVisible} transparent animationType="none" statusBarTranslucent onRequestClose={handleClose}>
      <View style={{ flex: 1 }}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => { Keyboard.dismiss(); handleClose() }}>
          <Animated.View style={[styles.backdrop, animatedBackdropStyle]} />
        </Pressable>

        <View style={styles.sheetWrapper}>
          <Animated.View style={[styles.sheetContainer, { height: SHEET_HEIGHT - (keyboardHeight > 0 ? keyboardHeight : 0), marginBottom: keyboardHeight > 0 ? keyboardHeight : Platform.OS === 'ios' ? 12 : 10 }, animatedSheetStyle]}>
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          <View style={styles.headerContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>Select Surah</Text>
              <Pressable onPress={handleClose} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#F3F4F6' }}>
                <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <Path d="M15 5L5 15M5 5L15 15" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/>
                </Svg>
              </Pressable>
            </View>

            <View style={{ backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
              <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <Path d="M8.25 14.25C11.5637 14.25 14.25 11.5637 14.25 8.25C14.25 4.93629 11.5637 2.25 8.25 2.25C4.93629 2.25 2.25 4.93629 2.25 8.25C2.25 11.5637 4.93629 14.25 8.25 14.25Z" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <Path d="M15.75 15.75L12.4875 12.4875" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </Svg>
              <RNTextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by name or number..."
                placeholderTextColor="#9CA3AF"
                style={{ flex: 1, marginLeft: 12, fontSize: 16, color: '#111827' }}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
            </View>
          </View>

          <FlatList
            data={filteredSurahs}
            keyExtractor={(item) => item.number.toString()}
            contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8, paddingBottom: keyboardHeight > 0 ? 20 : insets.bottom + 20 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            style={{ flex: 1 }}
            renderItem={({ item }) => {
              const isSelected = selectedSurah?.number === item.number
              return (
                <Pressable
                  onPress={() => handleSelect(item)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    marginBottom: 8,
                    backgroundColor: isSelected ? '#ECFDF5' : 'white',
                    borderWidth: isSelected ? 1.5 : 0,
                    borderColor: isSelected ? '#10B981' : 'transparent',
                  }}
                >
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                    backgroundColor: isSelected ? '#10B981' : '#F3F4F6',
                  }}>
                    <Text style={{ fontWeight: 'bold', color: isSelected ? 'white' : '#4B5563' }}>{item.number}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: isSelected ? '#047857' : '#111827' }}>{item.name}</Text>
                    <Text style={{ fontSize: 14, color: isSelected ? '#059669' : '#6B7280' }}>{item.ayahs} Ayahs</Text>
                  </View>
                  {isSelected && (
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' }}>
                      <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <Path d="M11.6667 3.5L5.25 9.91667L2.33333 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </Svg>
                    </View>
                  )}
                </Pressable>
              )
            }}
            ListEmptyComponent={
              <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                <Text style={{ color: '#9CA3AF', fontSize: 16 }}>No surahs found</Text>
              </View>
            }
          />
          </Animated.View>
        </View>
      </View>
    </Modal>
  )
}

const RamadanQuranTracker = () => {
  const QURANAPIURL = 'https://quranapi.pages.dev/api'
  
  const [selectedSurah, setSelectedSurah] = useState<typeof Surahs[0] | null>(null)
  const [selectedAyah, setSelectedAyah] = useState('')
  const [ayahOptions, setAyahOptions] = useState<string[]>([])
  const [ayahError, setAyahError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [surahSheetOpen, setSurahSheetOpen] = useState(false)
  
  const scrollViewRef = useRef<ScrollView>(null)
  const ayahInputY = useRef(0)
  
  const progress = calculateProgress(selectedSurah?.number || 0, Number(selectedAyah) || 0)
  
  const handleSubmit = (message: string) => {
    Toast.show({
      type: "success",
      text1: message,
      position: "top",
      topOffset: 50,
      visibilityTime: 2000,
    })
  }

  const GetSurahsAyats = async (SurahNumber: number) => {
    try {
      const response = await fetch(`${QURANAPIURL}/${SurahNumber}.json`)
      const data = await response.json()
      setAyahOptions(data.arabic1)
    } catch (error) {
      console.error('Error fetching ayahs:', error)
    }
  }

  const GetCurrentSurah = async () => {
    setIsLoading(true)
    try {
      const { data } = await supabase.from('ramadan_quran_tracker').select('*').eq('id', 1).single()
      if (data) {
        setSelectedAyah(String(data.ayah_num))
        await GetSurahsAyats(data.surah)
        const surah = Surahs.find(s => s.number === data.surah)
        if (surah) setSelectedSurah(surah)
      }
    } catch (error) {
      console.error('Error fetching current surah:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const OnSelectSurah = async (surah: typeof Surahs[0]) => {
    setSelectedSurah(surah)
    setSelectedAyah('')
    setAyahError(false)
    await GetSurahsAyats(surah.number)
  }

  const OnUpdate = async () => {
    if (selectedSurah && selectedAyah && !ayahError) {
      setIsSaving(true)
      try {
        const { error } = await supabase.from('ramadan_quran_tracker').update({ 
          surah: selectedSurah.number, 
          ayah_num: selectedAyah, 
          ayah: ayahOptions[Number(selectedAyah) - 1], 
          surah_name: selectedSurah.name,
          num_of_ayahs: selectedSurah.ayahs
        }).eq('id', 1)
        if (!error) handleSubmit("Quran Progress Updated!")
      } catch (error) {
        console.error('Error updating:', error)
      } finally {
        setIsSaving(false)
      }
    } else {
      Alert.alert('Invalid Input', 'Please select a valid Surah and Ayah')
    }
  }

  useEffect(() => {
    GetCurrentSurah()
  }, [])

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' }}>
        <Stack.Screen
          options={{
            title: "Quran Progress",
            headerStyle: { backgroundColor: "#F9FAFB" },
            headerTitleStyle: { fontSize: 22, fontWeight: '600', color: '#1F2937' },
            headerTintColor: '#4A5568',
            headerShadowVisible: false,
          }}
        />
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={{ marginTop: 16, color: '#6B7280' }}>Loading progress...</Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#F9FAFB' }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen
        options={{
          title: "Quran Progress",
          headerStyle: { backgroundColor: "#F9FAFB" },
          headerTitleStyle: { fontSize: 22, fontWeight: '600', color: '#1F2937' },
          headerTintColor: '#4A5568',
          headerShadowVisible: false,
        }}
      />
      <ScrollView ref={scrollViewRef} style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {/* Progress Card */}
        <View style={{ marginHorizontal: 16, marginTop: 16, backgroundColor: 'white', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }}>
          <View style={{ alignItems: 'center' }}>
            <CircularProgress percentage={progress.percentage} />
            <View style={{ marginTop: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1F2937' }}>
                {progress.completed.toLocaleString()} / {TOTAL_AYAHS.toLocaleString()}
              </Text>
              <Text style={{ color: '#6B7280', marginTop: 4 }}>Ayahs Completed</Text>
            </View>
            {selectedSurah && (
              <View style={{ marginTop: 16, backgroundColor: '#ECFDF5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}>
                <Text style={{ color: '#047857', fontWeight: '500' }}>
                  Currently at: {selectedSurah.name} ({selectedSurah.number}:{selectedAyah || '?'})
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Surah Selection */}
        <View style={{ marginHorizontal: 16, marginTop: 24, backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: '#1F2937' }}>Select Surah</Text>
          <Pressable 
            onPress={() => setSurahSheetOpen(true)}
            style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}
          >
            {selectedSurah ? (
              <>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Text style={{ color: '#047857', fontWeight: 'bold' }}>{selectedSurah.number}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#1F2937', fontWeight: '500' }}>{selectedSurah.name}</Text>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>{selectedSurah.ayahs} Ayahs</Text>
                </View>
              </>
            ) : (
              <Text style={{ flex: 1, color: '#9CA3AF' }}>Tap to select a Surah</Text>
            )}
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <Path d="M6 9L12 15L18 9" stroke="#6077F5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
        </View>

        {/* Ayah Input */}
        {selectedSurah && (
          <View 
            style={{ marginHorizontal: 16, marginTop: 16, backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 }}
            onLayout={(event) => { ayahInputY.current = event.nativeEvent.layout.y }}
          >
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: '#1F2937' }}>
              Ayah Number <Text style={{ color: '#9CA3AF', fontWeight: 'normal' }}>(1 - {selectedSurah.ayahs})</Text>
            </Text>
            <TextInput
              mode='outlined'
              value={selectedAyah}
              onChangeText={(text) => {
                if (!text) {
                  setSelectedAyah('')
                  setAyahError(false)
                  return
                }
                const num = Number(text)
                setAyahError(num > selectedSurah.ayahs || num < 1 || !num)
                setSelectedAyah(text)
              }}
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollTo({ y: ayahInputY.current - 100, animated: true })
                }, 300)
              }}
              keyboardType="number-pad"
              style={{ width: "100%", height: 50, backgroundColor: 'white' }}
              theme={{ roundness: 12 }}
              placeholder="Enter Ayah Number"
              activeOutlineColor="#10B981"
              outlineColor="#E2E8F0"
              textColor='black'
              selectionColor='#10B981'
            />
            {ayahError && (
              <Text style={{ color: '#EF4444', fontSize: 14, marginTop: 8 }}>Please enter a number between 1 and {selectedSurah.ayahs}</Text>
            )}
          </View>
        )}

        {/* Ayah Preview */}
        {!ayahError && selectedAyah && ayahOptions[Number(selectedAyah) - 1] && (
          <View style={{ marginHorizontal: 16, marginTop: 16, backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: '#1F2937' }}>Ayah Preview</Text>
            <View style={{ backgroundColor: '#ECFDF5', borderRadius: 12, borderWidth: 1, borderColor: '#D1FAE5', padding: 16 }}>
              <Text style={{ fontSize: 20, color: '#1F2937', lineHeight: 36, textAlign: 'right' }}>
                {ayahOptions[Number(selectedAyah) - 1]}
              </Text>
            </View>
          </View>
        )}

        {/* Update Button */}
        <View style={{ marginHorizontal: 16, marginTop: 24 }}>
          <Pressable
            style={{ height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: isSaving ? '#9CA3AF' : '#10B981' }}
            onPress={OnUpdate}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 18 }}>Update Progress</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
      
      <SelectSurahBottomSheet
        isOpen={surahSheetOpen}
        onClose={() => setSurahSheetOpen(false)}
        onSelect={OnSelectSurah}
        selectedSurah={selectedSurah}
      />
    </KeyboardAvoidingView>
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
    borderRadius: 50,
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
})

export default RamadanQuranTracker
