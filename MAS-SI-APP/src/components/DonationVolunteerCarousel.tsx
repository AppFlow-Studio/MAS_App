import { View, Text, FlatList, Dimensions, Image, Pressable, Linking, InteractionManager } from 'react-native';
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ActivityIndicator, Icon } from 'react-native-paper';
import { FlyerSkeleton } from './FlyerSkeleton';
import Animated from 'react-native-reanimated';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';

type DonationCategory = {
  project_id: string;
  project_name: string;
  project_goal: number | null;
  project_linked_to: string | null;
  thumbnail: string | null;
  type: 'donation';
};

type VolunteerOpportunity = {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  link: string | null;
  type: 'volunteer';
};

type AdvertiseCard = {
  id: string;
  type: 'advertise';
};

type CardItem = DonationCategory | VolunteerOpportunity | AdvertiseCard;

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
  const [items, setItems] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const currentIndexRef = useRef<number>(0);
  const donationIndexRef = useRef<number>(-1);
  const volunteerIndexRef = useRef<number>(-1);
  const advertiseIndexRef = useRef<number>(-1);
  const isScrollingFromTabRef = useRef(false);

  const fetchData = async () => {
    try {
      // Fetch only "General Masjid Support" donation category
      const { data: donations, error: donationError } = await supabase
        .from('projects')
        .select('*')
        .ilike('project_name', '%General Masjid Support%')
        .limit(1);

      // Fetch volunteers (if table exists)
      const { data: volunteers, error: volunteerError } = await supabase
        .from('volunteers')
        .select('*')
        .limit(1);

      const combinedItems: CardItem[] = [];

      // Add "General Masjid Support" donation category
      if (donations && donations.length > 0) {
        donations.forEach((donation) => {
          combinedItems.push({
            ...donation,
            type: 'donation' as const,
          });
        });
        donationIndexRef.current = 0;
      }

      // Add volunteer opportunities
      if (volunteers && volunteers.length > 0) {
        volunteers.forEach((volunteer) => {
          combinedItems.push({
            ...volunteer,
            type: 'volunteer' as const,
          });
        });
        volunteerIndexRef.current = combinedItems.length - 1;
      } else {
        // Add default volunteer if no volunteers found
        combinedItems.push({
          id: 'default',
          title: 'Volunteer Opportunities',
          description: 'Join us in serving our community',
          thumbnail: null,
          link: 'https://www.mobilize.us/mascenter/',
          type: 'volunteer' as const,
        });
        volunteerIndexRef.current = combinedItems.length - 1;
      }

      // Add advertise your business card
      combinedItems.push({
        id: 'advertise',
        type: 'advertise' as const,
      });
      advertiseIndexRef.current = combinedItems.length - 1;

      setItems(combinedItems);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set default items on error
      setItems([
        {
          id: 'default',
          title: 'Volunteer Opportunities',
          description: 'Join us in serving our community',
          thumbnail: null,
          link: 'https://www.mobilize.us/mascenter/',
          type: 'volunteer' as const,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to changes
    const donationChannel = supabase
      .channel('donation-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
        },
        async () => {
          await fetchData();
        }
      )
      .subscribe();

    const volunteerChannel = supabase
      .channel('volunteer-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'volunteers',
        },
        async () => {
          await fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(donationChannel);
      supabase.removeChannel(volunteerChannel);
    };
  }, []);

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
        flatListRef.current.scrollToOffset({
          offset: 0,
          animated: true,
        });
      }
    },
    scrollToVolunteer: () => {
      if (volunteerIndexRef.current >= 0 && flatListRef.current && items.length > 0) {
        isScrollingFromTabRef.current = true;
        currentIndexRef.current = 1;
        flatListRef.current.scrollToOffset({
          offset: itemWidth,
          animated: true,
        });
      }
    },
    scrollToAdvertise: () => {
      if (advertiseIndexRef.current >= 0 && flatListRef.current && items.length > 0) {
        isScrollingFromTabRef.current = true;
        currentIndexRef.current = 2;
        flatListRef.current.scrollToOffset({
          offset: itemWidth * 2,
          animated: true,
        });
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
        renderItem={({ item, index }) => (
          <CardItem
            item={item}
            index={index}
            cardWidth={cardWidth}
            spacing={sideMargin}
            isFirst={index === 0}
            onDonationPress={onDonationPress}
          />
        )}
        horizontal
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollEndDrag={handleScrollEndDrag}
        scrollEventThrottle={32}
        snapToInterval={itemWidth}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: sideMargin }}
        getItemLayout={getItemLayout}
        ref={flatListRef}
        pagingEnabled={false}
        removeClippedSubviews={true}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={3}
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
  isFirst: boolean;
  onDonationPress?: () => void;
};

function CardItem({ item, cardWidth, spacing, isFirst, onDonationPress }: CardItemProps) {
  const [imageReady, setImageReady] = useState(false);
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
    const donation = item as DonationCategory;
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
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: 20,
              elevation: 8,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {!imageReady && (
              <FlyerSkeleton
                width={cardWidth}
                height={200}
                style={{ position: 'absolute', top: 0, zIndex: 2 }}
              />
            )}
            <Image
              source={
                donation.thumbnail
                  ? { uri: donation.thumbnail }
                  : require('@/assets/images/Donations5.png')
              }
              style={{
                width: '100%',
                height: '100%',
                resizeMode: 'cover',
              }}
              onLoad={() => setImageReady(true)}
              onError={() => setImageReady(false)}
            />
          </View>
          <Text
            className="mt-3 font-bold"
            numberOfLines={2}
            style={{ color: '#000000', width: '100%', textAlign: 'left', marginBottom: 4 }}
          >
            {donation.project_name}
          </Text>
        </Pressable>
      </View>
    );
  } else {
    const volunteer = item as VolunteerOpportunity;
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
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: 20,
              elevation: 8,
              backgroundColor: '#214E91',
            }}
          >
            {volunteer.thumbnail ? (
              <Image
                source={{ uri: volunteer.thumbnail }}
                style={{
                  width: '100%',
                  height: '100%',
                  resizeMode: 'cover',
                  borderRadius: 20,
                }}
                onLoad={() => setImageReady(true)}
                onError={() => setImageReady(false)}
              />
            ) : (
              <View
                style={{
                  width: '100%',
                  height: '100%',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 20,
                }}
              >
                <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>
                  Volunteer
                </Text>
                <Text style={{ color: 'white', fontSize: 16, marginTop: 8, textAlign: 'center', paddingHorizontal: 20 }}>
                  Join Our Community
                </Text>
              </View>
            )}
          </View>
          <Text
            className="mt-3 font-bold"
            numberOfLines={2}
            style={{ color: '#000000', width: '100%', textAlign: 'left', marginBottom: 4 }}
          >
            {volunteer.title}
          </Text>
        </Pressable>
      </View>
    );
  }
}

