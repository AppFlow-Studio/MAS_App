import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Icon } from 'react-native-paper';

export type CapacityStatus = 'green' | 'yellow' | 'red' | null;

interface CapacityStatusSelectorProps {
  value: CapacityStatus;
  onChange: (status: CapacityStatus) => void;
  label?: string;
}

const STATUS_OPTIONS: { value: CapacityStatus; label: string; color: string; icon: string }[] = [
  { value: null, label: 'Off', color: '#9CA3AF', icon: 'close-circle-outline' },
  { value: 'green', label: 'Available', color: '#22C55E', icon: 'check-circle' },
  { value: 'yellow', label: 'Filling', color: '#EAB308', icon: 'alert-circle' },
  { value: 'red', label: 'Full', color: '#EF4444', icon: 'close-circle' },
];

const StatusButton = ({
  option,
  isSelected,
  onPress,
}: {
  option: typeof STATUS_OPTIONS[0];
  isSelected: boolean;
  onPress: () => void;
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.statusButton,
          {
            backgroundColor: isSelected ? option.color : '#F3F4F6',
            borderColor: isSelected ? option.color : '#E5E7EB',
          },
        ]}
      >
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: isSelected ? '#FFFFFF' : option.color,
            },
          ]}
        />
        <Text
          style={[
            styles.statusLabel,
            {
              color: isSelected ? '#FFFFFF' : '#6B7280',
            },
          ]}
        >
          {option.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

export const CapacityStatusSelector: React.FC<CapacityStatusSelectorProps> = ({
  value,
  onChange,
  label = 'Capacity Status',
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.optionsRow}>
        {STATUS_OPTIONS.map((option) => (
          <StatusButton
            key={option.label}
            option={option}
            isSelected={value === option.value}
            onPress={() => onChange(option.value)}
          />
        ))}
      </View>
      <Text style={styles.helperText}>
        {value === null && 'No status indicator will be shown'}
        {value === 'green' && 'Shows blinking green light - space available'}
        {value === 'yellow' && 'Shows yellow light - filling up'}
        {value === 'red' && 'Shows red light - full'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 6,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default CapacityStatusSelector;
