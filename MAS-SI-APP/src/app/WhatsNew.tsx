import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  Dimensions,
  StatusBar,
  Pressable,
  Platform,
  Image,
  StyleSheet,
} from 'react-native'
import { Stack, router } from 'expo-router'
import PagerView from 'react-native-pager-view'
import Animated, {
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { Icon } from 'react-native-paper'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { WHATS_NEW_VERSION_KEY, getAppVersion } from './_layout'

const { width, height } = Dimensions.get('window')

// Phone mockup dimensions
const PHONE_WIDTH = width * 0.48
const PHONE_HEIGHT = PHONE_WIDTH * 2.0
const PHONE_BORDER_RADIUS = 32
const SCREEN_BORDER_RADIUS = 24

// Feature data for What's New slideshow
const FEATURES = [
  {
    id: 1,
    image: require('@/assets/images/whatsNew/feature1.png'),
    title: 'Redesigned Home',
    subtitle: 'A fresh new look',
    description: 'Beautiful prayer times display, upcoming programs at a glance, and easy access to weekly programs.',
  },
  {
    id: 2,
    image: require('@/assets/images/whatsNew/feature2.png'),
    title: 'Your Library',
    subtitle: 'All in one place',
    description: 'Save favorite lectures, explore curated collections, and create your own custom playlists.',
  },
  {
    id: 3,
    image: require('@/assets/images/whatsNew/feature3.png'),
    title: 'For You',
    subtitle: 'Personalized recommendations',
    description: 'Discover programs and events tailored to your interests and preferences.',
  },
  {
    id: 4,
    image: require('@/assets/images/whatsNew/feature4.png'),
    title: 'AI Summaries',
    subtitle: 'Powered by intelligence',
    description: 'Get instant AI-generated summaries and keynotes for every lecture.',
  },
]

// Pagination dot component
const PaginationDot = ({ index, currentIndex }: { index: number; currentIndex: number }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const isActive = index === currentIndex
    return {
      width: withTiming(isActive ? 24 : 8, { duration: 250 }),
      opacity: withTiming(isActive ? 1 : 0.4, { duration: 250 }),
    }
  })

  return (
    <Animated.View
      style={[
        {
          height: 8,
          borderRadius: 4,
          marginHorizontal: 4,
          backgroundColor: '#ffffff',
        },
        animatedStyle,
      ]}
    />
  )
}

// Phone mockup component
const PhoneMockup = ({ image }: { image: any }) => {
  return (
    <View style={styles.phoneContainer}>
      {/* Phone frame */}
      <View style={styles.phoneFrame}>
        {/* Screen */}
        <View style={styles.phoneScreen}>
          <Image
            source={image}
            style={styles.screenImage}
            resizeMode="cover"
          />
        </View>
      </View>
      
      {/* Reflection/Glow effect */}
      <View style={styles.phoneGlow} />
    </View>
  )
}

// Feature card component
const FeatureCard = ({
  feature,
  index,
  currentIndex,
}: {
  feature: typeof FEATURES[0]
  index: number
  currentIndex: number
}) => {
  return (
    <View style={styles.cardContainer} key={feature.id}>
      {/* Text Content at top */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(400)}
        style={styles.textContainer}
      >
        <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
        <Text style={styles.featureTitle}>{feature.title}</Text>
        <Text style={styles.featureDescription}>{feature.description}</Text>
      </Animated.View>

      {/* Phone Mockup */}
      <Animated.View
        entering={FadeInUp.delay(200).duration(500)}
        style={styles.phoneWrapper}
      >
        <PhoneMockup image={feature.image} />
      </Animated.View>
    </View>
  )
}

export default function WhatsNew() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const pagerRef = useRef<PagerView>(null)

  const handlePageSelected = (e: any) => {
    setCurrentIndex(e.nativeEvent.position)
  }

  const handleNext = () => {
    if (currentIndex < FEATURES.length - 1) {
      pagerRef.current?.setPage(currentIndex + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = async () => {
    // Save current version to AsyncStorage (use getAppVersion so it matches the check in user layout)
    const currentVersion = getAppVersion()
    await AsyncStorage.setItem(WHATS_NEW_VERSION_KEY, currentVersion)
    
    // Navigate to main app
    router.replace('/(user)/menu')
  }

  const handleSkip = async () => {
    // Save current version to AsyncStorage (use getAppVersion so it matches the check in user layout)
    const currentVersion = getAppVersion()
    await AsyncStorage.setItem(WHATS_NEW_VERSION_KEY, currentVersion)
    
    // Navigate to main app
    router.replace('/(user)/menu')
  }

  const isLastPage = currentIndex === FEATURES.length - 1

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      {/* Background Gradient */}
      <LinearGradient
        colors={['#0D47A1', '#1565C0', '#0D47A1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Subtle pattern overlay */}
      <View style={styles.patternOverlay} />

      {/* Header */}
      <Animated.View
        entering={FadeIn.delay(100).duration(400)}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>NEW</Text>
          </View>
        </View>
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
          <Icon source="chevron-right" size={16} color="rgba(255,255,255,0.7)" />
        </Pressable>
      </Animated.View>

      {/* Pager View for Swiping */}
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={handlePageSelected}
      >
        {FEATURES.map((feature, index) => (
          <View key={feature.id} style={styles.page}>
            <FeatureCard
              feature={feature}
              index={index}
              currentIndex={currentIndex}
            />
          </View>
        ))}
      </PagerView>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {FEATURES.map((_, index) => (
            <PaginationDot key={index} index={index} currentIndex={currentIndex} />
          ))}
        </View>

        {/* Action Button */}
        <Pressable
          onPress={handleNext}
          style={styles.actionButton}
        >
          <Text style={styles.actionButtonText}>
            {isLastPage ? 'Get Started' : 'Continue'}
          </Text>
          <Icon
            source={isLastPage ? 'check' : 'arrow-right'}
            size={20}
            color="#0D47A1"
          />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D47A1',
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  versionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  versionText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: '#ffffff',
    letterSpacing: 1.5,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  skipText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  textContainer: {
    paddingTop: 8,
    paddingBottom: 16,
    alignItems: 'center',
  },
  featureSubtitle: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  featureTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 32,
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  featureDescription: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  phoneWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
  },
  phoneContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneFrame: {
    width: PHONE_WIDTH,
    height: PHONE_HEIGHT,
    backgroundColor: '#1a1a1a',
    borderRadius: PHONE_BORDER_RADIUS,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: SCREEN_BORDER_RADIUS,
    overflow: 'hidden',
  },
  screenImage: {
    width: '100%',
    height: '100%',
  },
  phoneGlow: {
    position: 'absolute',
    width: PHONE_WIDTH + 40,
    height: PHONE_HEIGHT + 40,
    borderRadius: PHONE_BORDER_RADIUS + 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    zIndex: -1,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 50 : 32,
    paddingTop: 16,
    backgroundColor: 'transparent',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  actionButton: {
    width: '100%',
    backgroundColor: '#ffffff',
    paddingVertical: 18,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  actionButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 17,
    color: '#0D47A1',
    marginRight: 8,
  },
})
