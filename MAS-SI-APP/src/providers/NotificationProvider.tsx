import { registerForPushNotificationsAsync } from '../lib/notifications';
import { ExpoPushToken } from 'expo-notifications';
import { PropsWithChildren, createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { Alert, Platform, Linking } from 'react-native';
import { Session } from '@supabase/supabase-js';

export type PrayerNotificationTemplateProp = {
  prayer_name: string;
  hour: number;
  minute: number;
  body: string;
  title: string;
};

export type ProgramNotificationTemplate = {
  program_name: string;
  hour: number;
  minute: number;
  body: string;
  title: string;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type NotificationContextType = {
  isEnabled: boolean;
  pushToken: string | null;
  requestPermission: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType>({
  isEnabled: false,
  pushToken: null,
  requestPermission: async () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }: PropsWithChildren) => {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const { session } = useAuth();
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification>();
  const notificationListener = useRef<Notifications.EventSubscription>(null);
  const responseListener = useRef<Notifications.EventSubscription>(null);

  const savePushToken = async (newToken: string | undefined) => {
    if (!newToken) {
      setPushToken(null);
      setIsEnabled(false);
      return;
    }
    setPushToken(newToken);
    if (session?.user.id) {
      await supabase
        .from('profiles')
        .update({ push_notification_token: null })
        .eq('push_notification_token', newToken)
        .neq('id', session.user.id);

      const { error } = await supabase
        .from('profiles')
        .update({ push_notification_token: newToken })
        .eq('id', session.user.id);
      if (error) {
        Alert.alert(error.message);
        setIsEnabled(false);
      } else {
        setIsEnabled(true);
      }
    } else {
      setIsEnabled(false);
    }
  };

  const clearPushToken = async () => {
    if (session?.user.id) {
      await supabase
        .from('profiles')
        .update({ push_notification_token: null })
        .eq('id', session.user.id);
    }
    setPushToken(null);
    setIsEnabled(false);
  };

  const deleteOldPushToken = async () => {
    if (currentSession?.user.id) {
      await supabase
        .from('profiles')
        .update({ push_notification_token: null })
        .eq('id', currentSession.user.id);
    }
  };

  const deleteGuestAcc = async () => {
    if (currentSession?.user.id) {
      await supabase.functions.invoke('delete-user', {
        body: { user_id: currentSession.user.id },
      });
    }
  };

  const requestPermission = useCallback(async () => {
    if (!session?.user.id) return;

    // Check current permission status first
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    if (existingStatus === 'denied') {
      // iOS won't re-prompt after denial, so open system settings
      if (Platform.OS === 'ios') {
        Alert.alert(
          'Notifications Disabled',
          'You previously denied notification permissions. Please enable them in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }
    }

    const token = await registerForPushNotificationsAsync();
    if (token) {
      await savePushToken(token);
    } else {
      setIsEnabled(false);
    }
  }, [session?.user.id]);

  // Check initial permission status and recover missing tokens
  useEffect(() => {
    const checkPermissionAndRecoverToken = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        setIsEnabled(false);
        return;
      }

      // If permissions are granted and user is logged in, check if their profile is missing a token
      if (session?.user.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('push_notification_token')
          .eq('id', session.user.id)
          .single();

        if (profile && !profile.push_notification_token) {
          // User has granted permissions but has no token stored — recover it
          const token = await registerForPushNotificationsAsync();
          if (token) {
            await savePushToken(token);
          }
        }
      }
    };
    checkPermissionAndRecoverToken();
  }, [session?.user.id]);

  useEffect(() => {
    if (session) {
      registerForPushNotificationsAsync().then((token: any) => savePushToken(token));

      if (session.user.id !== currentSession?.user.id && currentSession != null) {
        deleteOldPushToken();
        if (currentSession.user.is_anonymous) {
          deleteGuestAcc();
        }
      }

      notificationListener.current = Notifications.addNotificationReceivedListener(
        (notification) => {
          setNotification(notification);
        }
      );

      responseListener.current = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          console.log('response', response);
        }
      );

      setCurrentSession(session);

      return () => {
        if (notificationListener.current) {
          notificationListener.current.remove();
        }
        if (responseListener.current) {
          responseListener.current.remove();
        }
      };
    }
  }, [session]);

  return (
    <NotificationContext.Provider value={{ isEnabled, pushToken, requestPermission }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
