import { View, Text, FlatList, Dimensions, Pressable } from 'react-native';
import React, { useRef, forwardRef, useImperativeHandle, useCallback, memo, useMemo } from 'react';
import { ActivityIndicator, Icon } from 'react-native-paper';
import Animated from 'react-native-reanimated';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { useDonationsAndVolunteers, type CardItem } from '../hooks/useDonationsAndVolunteers';

export type DonationVolunteerCarouselRef = {
  scrollToDonation: () => void;
  scrollToVolunteer: () => void;
  scrollToAdvertise: () => void;
};

type DonationVolunteerCarouselProps = {
  onDonationPress?: () => void;
  onIndexChange?: (index: number) => void;
};

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const DonationVolunteerCarousel = forwardRef<DonationVolunteerCarouselRef, DonationVolunteerCarouselProps>(({ onDonationPress, onIndexChange }, ref) => {
  const windowWidth = Dimensions.get("window").width;
  const { data: items = [], isLoading: loading } = useDonationsAndVolunteers();
  const flatListRef = useRef<FlatList>(null);
  const currentIndexRef = useRef<number>(0);
  const donationIndexRef = useRef<number>(-1);
  const volunteerIndexRef = useRef<number>(-1);
  const advertiseIndexRef = useRef<number>(-1);
  const isScrollingFromTabRef = useRef(false);

  // Compute index refs from items data
  useMemo(() => {
    donationIndexRef.current = items.findIndex(i => i.type === 'donation');
    volunteerIndexRef.current = items.findIndex(i => i.type === 'volunteer');
    advertiseIndexRef.current = items.findIndex(i => i.type === 'advertise');
  }, [items]);

  const sideMargin = 12; // Space on left/right edges of screen
  const cardWidth = windowWidth - (sideMargin * 2); // Card fills screen minus margins
  const itemWidth = cardWidth + sideMargin; // Card width + gap to next card

  // Only update tab when scroll settles to prevent flickering during fast swipes
  const handleMomentumScrollEnd = useCallback((event: any) => {
    // Skip if this scroll was triggered by tab press
    if (isScrollingFromTabRef.current) {
      isScrollingFromTabRef.current = false;
      return;
    }
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / itemWidth);
    if (newIndex !== currentIndexRef.current && newIndex >= 0 && newIndex < items.length) {
      currentIndexRef.current = newIndex;
      onIndexChange?.(newIndex);
    }
  }, [items.length, onIndexChange, itemWidth]);

  // Also handle when user lifts finger without momentum (slow drag and release)
  const handleScrollEndDrag = useCallback((event: any) => {
    // Skip if this scroll was triggered by tab press
    if (isScrollingFromTabRef.current) {
      return;
    }
    const offsetX = event.nativeEvent.contentOffset.x;
    const velocity = event.nativeEvent.velocity?.x || 0;
    
    // If there's no significant velocity, the momentum event won't fire, so update here
    if (Math.abs(velocity) < 0.5) {
      const newIndex = Math.round(offsetX / itemWidth);
      if (newIndex !== currentIndexRef.current && newIndex >= 0 && newIndex < items.length) {
        currentIndexRef.current = newIndex;
        onIndexChange?.(newIndex);
      }
    }
  }, [items.length, onIndexChange, itemWidth]);
  
  const getItemLayout = useCallback((_data: any, index: number) => ({
    length: itemWidth,
    offset: itemWidth * index,
    index: index,
  }), [itemWidth]);

  // Expose scroll methods to parent
  useImperativeHandle(ref, () => ({
    scrollToDonation: () => {
      if (donationIndexRef.current >= 0 && flatListRef.current && items.length > 0) {
        isScrollingFromTabRef.current = true;
        currentIndexRef.current = 0;
        flatListRef.current.scrollToOffset({ offset: 0, animated: true });
      }
    },
    scrollToVolunteer: () => {
      if (volunteerIndexRef.current >= 0 && flatListRef.current && items.length > 0) {
        isScrollingFromTabRef.current = true;
        currentIndexRef.current = 1;
        flatListRef.current.scrollToOffset({ offset: itemWidth, animated: true });
      }
    },
    scrollToAdvertise: () => {
      if (advertiseIndexRef.current >= 0 && flatListRef.current && items.length > 0) {
        isScrollingFromTabRef.current = true;
        currentIndexRef.current = 2;
        flatListRef.current.scrollToOffset({ offset: itemWidth * 2, animated: true });
      }
    },
  }), [items.length, itemWidth]);

  if (loading) {
    return (
      <View style={{ height: 250, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="small" color="#214E91" />
      </View>
    );
  }

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <View style={{ height: 260, marginBottom: 8, overflow: 'hidden' }}>
      <AnimatedFlatList
        data={items}
        keyExtractor={(item: CardItem) => 'project_id' in item ? item.project_id : 'id' in item ? item.id : 'advertise'}
        renderItem={({ item, index }: { item: CardItem; index: number }) => (
          <CardItem
            item={item}
            index={index}
            cardWidth={cardWidth}
            spacing={sideMargin}
            onDonationPress={onDonationPress}
          />
        )}
        horizontal
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollEndDrag={handleScrollEndDrag}
        scrollEventThrottle={16}
        snapToInterval={itemWidth}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: sideMargin }}
        getItemLayout={getItemLayout}
        ref={flatListRef}
        pagingEnabled={false}
        removeClippedSubviews={false}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
      />
    </View>
  );
});

DonationVolunteerCarousel.displayName = 'DonationVolunteerCarousel';

export default DonationVolunteerCarousel;

type CardItemProps = {
  item: CardItem;
  index: number;
  cardWidth: number;
  spacing: number;
  onDonationPress?: () => void;
};

// Memoized CardItem for better performance during scrolling
const CardItem = memo(function CardItem({ item, cardWidth, spacing, onDonationPress }: CardItemProps) {
  const router = useRouter();

  // Each card has right margin for spacing, first card starts at container padding
  const marginRight = spacing;

  if (item.type === 'advertise') {
    return (
      <View style={{ width: cardWidth, marginRight }}>
        <Pressable 
          style={{ width: '100%', alignItems: 'flex-start' }}
          onPress={() => router.push('/more/BusinessAds')}
        >
          <View
            style={{
              width: '100%',
              height: 200,
              shadowColor: 'black',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              borderRadius: 20,
              elevation: 8,
              backgroundColor: '#1F2937',
              padding: 20,
              justifyContent: 'space-between',
            }}
          >
            {/* Top row: Megaphone icon and price badge */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              {/* Megaphone icon container */}
              <View
                style={{
                  backgroundColor: '#374151',
                  borderRadius: 16,
                  width: 56,
                  height: 56,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Icon source="bullhorn" size={28} color="#FFFFFF" />
              </View>
              
              {/* Price badge */}
              <View
                style={{
                  backgroundColor: '#F3F4F6',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: 'bold' }}>$50/mo</Text>
              </View>
            </View>

            {/* Bottom content: Title, subtitle, and arrow */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>
                  Advertise Your
                </Text>
                <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
                  Business
                </Text>
                <Text style={{ color: '#9CA3AF', fontSize: 14 }}>
                  Reach 2000+ local community members
                </Text>
              </View>
              
              {/* Arrow button */}
              <View
                style={{
                  backgroundColor: '#374151',
                  borderRadius: 24,
                  width: 48,
                  height: 48,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Icon source="arrow-right" size={24} color="#FFFFFF" />
              </View>
            </View>
          </View>
          <Text
            className="mt-3 font-bold"
            numberOfLines={2}
            style={{ color: '#000000', width: '100%', textAlign: 'left', marginBottom: 4 }}
          >
            Advertise Your Business
          </Text>
        </Pressable>
      </View>
    );
  }

  if (item.type === 'donation') {
    return (
      <View style={{ width: cardWidth, marginRight }}>
        <Pressable 
          style={{ width: '100%', alignItems: 'flex-start' }}
          onPress={onDonationPress}
        >
          <View
            style={{
              width: '100%',
              height: 200,
              shadowColor: 'black',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              borderRadius: 20,
              elevation: 8,
              backgroundColor: '#16A34A',
              padding: 20,
              justifyContent: 'space-between',
            }}
          >
            {/* Top row: Heart icon */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
              {/* Heart icon container */}
              <View
                style={{
                  backgroundColor: '#22C55E',
                  borderRadius: 16,
                  width: 56,
                  height: 56,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Icon source="hand-heart" size={28} color="#FFFFFF" />
              </View>
            </View>

            {/* Bottom content: Title, subtitle, and arrow */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>
                  Support Your
                </Text>
                <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
                  Masjid
                </Text>
                <Text style={{ color: '#DCFCE7', fontSize: 14 }}>
                  Help us serve the community
                </Text>
              </View>
              
              {/* Arrow button */}
              <View
                style={{
                  backgroundColor: '#22C55E',
                  borderRadius: 24,
                  width: 48,
                  height: 48,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Icon source="arrow-right" size={24} color="#FFFFFF" />
              </View>
            </View>
          </View>
          <Text
            className="mt-3 font-bold"
            numberOfLines={2}
            style={{ color: '#000000', width: '100%', textAlign: 'left', marginBottom: 4 }}
          >
            Support Your Masjid
          </Text>
        </Pressable>
      </View>
    );
  } else {
    const volunteer = item as Extract<CardItem, { type: 'volunteer' }>;
    const handlePress = async () => {
      if (volunteer.link) {
        try {
          // Ensure URL has proper protocol
          let url = volunteer.link.trim();
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
          }
          await WebBrowser.openBrowserAsync(url);
        } catch (err) {
          console.log('Error opening URL:', err);
        }
      }
    };

    return (
      <View style={{ width: cardWidth, marginRight }}>
        <Pressable style={{ width: '100%', alignItems: 'flex-start' }} onPress={handlePress}>
          <View
            style={{
              width: '100%',
              height: 200,
              shadowColor: 'black',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              borderRadius: 20,
              elevation: 8,
              backgroundColor: '#214E91',
              padding: 20,
              justifyContent: 'space-between',
            }}
          >
            {/* Top row: People icon */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
              {/* People icon container */}
              <View
                style={{
                  backgroundColor: '#3B82F6',
                  borderRadius: 16,
                  width: 56,
                  height: 56,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Icon source="account-group" size={28} color="#FFFFFF" />
              </View>
            </View>

            {/* Bottom content: Title, subtitle, and arrow */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>
                  Volunteer
                </Text>
                <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
                  With Us
                </Text>
                <Text style={{ color: '#BFDBFE', fontSize: 14 }}>
                  Join our community efforts
                </Text>
              </View>
              
              {/* Arrow button */}
              <View
                style={{
                  backgroundColor: '#3B82F6',
                  borderRadius: 24,
                  width: 48,
                  height: 48,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Icon source="arrow-right" size={24} color="#FFFFFF" />
              </View>
            </View>
          </View>
          <Text
            className="mt-3 font-bold"
            numberOfLines={2}
            style={{ color: '#000000', width: '100%', textAlign: 'left', marginBottom: 4 }}
          >
            Volunteer With Us
          </Text>
        </Pressable>
      </View>
    );
  }
});

