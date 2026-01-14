import { View, Text, StatusBar, useWindowDimensions, Image, ScrollView, Pressable, StyleSheet } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import YoutubePlayer from "react-native-youtube-iframe"
import { Icon } from 'react-native-paper'
import { supabase } from '@/src/lib/supabase'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LiquidGlassView, isLiquidGlassSupported } from '@/src/lib/liquidGlass'

const QuranRecitation = () => {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { quran_id, youtube_id, surah, speaker_name, speaker_id, speaker_img } = useLocalSearchParams()
  const layoutHeight = useWindowDimensions().height
  const layout = useWindowDimensions().width
  const [playing, setPlaying] = useState(false)
  const [speakerCreds, setSpeakerCreds] = useState<string[]>()

  const onStateChange = useCallback((state: any) => {
    if (state === "ended") {
      setPlaying(false);
    }
  }, []);

  const getCreds = async () => {
    const { data, error } = await supabase.from('speaker_data').select('speaker_creds').eq('speaker_id', speaker_id).single()
    if (data?.speaker_creds) {
      setSpeakerCreds(data.speaker_creds)
    }
  }

  useEffect(() => {
    getCreds()
  }, [])

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={'light-content'} />

      {/* Custom Header - Blue */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        {isLiquidGlassSupported ? (
          <LiquidGlassView
            style={styles.liquidGlassContainer}
            interactive
            effect="clear"
          >
            <Pressable
              onPress={() => router.back()}
              style={styles.backButtonInner}
            >
              <Icon source="chevron-left" size={24} color="#FFFFFF" />
            </Pressable>
          </LiquidGlassView>
        ) : (
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Icon source="chevron-left" size={24} color="#FFFFFF" />
          </Pressable>
        )}
        <Text style={styles.headerTitle} numberOfLines={1}>
          {surah as string}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Video Player */}
      <View style={styles.videoContainer}>
        <View style={styles.videoWrapper}>
          <YoutubePlayer
            height={layoutHeight / 4}
            width={layout - 32}
            play={playing}
            videoId={youtube_id as string}
            onChangeState={onStateChange}
          />
        </View>
      </View>

      {/* Speaker Card */}
      <ScrollView 
        style={styles.contentContainer}
        contentContainerStyle={styles.contentContainerStyle}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.speakerCard}>
          {/* Speaker Header */}
          <View style={styles.speakerHeader}>
            <View style={styles.speakerImageContainer}>
              <Image
                source={speaker_img ? { uri: speaker_img as string } : require("@/assets/images/MASHomeLogo.png")}
                style={styles.speakerImage}
                resizeMode='cover'
              />
            </View>
            <View style={styles.speakerInfo}>
              <Text style={styles.speakerLabel}>Reciter</Text>
              <Text style={styles.speakerName} numberOfLines={2}>{speaker_name}</Text>
            </View>
          </View>

          {/* Credentials Section */}
          {speakerCreds && speakerCreds.length > 0 && (
            <View style={styles.credentialsSection}>
              <Text style={styles.credentialsTitle}>
                {speaker_name === "MAS" ? "Impact" : "Credentials"}
              </Text>
              <View style={styles.credentialsList}>
                {speakerCreds.map((cred, i) => (
                  <View key={i} style={styles.credentialItem}>
                    <View style={styles.credentialBullet}>
                      <Icon source="circle" size={6} color='#0D509D' />
                    </View>
                    <Text style={styles.credentialText}>{cred}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#0D509D',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  liquidGlassContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    overflow: 'hidden',
  },
  backButtonInner: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  headerSpacer: {
    width: 40,
  },
  videoContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  videoWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  contentContainerStyle: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  speakerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  speakerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speakerImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(13, 80, 157, 0.15)',
  },
  speakerImage: {
    width: '100%',
    height: '100%',
  },
  speakerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  speakerLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  speakerName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  credentialsSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  credentialsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D509D',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  credentialsList: {
    gap: 10,
  },
  credentialItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  credentialBullet: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  credentialText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
});

export default QuranRecitation