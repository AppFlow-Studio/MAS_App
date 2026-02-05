import { View, StyleSheet, Modal, Pressable, Dimensions, Platform, Text as RNText, Keyboard, TextInput, KeyboardAvoidingView } from 'react-native';
import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { Icon } from 'react-native-paper';
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
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { supabase } from '@/src/lib/supabase';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/src/providers/AuthProvider';
import { MessageSquare, Send, CheckCircle, X } from 'lucide-react-native';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const SHEET_HEIGHT = 380;
const SUCCESS_HEIGHT = 280;

export interface FeedbackBottomSheetRef {
  open: () => void;
  close: () => void;
}

interface FeedbackBottomSheetProps {
  userProfile?: any;
}

const FeedbackBottomSheet = forwardRef<FeedbackBottomSheetRef, FeedbackBottomSheetProps>(({ userProfile }, ref) => {
  const { session } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [viewState, setViewState] = useState<'input' | 'success'>('input');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const translateY = useSharedValue(0);
  const sheetHeight = useSharedValue(SHEET_HEIGHT);
  const keyboardOffset = useSharedValue(0);
  const contentOpacity = useSharedValue(1);
  const successContentOpacity = useSharedValue(0);

  // Keyboard event listeners
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        setKeyboardVisible(true);
        if (viewState === 'input' && isVisible) {
          const keyboardHeight = event.endCoordinates.height;
          // Move sheet up by translating negatively (up)
          keyboardOffset.value = withSpring(-keyboardHeight, {
            damping: 20,
            stiffness: 150,
            mass: 0.8,
          });
        }
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        if (viewState === 'input' && isVisible) {
          // Move sheet back to original position
          keyboardOffset.value = withSpring(0, {
            damping: 20,
            stiffness: 150,
            mass: 0.8,
          });
        }
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, [viewState, isVisible]);

  const closeSheet = () => {
    Keyboard.dismiss();
    setIsVisible(false);
    setViewState('input');
    setFeedbackMessage('');
    setIsSending(false);
    sheetHeight.value = SHEET_HEIGHT;
    keyboardOffset.value = 0;
    contentOpacity.value = 1;
    successContentOpacity.value = 0;
  };

  useImperativeHandle(ref, () => ({
    open: () => {
      translateY.value = 0;
      sheetHeight.value = SHEET_HEIGHT;
      keyboardOffset.value = 0;
      contentOpacity.value = 1;
      successContentOpacity.value = 0;
      setIsVisible(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    close: () => {
      closeSheet();
    },
  }));

  const handleSubmitFeedback = async () => {
    if (!feedbackMessage.trim() || isSending) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSending(true);
    Keyboard.dismiss();

    try {
      const { error } = await supabase.functions.invoke('donation-confirmation-email', {
        body: { message: feedbackMessage, profile: userProfile }
      });

      if (error) {
        Toast.show({
          type: 'error',
          text1: 'Failed to send feedback',
          text2: 'Please try again later',
        });
        setIsSending(false);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showSuccessScreen();
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to send feedback',
        text2: 'Please try again later',
      });
      setIsSending(false);
    }
  };

  const showSuccessScreen = () => {
    contentOpacity.value = withTiming(0, { duration: 150 });
    
    sheetHeight.value = withSpring(SUCCESS_HEIGHT, { 
      damping: 20, 
      stiffness: 150,
      mass: 0.8,
    });
    
    setTimeout(() => {
      setViewState('success');
      successContentOpacity.value = withTiming(1, { duration: 300 });
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        successContentOpacity.value = withTiming(0, { duration: 200 });
        setTimeout(() => closeSheet(), 200);
      }, 2000);
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
    transform: [{ translateY: translateY.value + keyboardOffset.value }],
    height: sheetHeight.value,
  }));

  const animatedInputStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const animatedSuccessStyle = useAnimatedStyle(() => ({
    opacity: successContentOpacity.value,
  }));

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
            { paddingBottom: 24 },
            animatedSheetStyle,
          ]}
        >
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {viewState === 'input' ? (
            /* INPUT VIEW */
            <Animated.View style={[styles.content, animatedInputStyle]}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <MessageSquare color="#1d4681" size={24} />
                </View>
                <View style={styles.headerText}>
                  <RNText style={styles.title}>Send Feedback</RNText>
                  <RNText style={styles.subtitle}>Share thoughts, report bugs, or request features</RNText>
                </View>
                <Pressable 
                  style={styles.closeButton} 
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    closeSheet();
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X color="#6B7280" size={24} />
                </Pressable>
              </View>

              {/* Text Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your feedback here..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  value={feedbackMessage}
                  onChangeText={setFeedbackMessage}
                  editable={!isSending}
                  autoFocus={false}
                />
              </View>

              {/* Submit Button */}
              <Pressable 
                style={[
                  styles.submitButton,
                  (!feedbackMessage.trim() || isSending) && styles.submitButtonDisabled
                ]}
                onPress={handleSubmitFeedback}
                disabled={!feedbackMessage.trim() || isSending}
              >
                <Send color="white" size={18} style={{ marginRight: 8 }} />
                <RNText style={styles.submitButtonText}>
                  {isSending ? 'Sending...' : 'Send Feedback'}
                </RNText>
              </Pressable>
            </Animated.View>
          ) : (
            /* SUCCESS VIEW */
            <Animated.View style={[styles.successContent, animatedSuccessStyle]}>
              <View style={styles.successIconContainer}>
                <CheckCircle color="#10B981" size={64} />
              </View>
              <RNText style={styles.successTitle}>Thank You!</RNText>
              <RNText style={styles.successSubtitle}>Your feedback has been sent successfully</RNText>
            </Animated.View>
          )}
        </Animated.View>
      </GestureDetector>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
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
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(29, 70, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  headerText: {
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  inputContainer: {
    flex: 1,
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 120,
  },
  submitButton: {
    backgroundColor: '#1d4681',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
  successContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default FeedbackBottomSheet;
