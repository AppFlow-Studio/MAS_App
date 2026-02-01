import { View, StyleSheet, Modal, Pressable, Dimensions, ActivityIndicator, Platform, Text as RNText, Alert, ScrollView } from 'react-native';
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
import { CardForm, useConfirmPayment, CardFormView } from '@stripe/stripe-react-native';
import { supabase } from '@/src/lib/supabase';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { fetchSavedPaymentMethods, chargeWithSavedCard, getCardBrandDisplayName, SavedPaymentMethod } from '@/src/lib/StripePaySheet';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const COLLAPSED_HEIGHT = 340;
const EXPANDED_HEIGHT = 540;
const PAYMENT_HEIGHT = 560;
const SAVED_CARDS_HEIGHT = 450;
const SUCCESS_HEIGHT = 360;

const PRESET_AMOUNTS = [25, 50, 100];
const CUSTOM_PRESET_AMOUNTS = [10, 50, 100];

export interface DonationBottomSheetRef {
  open: () => void;
  close: () => void;
}

const DonationBottomSheet = forwardRef<DonationBottomSheetRef>((_, ref) => {
  const [isVisible, setIsVisible] = useState(false);
  const [viewState, setViewState] = useState<'select' | 'custom' | 'payment' | 'savedCards' | 'success'>('select');
  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [paymentIntentClientSecret, setPaymentIntentClientSecret] = useState<string | null>(null);
  const [savedCards, setSavedCards] = useState<SavedPaymentMethod[]>([]);
  const [selectedSavedCard, setSelectedSavedCard] = useState<string | null>(null);
  const [isLoadingSavedCards, setIsLoadingSavedCards] = useState(false);
  const [saveCardForFuture, setSaveCardForFuture] = useState(false);
  const { confirmPayment, loading: confirmLoading } = useConfirmPayment();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(0);
  const sheetHeight = useSharedValue(COLLAPSED_HEIGHT);
  const contentOpacity = useSharedValue(1);
  const customContentOpacity = useSharedValue(0);
  const paymentContentOpacity = useSharedValue(0);
  const savedCardsContentOpacity = useSharedValue(0);
  const successContentOpacity = useSharedValue(0);

  const closeSheet = () => {
    setIsVisible(false);
    setViewState('select');
    setCustomAmount('');
    setSelectedAmount(50);
    setCardComplete(false);
    setPaymentIntentClientSecret(null);
    setSelectedSavedCard(null);
    setSaveCardForFuture(false);
    sheetHeight.value = COLLAPSED_HEIGHT;
    contentOpacity.value = 1;
    customContentOpacity.value = 0;
    paymentContentOpacity.value = 0;
    savedCardsContentOpacity.value = 0;
    successContentOpacity.value = 0;
  };

  // Load saved cards when sheet opens
  const loadSavedCards = async () => {
    setIsLoadingSavedCards(true);
    const cards = await fetchSavedPaymentMethods();
    if (cards) {
      setSavedCards(cards);
    }
    setIsLoadingSavedCards(false);
  };

  useImperativeHandle(ref, () => ({
    open: () => {
      translateY.value = 0;
      sheetHeight.value = COLLAPSED_HEIGHT;
      contentOpacity.value = 1;
      customContentOpacity.value = 0;
      savedCardsContentOpacity.value = 0;
      setIsVisible(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Load saved cards in the background
      loadSavedCards();
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

  // Fetch payment intent and show card input
  const handlePayment = async () => {
    if (isProcessing) return;
    
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
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert('Login Required', 'Please log in to make a donation.');
        setIsProcessing(false);
        return;
      }

      // Fetch payment intent from edge function
      console.log('Calling stripe--checkout with amount:', Math.floor(amount * 100), 'saveCard:', saveCardForFuture);
      const { data, error } = await supabase.functions.invoke('stripe--checkout', { 
        body: { TotalAmount: Math.floor(amount * 100), saveCard: saveCardForFuture }
      });

      console.log('Edge function response:', JSON.stringify(data, null, 2));
      console.log('Edge function error:', error);

      if (error || !data?.paymentIntent) {
        console.log('Payment intent error:', error || data);
        Alert.alert('Payment Error', 'Failed to initialize payment. Please try again.');
        setIsProcessing(false);
        return;
      }

      // Log the keys for debugging
      console.log('PaymentIntent client secret (first 20 chars):', data.paymentIntent?.substring(0, 20));
      console.log('Server publishable key:', data.publishableKey);
      console.log('Client publishable key:', process.env.STRIPE_PUBLISHABLE_KEY);

      setPaymentIntentClientSecret(data.paymentIntent);
      
      // Transition to payment view
      if (viewState === 'select') {
        contentOpacity.value = withTiming(0, { duration: 150 });
      } else {
        customContentOpacity.value = withTiming(0, { duration: 150 });
      }
      
      sheetHeight.value = withSpring(PAYMENT_HEIGHT, { 
        damping: 20, 
        stiffness: 150,
        mass: 0.8,
      });
      
      setTimeout(() => {
        setViewState('payment');
        paymentContentOpacity.value = withTiming(1, { duration: 200 });
        setIsProcessing(false);
      }, 150);

    } catch (error) {
      console.log('Payment setup error:', error);
      Alert.alert('Payment Error', 'Something went wrong. Please try again.');
      setIsProcessing(false);
    }
  };

  // Process the card payment
  const handleConfirmPayment = async () => {
    if (!paymentIntentClientSecret || !cardComplete || confirmLoading) return;

    console.log('Starting payment confirmation...');
    console.log('PaymentIntent secret (first 30 chars):', paymentIntentClientSecret?.substring(0, 30));
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const amount = getFinalAmount();

    try {
      console.log('Calling confirmPayment...');
      const { error, paymentIntent } = await confirmPayment(paymentIntentClientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: {},
        },
      }, {
        returnURL: 'MAS-SI-APP://stripe-redirect',
      });

      console.log('confirmPayment result - error:', JSON.stringify(error));
      console.log('confirmPayment result - paymentIntent:', JSON.stringify(paymentIntent));

      if (error) {
        console.log('Payment confirmation error:', error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Payment Failed', error.message || 'Network timeout. Please check your connection and try again.');
        return;
      }

      if (paymentIntent?.status === 'Succeeded') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Record donation
        const { error: insertError } = await supabase
          .from('donations')
          .insert({ 
            amountGiven: amount, 
            project_donated_to: ['1fcda08a-c61d-4d44-af5f-f32ff3af58f9']
          });

        if (insertError) console.log('Insert error:', insertError);

        // Send confirmation email
        const { error: emailError } = await supabase.functions.invoke('donation-confirmation-email', {
          body: { donation_amount: amount }
        });

        if (emailError) console.log('Email error:', emailError);

        // Show success animation
        showSuccessScreen(amount);
      }
    } catch (error) {
      console.log('Payment error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Payment Failed', 'Please try again.');
    }
  };

  // Go back from payment view
  const handleBackFromPayment = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    paymentContentOpacity.value = withTiming(0, { duration: 150 });
    sheetHeight.value = withSpring(COLLAPSED_HEIGHT, { 
      damping: 20, 
      stiffness: 150,
      mass: 0.8,
    });
    setTimeout(() => {
      setViewState('select');
      setPaymentIntentClientSecret(null);
      setCardComplete(false);
      contentOpacity.value = withTiming(1, { duration: 200 });
    }, 150);
  };

  // Show saved cards view
  const handleShowSavedCards = () => {
    if (savedCards.length === 0) {
      // No saved cards, go directly to new card entry
      handlePayment();
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    contentOpacity.value = withTiming(0, { duration: 150 });
    sheetHeight.value = withSpring(SAVED_CARDS_HEIGHT, { 
      damping: 20, 
      stiffness: 150,
      mass: 0.8,
    });
    setTimeout(() => {
      setViewState('savedCards');
      savedCardsContentOpacity.value = withTiming(1, { duration: 200 });
    }, 150);
  };

  // Show saved cards from payment view
  const handleShowSavedCardsFromPayment = () => {
    if (savedCards.length === 0) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    paymentContentOpacity.value = withTiming(0, { duration: 150 });
    sheetHeight.value = withSpring(SAVED_CARDS_HEIGHT, { 
      damping: 20, 
      stiffness: 150,
      mass: 0.8,
    });
    setTimeout(() => {
      setViewState('savedCards');
      setPaymentIntentClientSecret(null);
      setCardComplete(false);
      savedCardsContentOpacity.value = withTiming(1, { duration: 200 });
    }, 150);
  };

  // Go back from saved cards view
  const handleBackFromSavedCards = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    savedCardsContentOpacity.value = withTiming(0, { duration: 150 });
    sheetHeight.value = withSpring(COLLAPSED_HEIGHT, { 
      damping: 20, 
      stiffness: 150,
      mass: 0.8,
    });
    setTimeout(() => {
      setViewState('select');
      setSelectedSavedCard(null);
      contentOpacity.value = withTiming(1, { duration: 200 });
    }, 150);
  };

  // Charge with saved card
  const handleChargeWithSavedCard = async () => {
    if (!selectedSavedCard || isProcessing) return;

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
      const result = await chargeWithSavedCard(selectedSavedCard, Math.floor(amount * 100));

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Record donation
        const { error: insertError } = await supabase
          .from('donations')
          .insert({ 
            amountGiven: amount, 
            project_donated_to: ['1fcda08a-c61d-4d44-af5f-f32ff3af58f9']
          });

        if (insertError) console.log('Insert error:', insertError);

        // Send confirmation email
        const { error: emailError } = await supabase.functions.invoke('donation-confirmation-email', {
          body: { donation_amount: amount }
        });

        if (emailError) console.log('Email error:', emailError);

        // Show success animation
        showSuccessScreen(amount);
      } else if (result.requiresAction && result.clientSecret) {
        // Card requires authentication - handle 3D Secure
        Alert.alert(
          'Authentication Required',
          'Your card requires additional verification. Please use a new card or try again.',
          [{ text: 'OK' }]
        );
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Payment Failed', result.error || 'Please try again.');
      }
    } catch (error) {
      console.log('Charge error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Payment Failed', 'Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Go to new card entry from saved cards view
  const handleUseNewCard = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    savedCardsContentOpacity.value = withTiming(0, { duration: 150 });
    setTimeout(() => {
      setViewState('select');
      setSelectedSavedCard(null);
      handlePayment();
    }, 150);
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

  const animatedPaymentStyle = useAnimatedStyle(() => ({
    opacity: paymentContentOpacity.value,
  }));

  const animatedSavedCardsStyle = useAnimatedStyle(() => ({
    opacity: savedCardsContentOpacity.value,
  }));

  const animatedSuccessStyle = useAnimatedStyle(() => ({
    opacity: successContentOpacity.value,
  }));

  // Show success screen after payment completes
  const showSuccessScreen = (amount: number) => {
    // Fade out current view
    paymentContentOpacity.value = withTiming(0, { duration: 150 });
    savedCardsContentOpacity.value = withTiming(0, { duration: 150 });
    
    sheetHeight.value = withSpring(SUCCESS_HEIGHT, { 
      damping: 20, 
      stiffness: 150,
      mass: 0.8,
    });
    
    setTimeout(() => {
      setViewState('success');
      successContentOpacity.value = withTiming(1, { duration: 300 });
      
      // Auto-close after 2.5 seconds
      setTimeout(() => {
        successContentOpacity.value = withTiming(0, { duration: 200 });
        setTimeout(() => closeSheet(), 200);
      }, 2500);
    }, 150);
  };

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

              {/* Save Card Checkbox */}
              <Pressable 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSaveCardForFuture(!saveCardForFuture);
                }}
                style={styles.saveCardRow}
              >
                <View style={[styles.saveCardCheckbox, saveCardForFuture && styles.saveCardCheckboxChecked]}>
                  {saveCardForFuture && <Icon source="check" size={14} color="#FFFFFF" />}
                </View>
                <RNText style={styles.saveCardText}>Save card for future donations</RNText>
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

              {/* Secured Footer */}
              <View style={styles.securedRow}>
                <Icon source="shield-check" size={14} color="#10B981" />
                <RNText style={styles.securedRowText}>SECURED BY STRIPE</RNText>
              </View>
            </Animated.View>
          ) : viewState === 'custom' ? (
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

              {/* Save Card Checkbox */}
              <Pressable 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSaveCardForFuture(!saveCardForFuture);
                }}
                style={styles.saveCardRowCustom}
              >
                <View style={[styles.saveCardCheckbox, saveCardForFuture && styles.saveCardCheckboxChecked]}>
                  {saveCardForFuture && <Icon source="check" size={14} color="#FFFFFF" />}
                </View>
                <RNText style={styles.saveCardText}>Save card for future donations</RNText>
              </Pressable>

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
          ) : viewState === 'payment' ? (
            /* PAYMENT VIEW */
            <Animated.View style={[styles.paymentView, animatedPaymentStyle]}>
              {/* Back Button */}
              <Pressable style={styles.backButton} onPress={handleBackFromPayment}>
                <Icon source="chevron-left" size={24} color="#6B7280" />
              </Pressable>

              {/* Label */}
              <RNText style={styles.label}>ENTER CARD DETAILS</RNText>

              {/* Amount Display */}
              <RNText style={styles.paymentAmount}>${getFinalAmount()}</RNText>

              {/* Card Form */}
              <View style={styles.cardFormContainer}>
                <CardForm
                  placeholders={{
                    number: '4242 4242 4242 4242',
                    expiration: 'MM/YY',
                    cvc: 'CVC',
                    postalCode: 'ZIP',
                  }}
                  cardStyle={{
                    backgroundColor: '#FFFFFF',
                    textColor: '#111827',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    fontSize: 16,
                    placeholderColor: '#9CA3AF',
                    cursorColor: '#214E91',
                    textErrorColor: '#EF4444',
                  }}
                  style={styles.cardForm}
                  onFormComplete={(cardDetails) => {
                    setCardComplete(cardDetails.complete);
                  }}
                />
              </View>

              {/* Save Card Checkbox */}
              <Pressable 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSaveCardForFuture(!saveCardForFuture);
                }}
                style={styles.saveCardRowPayment}
              >
                <View style={[styles.saveCardCheckbox, saveCardForFuture && styles.saveCardCheckboxChecked]}>
                  {saveCardForFuture && <Icon source="check" size={14} color="#FFFFFF" />}
                </View>
                <RNText style={styles.saveCardText}>Save card for future donations</RNText>
              </Pressable>

              {/* Pay Button */}
              <Pressable
                style={[
                  styles.payButton, 
                  (!cardComplete || confirmLoading) && styles.payButtonDisabled
                ]}
                onPress={handleConfirmPayment}
                disabled={!cardComplete || confirmLoading}
              >
                {confirmLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <RNText style={styles.payButtonText}>
                    Pay ${getFinalAmount()}
                  </RNText>
                )}
              </Pressable>

              {/* Pay with Saved Card Option */}
              {savedCards.length > 0 && (
                <Pressable onPress={handleShowSavedCardsFromPayment} style={styles.cardRow}>
                  <Icon source="credit-card-outline" size={18} color="#6B7280" />
                  <RNText style={styles.cardRowText}>
                    Pay with saved card ({savedCards.length})
                  </RNText>
                  <Icon source="chevron-right" size={16} color="#9CA3AF" />
                </Pressable>
              )}

              {/* Secured Footer */}
              <View style={styles.securedRow}>
                <Icon source="shield-check" size={14} color="#10B981" />
                <RNText style={styles.securedRowText}>SECURED BY STRIPE</RNText>
              </View>
            </Animated.View>
          ) : viewState === 'savedCards' ? (
            /* SAVED CARDS VIEW */
            <Animated.View style={[styles.savedCardsView, animatedSavedCardsStyle]}>
              {/* Back Button */}
              <Pressable style={styles.backButton} onPress={handleBackFromSavedCards}>
                <Icon source="chevron-left" size={24} color="#6B7280" />
              </Pressable>

              {/* Label */}
              <RNText style={styles.label}>SELECT PAYMENT METHOD</RNText>

              {/* Amount Display */}
              <RNText style={styles.paymentAmount}>${getFinalAmount()}</RNText>

              {/* Saved Cards List */}
              <ScrollView style={styles.savedCardsList} showsVerticalScrollIndicator={false}>
                {savedCards.map((card) => (
                  <Pressable
                    key={card.id}
                    style={[
                      styles.savedCardItem,
                      selectedSavedCard === card.id && styles.savedCardItemSelected
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedSavedCard(card.id);
                    }}
                  >
                    <View style={styles.savedCardLeft}>
                      <Icon 
                        source={card.brand === 'visa' ? 'credit-card' : 'credit-card-outline'} 
                        size={24} 
                        color={selectedSavedCard === card.id ? '#2563EB' : '#6B7280'} 
                      />
                      <View style={styles.savedCardInfo}>
                        <RNText style={styles.savedCardBrand}>
                          {getCardBrandDisplayName(card.brand)}
                        </RNText>
                        <RNText style={styles.savedCardNumber}>
                          •••• {card.last4}
                        </RNText>
                      </View>
                    </View>
                    <View style={[
                      styles.savedCardRadio,
                      selectedSavedCard === card.id && styles.savedCardRadioSelected
                    ]}>
                      {selectedSavedCard === card.id && (
                        <View style={styles.savedCardRadioInner} />
                      )}
                    </View>
                  </Pressable>
                ))}

                {/* Add New Card Option */}
                <Pressable style={styles.addNewCardButton} onPress={handleUseNewCard}>
                  <Icon source="plus" size={20} color="#2563EB" />
                  <RNText style={styles.addNewCardText}>Add new card</RNText>
                </Pressable>
              </ScrollView>

              {/* Pay Button */}
              <Pressable
                style={[
                  styles.payButton, 
                  (!selectedSavedCard || isProcessing) && styles.payButtonDisabled
                ]}
                onPress={handleChargeWithSavedCard}
                disabled={!selectedSavedCard || isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <RNText style={styles.payButtonText}>
                    Pay ${getFinalAmount()}
                  </RNText>
                )}
              </Pressable>

              {/* Secured Footer */}
              <View style={styles.securedRow}>
                <Icon source="shield-check" size={14} color="#10B981" />
                <RNText style={styles.securedRowText}>SECURED BY STRIPE</RNText>
              </View>
            </Animated.View>
          ) : viewState === 'success' ? (
            /* SUCCESS VIEW */
            <Animated.View style={[styles.successView, animatedSuccessStyle]}>
              <Animated.View 
                entering={FadeIn.duration(200).delay(100)}
                style={styles.successCircle}
              >
                <Animated.View
                  entering={FadeIn.duration(300).delay(300)}
                >
                  <Icon source="check-bold" size={56} color="#FFFFFF" />
                </Animated.View>
              </Animated.View>
              <Animated.Text 
                entering={FadeIn.duration(300).delay(400)}
                style={styles.successTitle}
              >
                Thank You!
              </Animated.Text>
              <Animated.Text 
                entering={FadeIn.duration(300).delay(500)}
                style={styles.successSubtitle}
              >
                Your ${getFinalAmount()} donation to MAS Staten Island has been received
              </Animated.Text>
              <Animated.Text 
                entering={FadeIn.duration(300).delay(600)}
                style={styles.successNote}
              >
                May Allah reward you abundantly
              </Animated.Text>
            </Animated.View>
          ) : null}
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
    borderRadius: 40,
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
  // Payment View Styles
  paymentView: {
    flex: 1,
    paddingTop: 8,
  },
  paymentAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 20,
  },
  cardFormContainer: {
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 4,
  },
  cardForm: {
    width: '100%',
    height: 200,
  },
  payButton: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  payButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  payButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Saved Cards View Styles
  savedCardsView: {
    flex: 1,
    paddingTop: 8,
  },
  savedCardsList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  savedCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  savedCardItemSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  savedCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savedCardInfo: {
    marginLeft: 12,
  },
  savedCardBrand: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  savedCardNumber: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  savedCardRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savedCardRadioSelected: {
    borderColor: '#2563EB',
  },
  savedCardRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2563EB',
  },
  addNewCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginBottom: 10,
  },
  addNewCardText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2563EB',
    marginLeft: 8,
  },
  // Save Card Checkbox Styles
  saveCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  saveCardRowCustom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  saveCardRowPayment: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  saveCardCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#FFFFFF',
  },
  saveCardCheckboxChecked: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  saveCardText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  // Success View Styles
  successView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  successNote: {
    fontSize: 14,
    color: '#10B981',
    fontStyle: 'italic',
  },
});
