import { View, Text, Pressable, Linking, Image } from 'react-native';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ActivityIndicator } from 'react-native-paper';

type VolunteerOpportunity = {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  link: string | null;
};

export default function VolunteerCard() {
  const [volunteer, setVolunteer] = useState<VolunteerOpportunity | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchVolunteer = async () => {
    try {
      // Try to fetch from volunteers table if it exists
      const { data, error } = await supabase.from('volunteers').select('*').limit(1).single();
      if (error) {
        // If table doesn't exist, use default volunteer opportunity
        console.log('Volunteers table not found, using default');
        setVolunteer({
          id: 'default',
          title: 'Volunteer Opportunities',
          description: 'Join us in serving our community',
          thumbnail: null,
          link: 'https://www.mobilize.us/mascenter/',
        });
      } else if (data) {
        setVolunteer(data);
      } else {
        // Default volunteer opportunity
        setVolunteer({
          id: 'default',
          title: 'Volunteer Opportunities',
          description: 'Join us in serving our community',
          thumbnail: null,
          link: 'https://www.mobilize.us/mascenter/',
        });
      }
    } catch (error) {
      console.error('Error in fetchVolunteer:', error);
      // Use default on error
      setVolunteer({
        id: 'default',
        title: 'Volunteer Opportunities',
        description: 'Join us in serving our community',
        thumbnail: null,
        link: 'https://www.mobilize.us/mascenter/',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteer();
    
    // Subscribe to changes if table exists
    const channel = supabase
      .channel('volunteer-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'volunteers',
        },
        async () => {
          await fetchVolunteer();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handlePress = () => {
    if (volunteer?.link) {
      Linking.canOpenURL(volunteer.link).then(() => {
        Linking.openURL(volunteer.link!);
      });
    }
  };

  if (loading) {
    return (
      <View style={{ width: '100%', height: 200, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="small" color="#214E91" />
      </View>
    );
  }

  if (!volunteer) {
    return null;
  }

  return (
    <View style={{ width: '100%' }}>
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
