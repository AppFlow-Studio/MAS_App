import { View, ScrollView, StyleSheet, Modal, Pressable, Dimensions } from 'react-native';
import React, { forwardRef, useImperativeHandle, useState, useCallback, useEffect } from 'react';
import { Text, Icon } from 'react-native-paper';
import Animated, { 
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { X, Check } from 'lucide-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.55;

const COLORS = {
  primary: '#1d4681',
  accent: '#10b981',
  white: '#FFFFFF',
  gray: '#6B7280',
  sheetBg: '#0053A5',
};

type NotificationOption = 'prayer_time' | 'iqamah_time' | '30_min_before' | 'mute';

export interface TaraweehNotificationBottomSheetRef {
  open: (prayerName: string) => void;
  close: () => void;
}

// Map database notification_settings array to our options format
const mapDbSettingsToOptions = (dbSettings: string[]): NotificationOption[] => {
  const optionMap: { [key: string]: NotificationOption } = {
    'Alert at Athan time': 'prayer_time',
    'Alert at Iqamah time': 'iqamah_time',
    'Alert 30 mins before next prayer': '30_min_before',
    'Mute': 'mute',
  };
  return dbSettings.map(s => optionMap[s]).filter(Boolean);
};

// Map our options format back to database format
const mapOptionsToDbSettings = (options: NotificationOption[]): string[] => {
  const dbMap: { [key in NotificationOption]: string } = {
    'prayer_time': 'Alert at Athan time',
    'iqamah_time': 'Alert at Iqamah time',
    '30_min_before': 'Alert 30 mins before next prayer',
    'mute': 'Mute',
  };
  return options.map(o => dbMap[o]);
};

export const TaraweehNotificationBottomSheet = forwardRef<TaraweehNotificationBottomSheetRef, {}>(
  (props, ref) => {
    const { session } = useAuth();
    const [isVisible, setIsVisible] = useState(false);
    const [prayerName, setPrayerName] = useState<string | null>(null);
    const [selectedOptions, setSelectedOptions] = useState<NotificationOption[]>([]);
    const insets = useSafeAreaInsets();
    const translateY = useSharedValue(SHEET_HEIGHT);
    const backdropOpacity = useSharedValue(0);

    const closeSheet = useCallback(() => {
      setIsVisible(false);
      translateY.value = SHEET_HEIGHT;
      backdropOpacity.value = 0;
    }, []);

    const openSheet = useCallback(() => {
      translateY.value = withSpring(0, { 
        damping: 25, 
        stiffness: 300,
        mass: 0.8,
      });
      backdropOpacity.value = withTiming(1, { duration: 250 });
    }, []);

    // Load settings when prayer name changes
    const loadSettings = useCallback(async (prayer: string) => {
      if (!session?.user.id) return;
      
      const { data, error } = await supabase
        .from('prayer_notification_settings')
        .select('notification_settings')
        .eq('user_id', session.user.id)
        .eq('prayer', prayer.toLowerCase())
        .single();
      
      if (data && data.notification_settings) {
        const options = mapDbSettingsToOptions(data.notification_settings);
        setSelectedOptions(options);
      } else {
        setSelectedOptions([]);
      }
    }, [session?.user.id]);

    useImperativeHandle(ref, () => ({
      open: (prayer: string) => {
        setPrayerName(prayer);
        setSelectedOptions([]);
        loadSettings(prayer);
        setIsVisible(true);
        setTimeout(() => {
          openSheet();
        }, 50);
      },
      close: () => {
        translateY.value = withTiming(SHEET_HEIGHT, { duration: 250 }, () => {
          runOnJS(closeSheet)();
        });
        backdropOpacity.value = withTiming(0, { duration: 200 });
      },
    }));

    const panGesture = Gesture.Pan()
      .onUpdate((event) => {
        if (event.translationY > 0) {
          translateY.value = event.translationY;
        }
      })
      .onEnd((event) => {
        if (event.translationY > 100 || event.velocityY > 500) {
          translateY.value = withTiming(SHEET_HEIGHT, { duration: 200 }, () => {
            runOnJS(closeSheet)();
          });
          backdropOpacity.value = withTiming(0, { duration: 200 });
        } else {
          translateY.value = withSpring(0, { damping: 25, stiffness: 300 });
        }
      });

    const animatedSheetStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
    }));

    const animatedBackdropStyle = useAnimatedStyle(() => ({
      opacity: backdropOpacity.value,
    }));

    const handleBackdropPress = () => {
      translateY.value = withTiming(SHEET_HEIGHT, { duration: 250 }, () => {
        runOnJS(closeSheet)();
      });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    };

    const handleOptionSelect = (option: NotificationOption) => {
      setSelectedOptions(prev => {
        // If selecting 'mute', clear all other options and only set mute
        if (option === 'mute') {
          return prev.includes('mute') ? [] : ['mute'];
        }
        
        // If selecting a non-mute option, remove 'mute' if it exists and toggle the option
        if (prev.includes(option)) {
          return prev.filter(o => o !== option);
        } else {
          return [...prev.filter(o => o !== 'mute'), option];
        }
      });
    };

    const handleSave = async () => {
      if (!prayerName || !session?.user.id) {
        handleBackdropPress();
        return;
      }
      
      const dbSettings = mapOptionsToDbSettings(selectedOptions);
      const finalSettings = dbSettings.length > 0 ? dbSettings : ['Mute'];
      
      // Check if record exists
      const { data: existingSettings } = await supabase
        .from('prayer_notification_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('prayer', prayerName.toLowerCase())
        .single();
      
      if (existingSettings) {
        await supabase
          .from('prayer_notification_settings')
          .update({ notification_settings: finalSettings })
          .eq('user_id', session.user.id)
          .eq('prayer', prayerName.toLowerCase());
      } else {
        await supabase
          .from('prayer_notification_settings')
          .insert({
            user_id: session.user.id,
            prayer: prayerName.toLowerCase(),
            notification_settings: finalSettings,
          });
      }
      
      handleBackdropPress();
    };

    if (!prayerName) return null;

    return (
      <Modal
        visible={isVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={handleBackdropPress}
      >
        {/* Backdrop */}
        <Pressable 
          style={styles.backdropPressable} 
          onPress={handleBackdropPress}
        >
          <Animated.View 
            style={[styles.backdrop, animatedBackdropStyle]}
          />
        </Pressable>

        {/* Sheet Content */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[styles.sheetContainer, { paddingBottom: insets.bottom + 12 }, animatedSheetStyle]}
          >
            {/* Handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                {prayerName} notification settings
              </Text>
              <Pressable onPress={handleBackdropPress} style={styles.closeButton}>
                <X color="rgba(255, 255, 255, 0.7)" size={24} />
              </Pressable>
            </View>

            {/* Options */}
            <ScrollView 
              style={styles.contentContainer}
              contentContainerStyle={styles.contentContainerStyle}
              showsVerticalScrollIndicator={false}
            >
              {/* Notify at Prayer Time */}
              <Pressable 
                style={styles.optionRow}
                onPress={() => handleOptionSelect('prayer_time')}
              >
                <View style={[
                  styles.checkboxOuter,
                  selectedOptions.includes('prayer_time') && styles.checkboxSelected
                ]}>
                  {selectedOptions.includes('prayer_time') && (
                    <Check color="#1a3a5c" size={14} strokeWidth={3} />
                  )}
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Notify at Prayer Time</Text>
                  <Text style={styles.optionDescription}>Get notified exactly when it's time to pray</Text>
                </View>
              </Pressable>

              {/* Notify at Iqamah Time */}
              <Pressable 
                style={styles.optionRow}
                onPress={() => handleOptionSelect('iqamah_time')}
              >
                <View style={[
                  styles.checkboxOuter,
                  selectedOptions.includes('iqamah_time') && styles.checkboxSelected
                ]}>
                  {selectedOptions.includes('iqamah_time') && (
                    <Check color="#1a3a5c" size={14} strokeWidth={3} />
                  )}
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Notify at Iqamah Time</Text>
                  <Text style={styles.optionDescription}>Get notified when it's time to gather at the masjid</Text>
                </View>
              </Pressable>

              {/* 30-Minute Reminder */}
              <Pressable 
                style={styles.optionRow}
                onPress={() => handleOptionSelect('30_min_before')}
              >
                <View style={[
                  styles.checkboxOuter,
                  selectedOptions.includes('30_min_before') && styles.checkboxSelected
                ]}>
                  {selectedOptions.includes('30_min_before') && (
                    <Check color="#1a3a5c" size={14} strokeWidth={3} />
                  )}
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>30-Minute Reminder</Text>
                  <Text style={styles.optionDescription}>Get reminded 30 minutes before the next prayer time</Text>
                </View>
              </Pressable>

              {/* Mute */}
              <Pressable 
                style={styles.optionRow}
                onPress={() => handleOptionSelect('mute')}
              >
                <View style={[
                  styles.checkboxOuter,
                  selectedOptions.includes('mute') && styles.checkboxSelected
                ]}>
                  {selectedOptions.includes('mute') && (
                    <Check color="#1a3a5c" size={14} strokeWidth={3} />
                  )}
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Mute</Text>
                  <Text style={styles.optionDescription}>Disable all notifications for this prayer</Text>
                </View>
              </Pressable>

              {/* Save Button */}
              <Pressable style={styles.saveButton} onPress={handleSave}>
                <Check color="#6EE7B7" size={20} strokeWidth={2.5} style={{ marginRight: 8 }} />
                <Text style={styles.saveButtonText}>Save</Text>
              </Pressable>
            </ScrollView>
          </Animated.View>
        </GestureDetector>
      </Modal>
    );
  }
);

const styles = StyleSheet.create({
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: COLORS.sheetBg,
    borderRadius: 40,
    maxHeight: SHEET_HEIGHT,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  closeButton: {
    padding: 4,
  },
  contentContainer: {
    flex: 1,
  },
  contentContainerStyle: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 20,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  checkboxOuter: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#6EE7B7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxSelected: {
    backgroundColor: '#6EE7B7',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: 'rgba(110, 231, 183, 0.25)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(110, 231, 183, 0.5)',
  },
  saveButtonText: {
    color: '#6EE7B7',
    fontSize: 16,
    fontWeight: '600',
  },
});
