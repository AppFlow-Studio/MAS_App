import { View, StyleSheet, Modal, Pressable, Dimensions, ActivityIndicator, Platform, Text as RNText } from 'react-native';
import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { Text, Icon } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { initializePaymentSheet, openPaymentSheet } from '@/src/lib/stripe';
import { supabase } from '@/src/lib/supabase';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const COLLAPSED_HEIGHT = 370;
const EXPANDED_HEIGHT = 520;

const PRESET_AMOUNTS = [25, 50, 100];
const CUSTOM_PRESET_AMOUNTS = [10, 50, 100];

export interface DonationBottomSheetRef {
  open: () => void;
  close: () => void;
}

const DonationBottomSheet = forwardRef<DonationBottomSheetRef>((_, ref) => {
  const [isVisible, setIsVisible] = useState(false);
  const [viewState, setViewState] = useState<'select' | 'custom'>('select');
  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(0);
  const sheetHeight = useSharedValue(COLLAPSED_HEIGHT);
  const contentOpacity = useSharedValue(1);
  const customContentOpacity = useSharedValue(0);

  const closeSheet = () => {
    setIsVisible(false);
    setViewState('select');
    setCustomAmount('');
    setSelectedAmount(50);
    sheetHeight.value = COLLAPSED_HEIGHT;
    contentOpacity.value = 1;
    customContentOpacity.value = 0;
  };

  useImperativeHandle(ref, () => ({
    open: () => {
      translateY.value = 0;
      sheetHeight.value = COLLAPSED_HEIGHT;
      contentOpacity.value = 1;
      customContentOpacity.value = 0;
      setIsVisible(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    close: () => {
      closeSheet();
    },
  }));

  const handleSelectAmount = (amount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAmount(amount);
  };

  const handleEnterCustomAmount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    contentOpacity.value = withTiming(0, { duration: 150 });
    sheetHeight.value = withSpring(EXPANDED_HEIGHT, { 
      damping: 20, 
      stiffness: 150,
      mass: 0.8,
    });
    setTimeout(() => {
      setViewState('custom');
      setCustomAmount('');
      customContentOpacity.value = withTiming(1, { duration: 200 });
    }, 150);
  };

  const handleNumberPress = (num: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (customAmount.length < 6) {
      setCustomAmount(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCustomAmount(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCustomAmount('');
  };

  const handleCustomPreset = (amount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCustomAmount(amount.toString());
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    customContentOpacity.value = withTiming(0, { duration: 150 });
    sheetHeight.value = withSpring(COLLAPSED_HEIGHT, { 
      damping: 20, 
      stiffness: 150,
      mass: 0.8,
    });
    setTimeout(() => {
      if (customAmount) {
        setSelectedAmount(parseInt(customAmount, 10) || 50);
      }
      setViewState('select');
      contentOpacity.value = withTiming(1, { duration: 200 });
    }, 150);
  };

  const getFinalAmount = () => {
    if (viewState === 'custom' && customAmount) {
      return parseInt(customAmount, 10);
    }
    return selectedAmount;
  };

  const handlePayment = async () => {
    const amount = getFinalAmount();
    if (!amount || amount <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Invalid amount',
        text2: 'Please select or enter a donation amount',
      });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProcessing(true);

    try {
      const paymentIntent = await initializePaymentSheet(Math.floor(amount * 100));
      
      if (!paymentIntent) {
        setIsProcessing(false);
        return;
      }

      const paymentSuccess = await openPaymentSheet();

      if (paymentSuccess) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        const { error: insertError } = await supabase
          .from('donations')
          .insert({ 
            amountGiven: amount, 
            project_donated_to: ['1fcda08a-c61d-4d44-af5f-f32ff3af58f9']
          });

        if (insertError) console.log('Insert error:', insertError);

        const { error: emailError } = await supabase.functions.invoke('donation-confirmation-email', {
          body: { donation_amount: amount }
        });

        if (emailError) console.log('Email error:', emailError);

        Toast.show({
          type: 'success',
          text1: 'Thank you for your donation!',
          text2: `$${amount} has been donated to MAS Staten Island`,
        });

        closeSheet();
      }
    } catch (error) {
      console.log('Donation error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: 'error',
        text1: 'Donation failed',
        text2: 'Please try again',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 120 || event.velocityY > 500) {
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 }, () => {
          runOnJS(closeSheet)();
        });
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    });

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    height: sheetHeight.value,
  }));

  const animatedSelectStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const animatedCustomStyle = useAnimatedStyle(() => ({
    opacity: customContentOpacity.value,
  }));

  // Number pad component
  const NumberPad = () => (
    <View style={styles.numPad}>
      <View style={styles.numRow}>
        <Pressable style={styles.numKey} onPress={() => handleNumberPress('1')}>
          <RNText style={styles.numKeyText}>1</RNText>
        </Pressable>
        <Pressable style={styles.numKey} onPress={() => handleNumberPress('2')}>
          <RNText style={styles.numKeyText}>2</RNText>
        </Pressable>
        <Pressable style={styles.numKey} onPress={() => handleNumberPress('3')}>
          <RNText style={styles.numKeyText}>3</RNText>
        </Pressable>
      </View>
      <View style={styles.numRow}>
        <Pressable style={styles.numKey} onPress={() => handleNumberPress('4')}>
          <RNText style={styles.numKeyText}>4</RNText>
        </Pressable>
        <Pressable style={styles.numKey} onPress={() => handleNumberPress('5')}>
          <RNText style={styles.numKeyText}>5</RNText>
        </Pressable>
        <Pressable style={styles.numKey} onPress={() => handleNumberPress('6')}>
          <RNText style={styles.numKeyText}>6</RNText>
        </Pressable>
      </View>
      <View style={styles.numRow}>
        <Pressable style={styles.numKey} onPress={() => handleNumberPress('7')}>
          <RNText style={styles.numKeyText}>7</RNText>
        </Pressable>
        <Pressable style={styles.numKey} onPress={() => handleNumberPress('8')}>
          <RNText style={styles.numKeyText}>8</RNText>
        </Pressable>
        <Pressable style={styles.numKey} onPress={() => handleNumberPress('9')}>
          <RNText style={styles.numKeyText}>9</RNText>
        </Pressable>
      </View>
      <View style={styles.numRow}>
        <View style={styles.numKey} />
        <Pressable style={styles.numKey} onPress={() => handleNumberPress('0')}>
          <RNText style={styles.numKeyText}>0</RNText>
        </Pressable>
        <Pressable style={styles.numKey} onPress={handleBackspace}>
          <Icon source="backspace-outline" size={24} color="#6B7280" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={closeSheet}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={closeSheet}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={StyleSheet.absoluteFill}
        />
      </Pressable>

      {/* Sheet */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          entering={SlideInDown.duration(350).easing(Easing.out(Easing.cubic))}
          exiting={SlideOutDown.duration(250).easing(Easing.in(Easing.cubic))}
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + 20 },
            animatedSheetStyle,
          ]}
        >
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {viewState === 'select' ? (
            /* SELECT AMOUNT VIEW */
            <Animated.View style={animatedSelectStyle}>
              {/* Label */}
              <RNText style={styles.label}>SELECT AMOUNT</RNText>

              {/* Hero Amount */}
              <RNText style={styles.heroAmount}>${selectedAmount}</RNText>

              {/* Preset Chips */}
              <View style={styles.chipsRow}>
                <Pressable
                  onPress={() => handleSelectAmount(25)}
                  style={[styles.chipButton, selectedAmount === 25 && styles.chipButtonSelected]}
                >
                  <RNText style={[styles.chipButtonText, selectedAmount === 25 && styles.chipButtonTextSelected]}>$25</RNText>
                </Pressable>
                <Pressable
                  onPress={() => handleSelectAmount(50)}
                  style={[styles.chipButton, selectedAmount === 50 && styles.chipButtonSelected]}
                >
                  <RNText style={[styles.chipButtonText, selectedAmount === 50 && styles.chipButtonTextSelected]}>$50</RNText>
                </Pressable>
                <Pressable
                  onPress={() => handleSelectAmount(100)}
                  style={[styles.chipButton, selectedAmount === 100 && styles.chipButtonSelected]}
                >
                  <RNText style={[styles.chipButtonText, selectedAmount === 100 && styles.chipButtonTextSelected]}>$100</RNText>
                </Pressable>
              </View>

              {/* Enter Custom Amount Button */}
              <Pressable onPress={handleEnterCustomAmount} style={styles.customLink}>
                <RNText style={styles.customLinkText}>Enter custom amount</RNText>
              </Pressable>

              {/* Pay Button */}
              <Pressable
                style={[styles.donateButton, isProcessing && styles.donateButtonDisabled]}
                onPress={handlePayment}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <RNText style={styles.donateButtonText}>Donate ${selectedAmount}</RNText>
                )}
              </Pressable>

              {/* Pay with Card Option */}
              <Pressable onPress={handlePayment} style={styles.cardRow}>
                <Icon source="credit-card-outline" size={18} color="#6B7280" />
                <RNText style={styles.cardRowText}>Pay with card</RNText>
                <Icon source="chevron-right" size={16} color="#9CA3AF" />
              </Pressable>

              {/* Secured Footer */}
              <View style={styles.securedRow}>
                <Icon source="shield-check" size={14} color="#10B981" />
                <RNText style={styles.securedRowText}>SECURED BY STRIPE</RNText>
              </View>
            </Animated.View>
          ) : (
            /* CUSTOM AMOUNT VIEW */
            <Animated.View style={[styles.customView, animatedCustomStyle]}>
              {/* Close Button */}
              <Pressable style={styles.backButton} onPress={handleBack}>
                <Icon source="chevron-down" size={24} color="#6B7280" />
              </Pressable>

              {/* Label */}
              <RNText style={styles.label}>ENTER AMOUNT</RNText>

              {/* Hero Amount Display */}
              <View style={styles.amountRow}>
                <RNText style={styles.dollarPrefix}>$</RNText>
                <RNText style={[styles.amountValue, !customAmount && styles.amountPlaceholder]}>
                  {customAmount || '0'}
                </RNText>
              </View>

              {/* Clear Button */}
              {customAmount ? (
                <Pressable style={styles.clearLink} onPress={handleClear}>
                  <RNText style={styles.clearLinkText}>Clear</RNText>
                </Pressable>
              ) : (
                <View style={styles.clearLinkPlaceholder} />
              )}

              {/* Quick Amount Chips */}
              <View style={styles.quickChipsRow}>
                <Pressable
                  onPress={() => handleCustomPreset(10)}
                  style={[styles.quickChipBtn, customAmount === '10' && styles.quickChipBtnSelected]}
                >
                  <RNText style={[styles.quickChipBtnText, customAmount === '10' && styles.quickChipBtnTextSelected]}>$10</RNText>
                </Pressable>
                <Pressable
                  onPress={() => handleCustomPreset(50)}
                  style={[styles.quickChipBtn, customAmount === '50' && styles.quickChipBtnSelected]}
                >
                  <RNText style={[styles.quickChipBtnText, customAmount === '50' && styles.quickChipBtnTextSelected]}>$50</RNText>
                </Pressable>
                <Pressable
                  onPress={() => handleCustomPreset(100)}
                  style={[styles.quickChipBtn, customAmount === '100' && styles.quickChipBtnSelected]}
                >
                  <RNText style={[styles.quickChipBtnText, customAmount === '100' && styles.quickChipBtnTextSelected]}>$100</RNText>
                </Pressable>
                <View style={[styles.quickChipBtn, styles.quickChipBtnActive]}>
                  <RNText style={styles.quickChipBtnTextActive}>Other</RNText>
                </View>
              </View>

              {/* Review Button */}
              <Pressable
                style={[styles.reviewBtn, !customAmount && styles.reviewBtnDisabled]}
                onPress={handlePayment}
                disabled={!customAmount || isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <RNText style={styles.reviewBtnText}>
                    {customAmount ? `Donate $${customAmount}` : 'Enter amount'}
                  </RNText>
                )}
              </Pressable>

              {/* Number Pad */}
              <NumberPad />
            </Animated.View>
          )}
        </Animated.View>
      </GestureDetector>
    </Modal>
  );
});

DonationBottomSheet.displayName = 'DonationBottomSheet';

export default DonationBottomSheet;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 24,
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingBottom: 12,
  },
  handle: {
    width: 36,
    height: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  heroAmount: {
    fontSize: 52,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  // Clean chip styles
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  chipButton: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginHorizontal: 6,
  },
  chipButtonSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  chipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  chipButtonTextSelected: {
    color: '#FFFFFF',
  },
  customLink: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 14,
  },
  customLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2563EB',
  },
  donateButton: {
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  donateButtonDisabled: {
    opacity: 0.5,
  },
  donateButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  cardRowText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginHorizontal: 6,
  },
  securedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  securedRowText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginLeft: 5,
  },
  // Custom Amount View Styles
  customView: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: -4,
    left: -8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dollarPrefix: {
    fontSize: 28,
    fontWeight: '600',
    color: '#111827',
    marginRight: 2,
  },
  amountValue: {
    fontSize: 52,
    fontWeight: '700',
    color: '#111827',
  },
  amountPlaceholder: {
    color: '#D1D5DB',
  },
  clearLink: {
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 8,
  },
  clearLinkPlaceholder: {
    height: 24,
    marginBottom: 8,
  },
  clearLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  quickChipsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickChipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
  },
  quickChipBtnSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  quickChipBtnActive: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  quickChipBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  quickChipBtnTextSelected: {
    color: '#2563EB',
  },
  quickChipBtnTextActive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  reviewBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  reviewBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  reviewBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Number Pad Styles
  numPad: {
    marginTop: 8,
  },
  numRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  numKey: {
    width: 80,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  numKeyText: {
    fontSize: 28,
    fontWeight: '400',
    color: '#1F2937',
  },
});
