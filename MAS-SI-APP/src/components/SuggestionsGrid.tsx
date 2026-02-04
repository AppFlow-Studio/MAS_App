import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from 'react-native-paper';
import * as WebBrowser from 'expo-web-browser';

type SuggestionItem = {
  id: string;
  label: string;
  icon: string;
  iconColor: string;
  badge?: string;
  badgeColor?: string;
  route?: string;
  onPress?: () => void;
};

type SuggestionsGridProps = {
  onDonatePress?: () => void;
  onAdvertisePress?: () => void;
};

const COLORS = {
  primary: '#214E91',
  accent: '#57BA47',
  white: '#FFFFFF',
  background: '#F3F4F6',
  black: '#000000',
  gray: '#6B7280',
  lightGray: '#F9FAFB',
};

const SuggestionsGrid = ({ onDonatePress, onAdvertisePress }: SuggestionsGridProps) => {
  const router = useRouter();

  const suggestions: SuggestionItem[] = [
    {
      id: 'donate',
      label: 'Donate',
      icon: 'hand-heart',
      iconColor: '#57BA47', // Green
      onPress: onDonatePress,
    },
    {
      id: 'volunteer',
      label: 'Volunteer',
      icon: 'account-group',
      iconColor: '#214E91', // Blue
      onPress: async () => {
        await WebBrowser.openBrowserAsync('https://www.mobilize.us/mascenter/');
      },
    },
    {
      id: 'advertise',
      label: 'Advertise',
      icon: 'bullhorn',
      iconColor: '#F59E0B', // Orange
      onPress: onAdvertisePress,
    },
    {
      id: 'programs',
      label: 'Programs',
      icon: 'calendar-star',
      iconColor: '#8B5CF6', // Purple
      route: '/menu/program/upcomingEvents',
    },
    {
      id: 'prayers',
      label: 'Prayers',
      icon: 'clock-outline',
      iconColor: '#EC4899', // Pink
      route: '/(user)/prayersTable',
    },
  ];

  const handlePress = (item: SuggestionItem) => {
    if (item.onPress) {
      item.onPress();
    } else if (item.route) {
      router.push(item.route as any);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Suggestions</Text>
      </View>

      {/* Scrollable Icons */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {suggestions.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.suggestionItem}
            onPress={() => handlePress(item)}
            activeOpacity={0.7}
          >
            {/* Badge */}
            {item.badge && (
              <View style={[styles.badge, { backgroundColor: item.badgeColor || COLORS.accent }]}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            )}
            
            {/* Icon Container */}
            <View style={styles.iconContainer}>
              <Icon source={item.icon} size={28} color={item.iconColor} />
            </View>
            
            {/* Label */}
            <Text style={styles.label}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  suggestionItem: {
    alignItems: 'center',
    width: 80,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    zIndex: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.black,
    textAlign: 'center',
  },
});

export default SuggestionsGrid;
