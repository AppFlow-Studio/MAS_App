import { View, Text, ScrollView, Dimensions, Animated, FlatList, Linking, Platform, Pressable, Image } from 'react-native'
import React, { useEffect, useRef, useState, useCallback, memo } from 'react'
import { Extrapolation, useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { BlurView } from 'expo-blur'
import { Icon } from 'react-native-paper'
import { useApprovedAds } from '@/src/hooks/useAds'
function formatPhoneNumber( phoneNumberString : number ) {
  var cleaned = ('' + phoneNumberString).replace(/\D/g, '');
  var match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3];
  }
  return null;
}

// Helper functions for contact actions
const handleCall = (phoneNumber: number) => {
  const cleaned = ('' + phoneNumber).replace(/\D/g, '');
  Linking.openURL(`tel:${cleaned}`);
};

const handleSMS = (phoneNumber: number) => {
  const cleaned = ('' + phoneNumber).replace(/\D/g, '');
  Linking.openURL(`sms:${cleaned}`);
};

const handleEmail = (email: string) => {
  Linking.openURL(`mailto:${email}`);
};

const handleOpenMaps = (address: string) => {
  const encodedAddress = encodeURIComponent(address);
  const url = Platform.select({
    ios: `maps://maps.apple.com/?q=${encodedAddress}`,
    android: `geo:0,0?q=${encodedAddress}`,
  });
  if (url) {
    Linking.openURL(url);
  }
};

// Memoized ActionButton component - extracted outside main component
const ActionButton = memo(({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) => (
  <Pressable onPress={onPress} className='items-center'>
    <View style={{
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'white',
      borderRadius: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 10
    }}>
      <Icon source={icon} size={22} color='#1f2937' />
    </View>
    <Text className='text-gray-800 text-xs font-semibold mt-1'>{label}</Text>
  </Pressable>
));

ActionButton.displayName = 'ActionButton';

// Ad item type
type AdItem = {
  business_flyer_img: string;
  business_name: string;
  business_address: string;
  business_phone_number: number;
  business_email: string;
};

// Memoized AdCard component
const AdCard = memo(({ item, listItemWidth }: { item: AdItem; listItemWidth: number }) => (
  <View className='flex flex-col bg-white' style={{ borderRadius: 20, overflow: 'hidden', width: listItemWidth * .95 }}>
    {/* Flyer Image */}
    <Image
      source={{ uri: item.business_flyer_img }}
      style={{ width: '100%', height: 250, resizeMode: 'cover' }}
    />

    {/* Bottom Section */}
    <View style={{ backgroundColor: '#f3f4f6', paddingBottom: 16 }}>
      {/* Action Buttons */}
      <View className='flex-row justify-around px-4 py-4'>
        <ActionButton
          icon="phone"
          label="Call"
          onPress={() => handleCall(item.business_phone_number)}
        />
        <ActionButton
          icon="message-text"
          label="SMS"
          onPress={() => handleSMS(item.business_phone_number)}
        />
        <ActionButton
          icon="email"
          label="Email"
          onPress={() => handleEmail(item.business_email)}
        />
      </View>

      {/* Address Card */}
      <Pressable
        onPress={() => handleOpenMaps(item.business_address)}
        className='mx-4 bg-white rounded-xl flex-row items-center p-3'
      >
        <View className='bg-gray-800 rounded-full p-2 mr-3'>
          <Icon source="map-marker" size={20} color='white' />
        </View>
        <View className='flex-1'>
          <Text className='text-gray-900 font-semibold text-sm' numberOfLines={1}>{item.business_address}</Text>
          <Text className='text-gray-500 text-xs'>OPEN IN MAPS</Text>
        </View>
        <Icon source="chevron-right" size={24} color='#9CA3AF' />
      </Pressable>
    </View>
  </View>
));

AdCard.displayName = 'AdCard';

const ApprovedAds = ( {setRenderedFalse, setRenderedTrue} : { setRenderedFalse : ( ) => void, setRenderedTrue : ( ) => void } ) => {
  const { data: ads = [] } = useApprovedAds()
  const [ index, setIndex ] = useState(0)
  const [ active, setActive ] = useState(0)
  const flatListRef = useRef<FlatList>(null)
  const listItemWidth = Dimensions.get('screen').width

  useEffect(() => {
    if (ads.length > 0) {
      setRenderedTrue()
    } else {
      setRenderedFalse()
    }
  }, [ads])

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: listItemWidth * .95,
    offset: (listItemWidth * .95) * index,
    index: index
  }), [listItemWidth]);

  const handleScroll = useCallback((event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.ceil(scrollPosition / (listItemWidth * .95));
    setActive(index);
  }, [listItemWidth]);

  const keyExtractor = useCallback((item: AdItem, index: number) =>
    `ad-${item.business_name}-${index}`, []);

  const renderItem = useCallback(({ item }: { item: AdItem }) => (
    <AdCard item={item} listItemWidth={listItemWidth} />
  ), [listItemWidth]);
      
  // Auto-scroll effect - FIXED: Added dependency array to prevent interval recreation on every render
  useEffect(() => {
    if (ads && ads.length > 0) {
      const interval = setInterval(() => {
        setActive(currentActive => {
          if (currentActive < ads.length - 1) {
            flatListRef.current?.scrollToIndex({
              index: currentActive + 1,
              animated: true,
            });
            return currentActive + 1;
          } else {
            flatListRef.current?.scrollToIndex({
              index: 0,
              animated: true
            });
            return 0;
          }
        });
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [ads.length]);

  // const TestAds = [
  //   {
  //     business_flyer_img : 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNjUyOXwwfDF8c2VhcmNofDJ8fGZseWVyJTIwYWR8ZW58MHx8fHwxNjg3NTQ5NzA1&ixlib=rb-4.0.3&q=80&w=400',
  //     business_name : 'Business Name',
  //     business_address : 'Business Address',
  //   },
  //   {
  //     business_flyer_img : 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNjUyOXwwfDF8c2VhcmNofDJ8fGZseWVyJTIwYWR8ZW58MHx8fHwxNjg3NTQ5NzA1&ixlib=rb-4.0.3&q=80&w=400',
  //     business_name : 'Business Name',
  //     business_address : 'Business Address',
  //   },
  //   {
  //     business_flyer_img : 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNjUyOXwwfDF8c2VhcmNofDJ8fGZseWVyJTIwYWR8ZW58MHx8fHwxNjg3NTQ5NzA1&ixlib=rb-4.0.3&q=80&w=400',
  //     business_name : 'Business Name',
  //     business_address : 'Business Address',
  //   },
  //   {
  //     business_flyer_img : 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNjUyOXwwfDF8c2VhcmNofDJ8fGZseWVyJTIwYWR8ZW58MHx8fHwxNjg3NTQ5NzA1&ixlib=rb-4.0.3&q=80&w=400',
  //     business_name : 'Business Name',
  //     business_address : 'Business Address',
  //   },
  //   {
  //     business_flyer_img : 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNjUyOXwwfDF8c2VhcmNofDJ8fGZseWVyJTIwYWR8ZW58MHx8fHwxNjg3NTQ5NzA1&ixlib=rb-4.0.3&q=80&w=400',
  //     business_name : 'Business Name',
  //     business_address : 'Business Address',
  //   },
  //   {
  //     business_flyer_img : 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNjUyOXwwfDF8c2VhcmNofDJ8fGZseWVyJTIwYWR8ZW58MHx8fHwxNjg3NTQ5NzA1&ixlib=rb-4.0.3&q=80&w=400',
  //     business_name : 'Business Name',
  //     business_address : 'Business Address',
  //   },
  //   {
  //     business_flyer_img : 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNjUyOXwwfDF8c2VhcmNofDJ8fGZseWVyJTIwYWR8ZW58MHx8fHwxNjg3NTQ5NzA1&ixlib=rb-4.0.3&q=80&w=400',
  //     business_name : 'Business Name',
  //     business_address : 'Business Address',
  //   }
  // ]

  if (ads.length < 1) {
    return null;
  }

  return (
    <View style={{ 
      width: '100%', 
      alignItems: 'center',
      marginTop: 12
    }}>
      <View style={{ 
        width: listItemWidth * .95,
        borderRadius: 20,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden'
      }}>
        <Animated.FlatList
            ref={flatListRef}
            data={ads}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            horizontal
            onScroll={handleScroll}
            snapToInterval={listItemWidth * .95}
            scrollEventThrottle={16}
            decelerationRate={0.6}
            disableIntervalMomentum={true}
            disableScrollViewPanResponder={true}
            snapToAlignment="start"
            showsHorizontalScrollIndicator={false}
            getItemLayout={getItemLayout}
            // Performance optimizations
            initialNumToRender={2}
            maxToRenderPerBatch={2}
            windowSize={3}
            removeClippedSubviews={true}
        />
      </View>
    </View>
  )
}

export default ApprovedAds