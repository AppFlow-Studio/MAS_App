import React, { useState } from 'react';
import { Text, StyleSheet, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, withTiming, runOnJS, useAnimatedStyle } from 'react-native-reanimated';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useAuth } from '../providers/AuthProvider';
import { userSignedInThisSession } from '../app/(auth)/_layout';

// Intro video overlay - shown on top of the whole app during load and for returning signed-in users
export default function IntroVideoOverlay() {
  const { session, loading: authLoading } = useAuth();
  const [videoDismissed, setVideoDismissed] = useState(false);
  const videoOpacity = useSharedValue(1);
  const whiteOverlayOpacity = useSharedValue(1);
  const insets = useSafeAreaInsets();

  // Show video: during auth load, or for returning user (session + didn't just sign in) until dismissed
  const showVideo =
    (authLoading || (session && !userSignedInThisSession)) &&
    !videoDismissed;

  const videoStyle = useAnimatedStyle(() => ({ opacity: videoOpacity.value }));
  const whiteOverlayStyle = useAnimatedStyle(() => ({ opacity: whiteOverlayOpacity.value }));

  // Fade out the white overlay once the video is ready to play
  const handleVideoReady = () => {
    whiteOverlayOpacity.value = withTiming(0, { duration: 800 });
  };

  const handleDismiss = () => {
    videoOpacity.value = withTiming(0, { duration: 500 }, () => {
      runOnJS(setVideoDismissed)(true);
    });
  };

  if (!showVideo) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, { zIndex: 9999 }, videoStyle]}
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]} />
      <Video
        source={require('@/assets/videos/TestIntro.mp4')}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping={false}
        onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
          if (status.isLoaded && status.didJustFinish) {
            handleDismiss();
          }
          // Fade out white overlay once video starts playing
          if (status.isLoaded && status.isPlaying) {
            handleVideoReady();
          }
        }}
      />
      {/* White overlay that matches the native splash — fades out to reveal video */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: '#fff' }, whiteOverlayStyle]}
      />
      <Pressable
        onPress={handleDismiss}
        style={[
          styles.skipButton,
          { top: insets.top + 8, right: Math.max(insets.right, 12) + 8 },
        ]}
      >
        <Text style={styles.skipButtonText}>Skip</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  skipButton: {
    position: 'absolute',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(100, 100, 100, 0.85)',
  },
  skipButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
