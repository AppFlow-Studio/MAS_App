import React from 'react';
import { View, Text, Image, Pressable, StyleSheet, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Icon } from 'react-native-paper';
import { Check, Bell, Music, BookOpen } from 'lucide-react-native';
import { BaseToast, ErrorToast, ToastConfig } from 'react-native-toast-message';
import Animated, { SlideInUp, SlideOutUp, Easing } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOAST_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 340); // Shorter, max 340px

// Glassy Toast Wrapper Component with smooth animation
const GlassyToastWrapper = ({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) => (
  <View style={styles.toastOuterContainer}>
    <Animated.View 
      entering={SlideInUp.duration(350).easing(Easing.out(Easing.cubic))}
      exiting={SlideOutUp.duration(250).easing(Easing.in(Easing.cubic))}
      style={styles.animatedContainer}
    >
      <Pressable onPress={onPress} style={styles.toastPressable}>
        <BlurView 
          intensity={80} 
          tint="dark" 
          style={styles.blurView}
        >
          <View style={styles.glassOverlay}>
            {children}
          </View>
        </BlurView>
      </Pressable>
    </Animated.View>
  </View>
);

// Glassy Toast Configuration
export const glassyToastConfig: ToastConfig = {
  // Program added to notifications
  addProgramToNotificationsToast: ({ props }: any) => (
    <GlassyToastWrapper onPress={props?.onPress}>
      <View style={styles.toastContent}>
        <Image 
          source={props?.props?.program_img ? { uri: props.props.program_img } : require("@/assets/images/MASHomeLogo.png")} 
          style={styles.toastImage}
        />
        <View style={styles.toastTextContainer}>
          <View style={styles.toastLabelRow}>
            <Icon source={'bell-check'} size={14} color="#6EE7B7" />
            <Text style={styles.toastLabel}>Added to Notifications</Text>
          </View>
          <Text style={styles.toastTitle} numberOfLines={1}>{props?.props?.program_name}</Text>
        </View>
        <Icon source={'chevron-right'} size={20} color="rgba(255,255,255,0.5)" />
      </View>
    </GlassyToastWrapper>
  ),

  // Lecture added to playlist
  LectureAddedToPlaylist: ({ props }: any) => (
    <GlassyToastWrapper onPress={props?.onPress}>
      <View style={styles.toastContent}>
        <Image 
          source={props?.props?.playlist_img ? { uri: props.props.playlist_img } : require("@/assets/images/MASHomeLogo.png")} 
          style={styles.toastImage}
        />
        <View style={styles.toastTextContainer}>
          <View style={styles.toastLabelRow}>
            <Icon source={'playlist-check'} size={14} color="#6EE7B7" />
            <Text style={styles.toastLabel}>Added to Playlist</Text>
          </View>
          <Text style={styles.toastTitle} numberOfLines={1}>{props?.props?.playlist_name}</Text>
        </View>
        <Icon source={'chevron-right'} size={20} color="rgba(255,255,255,0.5)" />
      </View>
    </GlassyToastWrapper>
  ),

  // Program added to library
  ProgramAddedToPrograms: ({ props }: any) => (
    <GlassyToastWrapper onPress={props?.onPress}>
      <View style={styles.toastContent}>
        <Image 
          source={props?.props?.program_img ? { uri: props.props.program_img } : require("@/assets/images/MASHomeLogo.png")} 
          style={styles.toastImage}
        />
        <View style={styles.toastTextContainer}>
          <View style={styles.toastLabelRow}>
            <Icon source={'book-check'} size={14} color="#6EE7B7" />
            <Text style={styles.toastLabel}>Added to Library</Text>
          </View>
          <Text style={styles.toastTitle} numberOfLines={1}>{props?.props?.program_name}</Text>
        </View>
        <Icon source={'chevron-right'} size={20} color="rgba(255,255,255,0.5)" />
      </View>
    </GlassyToastWrapper>
  ),

  // Event added to notifications
  addEventToNotificationsToast: ({ props }: any) => (
    <GlassyToastWrapper onPress={props?.onPress}>
      <View style={styles.toastContent}>
        <Image 
          source={props?.props?.event_img ? { uri: props.props.event_img } : require("@/assets/images/MASHomeLogo.png")} 
          style={styles.toastImage}
        />
        <View style={styles.toastTextContainer}>
          <View style={styles.toastLabelRow}>
            <Icon source={'bell-check'} size={14} color="#6EE7B7" />
            <Text style={styles.toastLabel}>Added to Notifications</Text>
          </View>
          <Text style={styles.toastTitle} numberOfLines={1}>{props?.props?.event_name}</Text>
        </View>
        <Icon source={'chevron-right'} size={20} color="rgba(255,255,255,0.5)" />
      </View>
    </GlassyToastWrapper>
  ),

  // Confirm notification option
  ConfirmNotificationOption: ({ props }: any) => (
    <GlassyToastWrapper>
      <View style={styles.toastContent}>
        <View style={styles.notificationIconContainer}>
          <Icon source={'bell-ring'} size={22} color="#ffffff"/>
        </View>
        <View style={styles.toastTextContainer}>
          <Text style={styles.notificationMessage}>{props?.message}</Text>
          <Text style={styles.notificationPrayer}>{props?.prayer} · {props?.time}</Text>
        </View>
        <View style={styles.checkCircle}>
          <Icon source={'check'} size={16} color="#ffffff"/>
        </View>
      </View>
    </GlassyToastWrapper>
  ),

  // Success toast
  success: ({ text1, text2, onPress }: any) => (
    <GlassyToastWrapper onPress={onPress}>
      <View style={styles.toastContent}>
        <View style={styles.successIcon}>
          <Icon source={'check-circle'} size={24} color="#6EE7B7" />
        </View>
        <View style={styles.toastTextContainer}>
          {text1 && <Text style={styles.toastTitle}>{text1}</Text>}
          {text2 && <Text style={styles.toastSubtext}>{text2}</Text>}
        </View>
      </View>
    </GlassyToastWrapper>
  ),

  // Error toast
  error: ({ text1, text2, onPress }: any) => (
    <GlassyToastWrapper onPress={onPress}>
      <View style={styles.toastContent}>
        <View style={styles.errorIcon}>
          <Icon source={'alert-circle'} size={24} color="#EF4444" />
        </View>
        <View style={styles.toastTextContainer}>
          {text1 && <Text style={styles.toastTitle}>{text1}</Text>}
          {text2 && <Text style={styles.toastSubtext}>{text2}</Text>}
        </View>
      </View>
    </GlassyToastWrapper>
  ),

  // Info toast
  info: ({ text1, text2, onPress }: any) => (
    <GlassyToastWrapper onPress={onPress}>
      <View style={styles.toastContent}>
        <View style={styles.infoIcon}>
          <Icon source={'information'} size={24} color="#3B82F6" />
        </View>
        <View style={styles.toastTextContainer}>
          {text1 && <Text style={styles.toastTitle}>{text1}</Text>}
          {text2 && <Text style={styles.toastSubtext}>{text2}</Text>}
        </View>
      </View>
    </GlassyToastWrapper>
  ),
};

const styles = StyleSheet.create({
  toastOuterContainer: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animatedContainer: {
    width: TOAST_WIDTH,
  },
  toastPressable: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  blurView: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  glassOverlay: {
    backgroundColor: 'rgba(15, 65, 132, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
  },
  toastImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  toastTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  toastLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  toastLabel: {
    color: '#6EE7B7',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  toastTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  toastTitleLarge: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  toastSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginBottom: 2,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationMessage: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  notificationPrayer: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  successIcon: {
    marginRight: 4,
  },
  errorIcon: {
    marginRight: 4,
  },
  infoIcon: {
    marginRight: 4,
  },
});

export default glassyToastConfig;
