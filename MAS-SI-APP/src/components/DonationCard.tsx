import { View, Text, Dimensions, Image, Pressable } from 'react-native';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ActivityIndicator } from 'react-native-paper';
import { Link } from 'expo-router';
import { FlyerSkeleton } from './FlyerSkeleton';

type DonationCategory = {
  project_id: string;
  project_name: string;
  project_goal: number | null;
  project_linked_to: string | null;
  thumbnail: string | null;
};

export default function DonationCard() {
  const [category, setCategory] = useState<DonationCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageReady, setImageReady] = useState(false);

  const fetchCategory = async () => {
    try {
      const { data, error } = await supabase.from('projects').select('*').limit(1).single();
      if (error) {
        console.log('Error fetching donation category:', error);
        return;
      }
      if (data) {
        setCategory(data);
      }
    } catch (error) {
      console.error('Error in fetchCategory:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategory();
    
    // Subscribe to changes
    const channel = supabase
      .channel('donation-category-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
        },
        async () => {
          await fetchCategory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <View style={{ width: '100%', height: 200, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="small" color="#214E91" />
      </View>
    );
  }

  if (!category) {
    return null;
  }

  return (
    <View style={{ width: '100%' }}>
      <Link
        href={{
          pathname: '/more/DonationCategoires/[project_id]',
          params: {
            project_id: category.project_id,
            project_name: category.project_name,
            project_linked_to: category.project_linked_to,
            project_goal: category.project_goal,
            thumbnail: category.thumbnail,
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
                width={Dimensions.get("window").width * 0.5}
                height={200}
                style={{ position: 'absolute', top: 0, zIndex: 2 }}
              />
            )}
            <Image
              source={
                category.thumbnail
                  ? { uri: category.thumbnail }
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
            {category.project_name}
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}
