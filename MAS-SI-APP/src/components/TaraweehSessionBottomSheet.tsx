import { View, Image, ScrollView, StyleSheet, Modal, Pressable, Dimensions } from 'react-native';
import React, { forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import { Text, Icon } from 'react-native-paper';
import Animated, { 
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.65;

const COLORS = {
  primary: '#1d4681',
  accent: '#10b981',
  gold: '#F6D169',
  white: '#FFFFFF',
  lightBlue: '#E8F4FD',
  gray: '#6B7280',
  lightGray: '#F1F5F9',
};

export interface TaraweehLineupItem {
  type: 'rakats' | 'speaker' | 'witr';
  imam_name?: string;
  imam_img?: string;
  speaker_name?: string;
  speaker_img?: string;
  rakats?: number;
  time?: string;
  label?: string;
}

export interface TaraweehSessionData {
  sessionNumber: number;
  sessionTitle: string;
  startTime: string;
  endTime: string;
  lineup: TaraweehLineupItem[];
}

export interface TaraweehSessionBottomSheetRef {
  open: (sessionData: TaraweehSessionData) => void;
  close: () => void;
}

export const TaraweehSessionBottomSheet = forwardRef<TaraweehSessionBottomSheetRef, {}>(
  (props, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const [sessionData, setSessionData] = useState<TaraweehSessionData | null>(null);
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

    useImperativeHandle(ref, () => ({
      open: (data: TaraweehSessionData) => {
        setSessionData(data);
        setIsVisible(true);
        // Small delay to ensure modal is mounted before animating
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

    const renderLineupItem = (item: TaraweehLineupItem, index: number) => {
      if (item.type === 'rakats' || item.type === 'witr') {
        return (
          <View key={index} style={styles.lineupItem}>
            <View style={styles.lineupLeftSection}>
              <Image
                source={item.imam_img ? { uri: item.imam_img } : require("@/assets/images/MASHomeLogo.png")}
                style={styles.imamImage}
                resizeMode='cover'
              />
            </View>
            <View style={styles.lineupMiddleSection}>
              <Text style={styles.imamName}>{item.imam_name || 'TBA'}</Text>
              <View style={styles.rakatsBadge}>
                <Text style={styles.rakatsBadgeText}>
                  {item.rakats} Rakat{item.rakats !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            <View style={styles.lineupRightSection}>
              <View style={[
                styles.typeBadge, 
                item.type === 'witr' ? styles.witrBadge : styles.sessionBadge
              ]}>
                <Text style={[
                  styles.typeBadgeText,
                  item.type === 'witr' ? styles.witrBadgeText : styles.sessionBadgeText
                ]}>
                  {item.label || (item.type === 'witr' ? 'WITR' : `RAKATS ${index === 0 ? '1-4' : '5-8'}`)}
                </Text>
              </View>
              {item.time && (
                <Text style={styles.timeText}>{item.time}</Text>
              )}
            </View>
          </View>
        );
      }

      if (item.type === 'speaker') {
        return (
          <View key={index} style={styles.lineupItem}>
            <View style={styles.lineupLeftSection}>
              <Image
                source={item.speaker_img ? { uri: item.speaker_img } : require("@/assets/images/MASHomeLogo.png")}
                style={[styles.imamImage, styles.speakerImageBorder]}
                resizeMode='cover'
              />
            </View>
            <View style={styles.lineupMiddleSection}>
              <Text style={styles.imamName}>{item.speaker_name || 'TBA'}</Text>
              <View style={styles.speakerSubBadge}>
                <Icon source="microphone" size={14} color={COLORS.gold} />
                <Text style={styles.speakerSubBadgeText}>Reminder</Text>
              </View>
            </View>
            <View style={styles.lineupRightSection}>
              <View style={styles.speakerBadge}>
                <Text style={styles.speakerBadgeText}>SPEAKER</Text>
              </View>
            </View>
          </View>
        );
      }

      return null;
    };

    if (!sessionData) return null;

    const handleBackdropPress = () => {
      translateY.value = withTiming(SHEET_HEIGHT, { duration: 250 }, () => {
        runOnJS(closeSheet)();
      });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    };

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
            style={[styles.sheetContainer, animatedSheetStyle]}
          >
            {/* Header */}
            <View style={styles.header}>
              {/* Handle */}
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>
            
              <View style={styles.headerContent}>
                <View style={styles.sessionBadgeHeader}>
                  <View style={styles.sessionNumberBadge}>
                    <Text style={styles.sessionNumberText}>{sessionData.sessionNumber}</Text>
                  </View>
                  <Text style={styles.sessionLabelHeader}>{sessionData.sessionTitle}</Text>
                </View>
                <View style={styles.timeRow}>
                  <Icon source="clock-outline" size={14} color={COLORS.gray} />
                  <Text style={styles.timeHeaderText}>
                    {sessionData.startTime}
                  </Text>
                </View>
              </View>
            </View>

            {/* Content */}
            <ScrollView 
              style={styles.contentContainer} 
              contentContainerStyle={styles.contentContainerStyle}
              showsVerticalScrollIndicator={false}
            >
              {/* Section Title */}
              <View style={styles.sectionHeader}>
                <Icon source="account-group" size={20} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Tonight's Lineup</Text>
              </View>

              {/* Lineup Items */}
              <View style={styles.lineupContainer}>
                {sessionData.lineup.map((item, index) => renderLineupItem(item, index))}
              </View>

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
    backgroundColor: COLORS.white,
    borderRadius: 40,
    maxHeight: SHEET_HEIGHT,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 25,
  },
  handleContainer: {
    alignItems: 'center',
    paddingBottom: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  sessionLabelHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeHeaderText: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  contentContainerStyle: {
    padding: 20,
    paddingBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.primary,
  },
  lineupContainer: {
    gap: 12,
  },
  lineupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  lineupLeftSection: {
    alignItems: 'center',
  },
  imamImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  lineupMiddleSection: {
    flex: 1,
    gap: 6,
  },
  imamName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  rakatsBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(29, 70, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rakatsBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  lineupRightSection: {
    alignItems: 'flex-end',
    gap: 4,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  sessionBadge: {
    backgroundColor: COLORS.accent,
  },
  witrBadge: {
    backgroundColor: COLORS.gold,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sessionBadgeText: {
    color: COLORS.white,
  },
  witrBadgeText: {
    color: '#1F2937',
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray,
  },
  speakerImageBorder: {
    borderColor: COLORS.gold,
  },
  speakerSubBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(246, 209, 105, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  speakerSubBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92700C',
  },
  speakerBadge: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  speakerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#1F2937',
  },
});
