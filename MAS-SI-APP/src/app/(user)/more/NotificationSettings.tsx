import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Linking,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Bell, BellOff, ChevronLeft, ExternalLink, Users } from 'lucide-react-native';
import { useNotifications } from '@/src/providers/NotificationProvider';
import { useAuth } from '@/src/providers/AuthProvider';
import { supabase } from '@/src/lib/supabase';
import * as Notifications from 'expo-notifications';

export default function NotificationSettings() {
  const router = useRouter();
  const { isEnabled, pushToken, requestPermission } = useNotifications();
  const { session } = useAuth();
  const [toggleValue, setToggleValue] = useState(isEnabled);
  const [capacityAlertsEnabled, setCapacityAlertsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [capacityLoading, setCapacityLoading] = useState(false);

  useEffect(() => {
    setToggleValue(isEnabled);
  }, [isEnabled]);

  // Check if user is subscribed to capacity alerts
  useEffect(() => {
    const checkCapacitySubscription = async () => {
      if (!session?.user.id) return;
      
      const { data, error } = await supabase
        .from('capacity_alert_subscribers')
        .select('id')
        .eq('user_id', session.user.id)
        .single();
      
      if (data && !error) {
        setCapacityAlertsEnabled(true);
      }
    };
    
    checkCapacitySubscription();
  }, [session?.user.id]);

  const handleCapacityAlertsToggle = async (value: boolean) => {
    if (!session?.user.id) return;
    
    setCapacityLoading(true);
    setCapacityAlertsEnabled(value);
    
    try {
      if (value) {
        // Subscribe to capacity alerts
        const { error } = await supabase
          .from('capacity_alert_subscribers')
          .upsert({ user_id: session.user.id }, { onConflict: 'user_id' });
        
        if (error) {
          console.log('Error subscribing to capacity alerts:', error);
          setCapacityAlertsEnabled(false);
        }
      } else {
        // Unsubscribe from capacity alerts
        const { error } = await supabase
          .from('capacity_alert_subscribers')
          .delete()
          .eq('user_id', session.user.id);
        
        if (error) {
          console.log('Error unsubscribing from capacity alerts:', error);
          setCapacityAlertsEnabled(true);
        }
      }
    } finally {
      setCapacityLoading(false);
    }
  };

  const handleToggle = async (value: boolean) => {
    setToggleValue(value);
    setLoading(true);
    try {
      if (value) {
        // Check if permission was previously denied on iOS
        const { status } = await Notifications.getPermissionsAsync();
        if (status === 'denied' && Platform.OS === 'ios') {
          Linking.openSettings();
          setToggleValue(false);
        } else {
          await requestPermission();
        }
      } else {
        // Clear token from profile
        if (session?.user.id) {
          await supabase
            .from('profiles')
            .update({ push_notification_token: null })
            .eq('id', session.user.id);
        }
        setToggleValue(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#1d4681', '#3183bf']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color="white" size={24} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Status Section */}
        <View style={styles.section}>
          <View style={styles.statusCard}>
            <View style={styles.statusIconContainer}>
              {isEnabled ? (
                <Bell color="#22C55E" size={28} strokeWidth={2} />
              ) : (
                <BellOff color="#F59E0B" size={28} strokeWidth={2} />
              )}
            </View>
            <Text style={styles.statusTitle}>
              {isEnabled ? 'Notifications are enabled' : 'Notifications are off'}
            </Text>
            <Text style={styles.statusSubtitle}>
              {isEnabled
                ? 'You will receive prayer times, program updates, and event reminders.'
                : 'Enable notifications to stay updated with prayer times, programs, and events.'}
            </Text>
          </View>
        </View>

        {/* Toggle Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PREFERENCES</Text>
          <View style={styles.menuCard}>
            <View style={styles.toggleRow}>
              <Bell color="white" size={20} strokeWidth={2.5} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabelText}>Push Notifications</Text>
              </View>
              <Switch
                value={toggleValue}
                onValueChange={handleToggle}
                disabled={loading}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#22C55E' }}
                thumbColor="white"
                ios_backgroundColor="rgba(255,255,255,0.2)"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.toggleRow}>
              <Users color="white" size={20} strokeWidth={2.5} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabelText}>Capacity Alerts</Text>
                <Text style={styles.toggleSubtext}>
                  Get notified when prayers are filling up or full
                </Text>
              </View>
              <Switch
                value={capacityAlertsEnabled}
                onValueChange={handleCapacityAlertsToggle}
                disabled={capacityLoading || !isEnabled}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#22C55E' }}
                thumbColor="white"
                ios_backgroundColor="rgba(255,255,255,0.2)"
              />
            </View>
          </View>
        </View>

        {/* System Settings */}
        <View style={styles.section}>
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.settingsButton} onPress={() => Linking.openSettings()}>
              <ExternalLink color="white" size={20} strokeWidth={2.5} style={{ marginRight: 12 }} />
              <Text style={styles.settingsButtonText}>Open System Settings</Text>
              <ChevronLeft
                color="rgba(255,255,255,0.5)"
                size={18}
                strokeWidth={2}
                style={{ marginLeft: 'auto', transform: [{ rotate: '180deg' }] }}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ABOUT NOTIFICATIONS</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              MAS Staten Island sends notifications for:
            </Text>
            <Text style={styles.infoBullet}>  Prayer times and athan reminders</Text>
            <Text style={styles.infoBullet}>  Program and class updates</Text>
            <Text style={styles.infoBullet}>  Community event announcements</Text>
            <Text style={styles.infoBullet}>  Jummah & Taraweeh capacity alerts</Text>
            <Text style={[styles.infoText, { marginTop: 12 }]}>
              You can manage specific prayer and program notification preferences from the Notifications section on the Account page.
            </Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: 'white',
    opacity: 0.9,
    marginBottom: 10,
    marginTop: 8,
  },
  statusCard: {
    backgroundColor: 'rgba(160, 170, 190, 0.55)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  statusIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 6,
  },
  statusSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  menuCard: {
    backgroundColor: 'rgba(160, 170, 190, 0.55)',
    borderRadius: 20,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  toggleLabelText: {
    fontSize: 17,
    fontWeight: '600',
    color: 'white',
  },
  toggleSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 16,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingsButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: 'white',
  },
  infoCard: {
    backgroundColor: 'rgba(160, 170, 190, 0.55)',
    borderRadius: 20,
    padding: 20,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 20,
  },
  infoBullet: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 24,
    paddingLeft: 8,
  },
});
