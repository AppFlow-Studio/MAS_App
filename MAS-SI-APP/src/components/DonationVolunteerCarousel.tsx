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

  const padding = 24; // 12px on each side from px-3
  const cardWidth = windowWidth * 0.75; // 75% of screen width
  const spacing = 12;

  const handleScroll = (event: any) => {
    setScrollX(event.nativeEvent.contentOffset.x);
  };

  const getItemLayout = (_data: any, index: number) => ({
    length: cardWidth + spacing,
    offset: (cardWidth + spacing) * index,
    index: index,
  });

  // Expose scroll methods to parent
  useImperativeHandle(ref, () => ({
    scrollToDonation: () => {
      if (donationIndexRef.current >= 0 && flatListRef.current && items.length > 0) {
        try {
          flatListRef.current.scrollToIndex({
            index: donationIndexRef.current,
            animated: true,
            viewOffset: 12,
          });
        } catch (error) {
          // Fallback to scrollToOffset if scrollToIndex fails
          const offset = donationIndexRef.current * (cardWidth + spacing);
          flatListRef.current.scrollToOffset({
            offset: offset,
            animated: true,
          });
        }
      }
    },
    scrollToVolunteer: () => {
      if (volunteerIndexRef.current >= 0 && flatListRef.current && items.length > 0) {
        try {
          flatListRef.current.scrollToIndex({
            index: volunteerIndexRef.current,
            animated: true,
            viewOffset: 12,
          });
        } catch (error) {
          // Fallback to scrollToOffset if scrollToIndex fails
          const offset = volunteerIndexRef.current * (cardWidth + spacing);
          flatListRef.current.scrollToOffset({
            offset: offset,
            animated: true,
          });
        }
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
    <View style={{ height: 250 }}>
      <AnimatedFlatList
        data={items}
        renderItem={({ item, index }) => (
          <CardItem
            item={item}
            index={index}
            cardWidth={cardWidth}
            spacing={spacing}
            isFirst={index === 0}
            isLast={index === items.length - 1}
          />
        )}
        horizontal
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={cardWidth + spacing}
        decelerationRate={0.9}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12 }}
        getItemLayout={getItemLayout}
        ref={flatListRef}
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
  isLast: boolean;
};

function CardItem({ item, cardWidth, spacing, isFirst, isLast }: CardItemProps) {
  const [imageReady, setImageReady] = useState(false);

  const marginLeft = isFirst ? 0 : spacing / 2;
  const marginRight = isLast ? 0 : spacing / 2;

  if (item.type === 'donation') {
    const donation = item as DonationCategory;
    return (
      <View style={{ width: cardWidth, marginLeft, marginRight }}>
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
              style={{ color: '#000000', width: '100%', textAlign: 'left' }}
            >
              {donation.project_name}
            </Text>
          </Pressable>
        </Link>
      </View>
    );
  } else {
    const volunteer = item as VolunteerOpportunity;
    const handlePress = () => {
      if (volunteer.link) {
        Linking.canOpenURL(volunteer.link).then(() => {
          Linking.openURL(volunteer.link!);
        });
      }
    };

    return (
      <View style={{ width: cardWidth, marginLeft, marginRight }}>
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
            style={{ color: '#000000', width: '100%', textAlign: 'left' }}
          >
            {volunteer.title}
          </Text>
        </Pressable>
      </View>
    );
  }
}

