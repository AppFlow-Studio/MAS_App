import { View, Text, FlatList, Dimensions, Image, Pressable, Linking } from 'react-native';
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { supabase } from '../lib/supabase';
import { ActivityIndicator } from 'react-native-paper';
import { Link } from 'expo-router';
import { FlyerSkeleton } from './FlyerSkeleton';
import Animated from 'react-native-reanimated';

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

type CardItem = DonationCategory | VolunteerOpportunity;

export type DonationVolunteerCarouselRef = {
  scrollToDonation: () => void;
  scrollToVolunteer: () => void;
};

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const DonationVolunteerCarousel = forwardRef<DonationVolunteerCarouselRef>((props, ref) => {
  const windowWidth = Dimensions.get("window").width;
  const [items, setItems] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const [scrollX, setScrollX] = useState(0);
  const donationIndexRef = useRef<number>(-1);
  const volunteerIndexRef = useRef<number>(-1);

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

  const handleScroll = (event: any) => {
    setScrollX(event.nativeEvent.contentOffset.x);
  };

  const itemWidth = cardWidth + sideMargin; // Card width + gap to next card
  
  const getItemLayout = (_data: any, index: number) => ({
    length: itemWidth,
    offset: itemWidth * index,
    index: index,
  });

  // Expose scroll methods to parent
  useImperativeHandle(ref, () => ({
    scrollToDonation: () => {
      if (donationIndexRef.current >= 0 && flatListRef.current && items.length > 0) {
        flatListRef.current.scrollToOffset({
          offset: 0,
          animated: true,
        });
      }
    },
    scrollToVolunteer: () => {
      if (volunteerIndexRef.current >= 0 && flatListRef.current && items.length > 0) {
        flatListRef.current.scrollToOffset({
          offset: itemWidth,
          animated: true,
        });
      }
    },
  }));

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
          />
        )}
        horizontal
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={itemWidth}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: sideMargin }}
        getItemLayout={getItemLayout}
        ref={flatListRef}
        pagingEnabled={false}
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
};

function CardItem({ item, cardWidth, spacing, isFirst }: CardItemProps) {
  const [imageReady, setImageReady] = useState(false);

  // Each card has right margin for spacing, first card starts at container padding
  const marginRight = spacing;

  if (item.type === 'donation') {
    const donation = item as DonationCategory;
    return (
      <View style={{ width: cardWidth, marginRight }}>
        <Link
          href={{
            pathname: '/more/DonationCategoires/[project_id]',
            params: {
              project_id: donation.project_id,
              project_name: donation.project_name,
              project_linked_to: donation.project_linked_to,
              project_goal: donation.project_goal,
              thumbnail: donation.thumbnail,
            },
          }}
          asChild
        >
          <Pressable style={{ width: '100%', alignItems: 'flex-start' }}>
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
        </Link>
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
          const supported = await Linking.canOpenURL(url);
          if (supported) {
            await Linking.openURL(url);
          } else {
            console.log('Cannot open URL:', url);
          }
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

