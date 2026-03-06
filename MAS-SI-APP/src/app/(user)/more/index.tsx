import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Share, Platform, Linking, StatusBar, Image, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Link } from 'expo-router';
import {
  UserPlus,
  LogOut,
  Bookmark,
  ListVideo,
  Bell,
  Calendar,
  PartyPopper,
  Settings,
  Heart,
  Eye,
  Sparkles,
  Target,
  ChevronRight,
  Star,
  MessageSquare,
  User,
  Store,
  Briefcase,
  Camera,
  CreditCard,
  Receipt
} from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/src/providers/AuthProvider';
import { supabase } from '@/src/lib/supabase';
import { Profile } from '@/src/types';
import { useProfile, usePreferencesCompleted } from '@/src/hooks/useProfile';
import { queryKeys } from '@/src/lib/queryKeys';
import SignInAnonModal from '@/src/components/SignInAnonModal';
import { useOnboarding } from '@/src/providers/OnboardingProvider';
import ProfilePictureBottomSheet from '@/src/components/ProfilePictureBottomSheet';
import { useNotifications } from '@/src/providers/NotificationProvider';
import { PersonalizedAccount } from '@/src/components/PersonalizedAccount';
import * as WebBrowser from 'expo-web-browser';
import DonationBottomSheet, { DonationBottomSheetRef } from '@/src/components/DonationBottomSheet';
import FeedbackBottomSheet, { FeedbackBottomSheetRef } from '@/src/components/FeedbackBottomSheet';

// const Index = () => {
//   const router = useRouter();
//   const { session } = useAuth();
//   const { isOnboardingIncomplete, showOnboardingSheet } = useOnboarding();
//   const [profile, setProfile] = useState<Profile>();
//   const [visible, setVisible] = useState(false);
//   const [anonStatus, setAnonStatus] = useState(true);
//   const [preferencesCompleted, setPreferencesCompleted] = useState(true);

//   const getProfile = async () => {
//     const { data, error } = await supabase.from('profiles').select('*').eq('id', session?.user.id).single();
//     if (data) {
//       setProfile(data);
//       // Check if user has completed personalization preferences
//       // If interests array is empty or null, preferences are not completed
//       const hasCompletedPreferences = data.interests && data.interests.length > 0;
//       setPreferencesCompleted(hasCompletedPreferences);
//     }
//   };

//   const checkIfAnon = async () => {
//     if (session?.user.is_anonymous) {
//       setAnonStatus(true);
//     } else {
//       setAnonStatus(false);
//     }
//   };

export default function MoreScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const { data: profile, refetch: refetchProfile, isRefetching: isProfileRefetching } = useProfile(session?.user?.id);
  const { data: preferencesCompleted = true, refetch: refetchPreferences, isRefetching: isPrefsRefetching } = usePreferencesCompleted(session?.user?.id);
  const anonStatus = !!session?.user?.is_anonymous;
  const [signInModalVisible, setSignInModalVisible] = useState(false);
  const { isOnboardingIncomplete, setOnboardingIncomplete, onboardingSheetRef } = useOnboarding();
  const [visible, setVisible] = useState(false);
  const [guestAuthModalVisible, setGuestAuthModalVisible] = useState(false);
  const profilePictureSheetRef = useRef<{ present: () => void; dismiss: () => void }>(null);
  const donationSheetRef = useRef<DonationBottomSheetRef>(null);
  const feedbackSheetRef = useRef<FeedbackBottomSheetRef>(null);
  const { isEnabled: notificationsEnabled } = useNotifications();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const isRefreshing = isProfileRefetching || isPrefsRefetching;

  const onRefresh = useCallback(() => {
    refetchProfile();
    refetchPreferences();
  }, [refetchProfile, refetchPreferences]);

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    setOnboardingIncomplete(false);
    refetchProfile();
    refetchPreferences();
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    setOnboardingIncomplete(true);
  };

  const showOnboardingSheet = () => {
    setShowOnboarding(true);
    setTimeout(() => {
      onboardingSheetRef.current?.present();
    }, 100);
  };

  const handleProfilePicUpdated = (newUrl: string | null) => {
    if (session?.user?.id) {
      queryClient.setQueryData(
        queryKeys.profile.detail(session.user.id),
        (old: Profile | undefined) => old ? { ...old, profile_pic: newUrl || undefined } : old
      );
    }
  };

  // Show guest auth modal every time anonymous user enters/focuses on this screen
  useFocusEffect(
    useCallback(() => {
      if (session?.user.is_anonymous) {
        setGuestAuthModalVisible(true);
      } else {
        setGuestAuthModalVisible(false);
      }
    }, [session])
  );

  const getMemberSinceYear = () => {
    if (profile?.created_at) {
      return new Date(profile.created_at).getFullYear();
    }
    return new Date().getFullYear();
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('profiles').update({ push_notification_token: null }).eq('id', session?.user.id);
            if (session?.user.is_anonymous) {
              await supabase.functions.invoke('delete-user', {
                body: { user_id: session.user.id }
              });
            }
            await supabase.auth.signOut();
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleInviteFriends = async () => {
    const appStoreUrl = 'https://apps.apple.com/us/app/mas-si/id6683310989';
    
    try {
      await Share.share({
        message: Platform.OS === 'android' 
          ? `🕌 Join me at MAS Staten Island! Download the app to stay connected with our community, prayer times, events, and more!\n\n${appStoreUrl}`
          : '🕌 Join me at MAS Staten Island! Download the app to stay connected with our community, prayer times, events, and more!',
        url: Platform.OS === 'ios' ? appStoreUrl : undefined,
        title: 'Download MAS Staten Island App'
      });
    } catch (error) {
      console.error(error);
    }
  };

  const MenuButton = ({ icon: IconComponent, label, onPress }: { icon: any; label: string; onPress?: () => void }) => (
    <TouchableOpacity 
      style={styles.menuButton} 
      onPress={onPress}
      activeOpacity={0.6}
      delayPressIn={0}
    >
      <IconComponent color="white" size={20} strokeWidth={2.5} style={{ marginRight: 12 }} />
      <Text style={styles.menuButtonText}>{label}</Text>
      <ChevronRight color="rgba(255,255,255,0.5)" size={18} style={{ marginLeft: 'auto' }} />
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#1d4681', '#3183bf']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#ffffff"
            colors={['#ffffff']}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Account</Text>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection} className='w-full flex flex-col items-center justify-center'>
          <View className='flex w-full '>
            {/* Profile Picture - Tappable to edit */}
            <View className='flex flex-row items-center justify-center relative w-fit'>
              <TouchableOpacity 
                onPress={() => !anonStatus && profilePictureSheetRef.current?.present()}
                activeOpacity={anonStatus ? 1 : 0.8}
                style={styles.avatarContainer}
              >
                {profile?.profile_pic ? (
                  <Image 
                    source={{ uri: profile.profile_pic }} 
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <User color="#ffffff" size={40} strokeWidth={1.5} />
                )}
              </TouchableOpacity>
              
              {/* Camera badge for non-anonymous users */}
              {!anonStatus && (
                <TouchableOpacity 
                  onPress={() => profilePictureSheetRef.current?.present()}
                  style={styles.cameraBadge}
                >
                  <Camera color="#ffffff" size={12} strokeWidth={2.5} />
                </TouchableOpacity>
              )}
              
            </View>

            <Text style={styles.profileName} className=' text-center'>
              {anonStatus
                ? 'Guest Account'
                : `${profile?.first_name || ''}${profile?.last_name ? ' ' + profile.last_name : ''}`.trim() || 'User'}
            </Text>
            <Text style={styles.memberSince} className='text-center' >Member Since {getMemberSinceYear()}</Text>

            {/* Invite Friends Button */}
            {/* {!anonStatus && (
              <View style={styles.inviteButtonContainer}>
                <TouchableOpacity style={styles.inviteButton} onPress={handleInviteFriends}>
                  <UserPlus color="white" size={20} strokeWidth={2.5} style={{ marginRight: 8 }} />
                  <Text style={styles.inviteButtonText}>Invite Friends</Text>
                </TouchableOpacity>
              </View>
            )} */}

            {/* Sign In & Sign Up Buttons for Anonymous Users */}
            {anonStatus ? (
              <View style={styles.guestAuthContainer}>
                {/* Large Sign Up Button */}
                <TouchableOpacity 
                  style={styles.signUpButton} 
                  onPress={() => router.push('/(auth)/SignUp')}
                >
                  <Text style={styles.signUpButtonText}>Sign Up</Text>
                </TouchableOpacity>
                
                {/* Sign In Link */}
                <TouchableOpacity onPress={() => setVisible(true)}>
                  <Text style={styles.signInLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* {!anonStatus && profile?.profile_email && (
              <Text style={styles.memberEmail}>{profile.profile_email}</Text>
            )} */}
            {/* <Text style={styles.memberSince}>Member Since 2025</Text> */}

            {/* Invite Friends Button */}
            {!anonStatus && (
              <View style={styles.inviteButtonContainer}>
                <TouchableOpacity style={styles.inviteButton} onPress={handleInviteFriends}>
                  <UserPlus color="white" size={20} strokeWidth={2.5} style={{ marginRight: 8 }} />
                  <Text style={styles.inviteButtonText}>Invite Friends</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Setup Cards - Profile & Preferences */}
          {!anonStatus && (isOnboardingIncomplete || !preferencesCompleted) && (
            <View style={{ paddingTop: 8, width: '100%' }}>
              {isOnboardingIncomplete && preferencesCompleted ? (
                <TouchableOpacity 
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(160, 170, 190, 0.55)',
                    borderRadius: 999,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    position: 'relative',
                  }}
                  onPress={() => showOnboardingSheet()}
                >
                  <View style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 10,
                  }}>
                    <User color="#ffffff" size={14} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ color: 'white', fontWeight: '700', fontSize: 17 }}>Complete Profile</Text>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 13, marginLeft: 8 }}>Phone & details</Text>
                  </View>
                  <View style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: '#EF4444',
                  }} />
                </TouchableOpacity>
              ) : !isOnboardingIncomplete && !preferencesCompleted ? (
                <TouchableOpacity 
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(160, 170, 190, 0.55)',
                    borderRadius: 20,
                    paddingVertical: 18,
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    position: 'relative',
                  }}
                  onPress={() => router.push('/more/PreferencesOnboarding')}
                >
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 14,
                  }}>
                    <Sparkles color="#ffffff" size={24} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: 'white', fontWeight: '700', fontSize: 17 }}>Personalize Experience</Text>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 14, marginTop: 3 }}>Interests & times</Text>
                  </View>
                  <View style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: '#EF4444',
                  }} />
                </TouchableOpacity>
              ) : (
                <View style={styles.setupCardsRow}>
                  {isOnboardingIncomplete && (
                    <TouchableOpacity
                      style={styles.setupCard}
                      onPress={() => showOnboardingSheet()}
                    >
                      <View style={styles.setupCardIcon}>
                        <User color="#ffffff" size={20} strokeWidth={2} />
                      </View>
                      <View style={styles.setupCardBadge} />
                      <Text style={styles.setupCardTitle}>
                        Complete Profile
                      </Text>
                      <Text style={styles.setupCardSubtitle}>
                        Phone & details
                      </Text>
                    </TouchableOpacity>
                  )}

                  {!preferencesCompleted && (
                    <TouchableOpacity
                      style={styles.setupCard}
                      onPress={() => router.push('/more/PreferencesOnboarding')}
                    >
                      <View style={styles.setupCardIcon}>
                        <Sparkles color="#ffffff" size={20} strokeWidth={2} />
                      </View>
                      <View style={styles.setupCardBadge} />
                      <Text style={styles.setupCardTitle}>
                        Personalize
                      </Text>
                      <Text style={styles.setupCardSubtitle}>
                        Interests & times
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}
        </View>


        {/* Content Sections */}
        <View style={styles.contentSections}>

          {/* MY ACTIVITY */}
          {/* <Text style={styles.sectionLabel}>MY ACTIVITY</Text>
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuButton}>
              <Bookmark color="white" size={20} strokeWidth={2.5} style={{ marginRight: 12 }} />
              <Text style={styles.menuButtonText}>Saved Programs/Events</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton}>
              <ListVideo color="white" size={20} strokeWidth={2.5} style={{ marginRight: 12 }} />
              <Text style={styles.menuButtonText}>Playlist</Text>
            </TouchableOpacity>
          </View> */}

          {/* NOTIFICATIONS */}
          {/* <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
          <View style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => {
                router.push({
                  pathname: '/myPrograms/notifications/NotificationEvents',
                  params: { initialTab: 'prayer' }
                });
              }}
            >
              <Bell color="white" size={20} strokeWidth={2.5} style={{ marginRight: 12 }} />
              <Text style={styles.menuButtonText}>Prayer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => {
                router.push({
                  pathname: '/myPrograms/notifications/NotificationEvents',
                  params: { initialTab: 'programs' }
                });
              }}
            >
              <Calendar color="white" size={20} strokeWidth={2.5} style={{ marginRight: 12 }} />
              <Text style={styles.menuButtonText}>Program</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => {
                router.push({
                  pathname: '/myPrograms/notifications/NotificationEvents',
                  params: { initialTab: 'programs' }
                });
              }}
            >
              <PartyPopper color="white" size={20} strokeWidth={2.5} style={{ marginRight: 12 }} />
              <Text style={styles.menuButtonText}>Event</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => {
                Linking.openSettings();
              }}
            >
              <Settings color="white" size={20} strokeWidth={2.5} style={{ marginRight: 12 }} />
              <Text style={styles.menuButtonText}>Setting</Text>
            </TouchableOpacity>
          </View> */}

          {/* DONATION */}
          {/* <Text style={styles.sectionLabel}>DONATION</Text>
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuButton}>
              <Heart color="white" size={20} strokeWidth={2.5} style={{ marginRight: 12 }} />
              <Text style={styles.menuButtonText}>Phase 1</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton}>
              <Heart color="white" size={20} strokeWidth={2.5} style={{ marginRight: 12 }} />
              <Text style={styles.menuButtonText}>Phase 2</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton}>
              <Eye color="white" size={20} strokeWidth={2.5} style={{ marginRight: 12 }} />
              <Text style={styles.menuButtonText}>View Full Project</Text>
            </TouchableOpacity>
          </View> */}

          {/* Admin Panel - Only show for ADMIN users */}
          {/* Content Sections */}
          {/* <View style={styles.contentSections}> */}

          {/* MY ACTIVITY */}
          <Text style={styles.sectionLabel}>MY ACTIVITY</Text>
              <View style={styles.menuCard}>
                <MenuButton icon={Bookmark} label="Saved Programs/Events" onPress={() => router.push('/myPrograms')} />
                <MenuButton icon={ListVideo} label="Playlist" onPress={() => router.push('/myPrograms/PlaylistIndex')} />
              </View>

          {/* NOTIFICATIONS */}
          <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
              {!anonStatus && !notificationsEnabled && (
                <TouchableOpacity
                  style={styles.notificationBanner}
                  onPress={() => router.push('/more/NotificationSettings')}
                >
                  <Bell color="white" size={16} strokeWidth={2.5} style={{ marginRight: 8 }} />
                  <Text style={styles.notificationBannerText}>
                    Notifications are off — tap to enable
                  </Text>
                  <ChevronRight color="#92400E" size={16} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
              )}
              <View style={styles.menuCard}>
                <MenuButton 
                  icon={Bell} 
                  label="Prayer" 
                  onPress={() => router.push({ pathname: '/more/NotificationCenter', params: { initialTab: 'prayer' } })}
                />
                <MenuButton
                  icon={Calendar}
                  label="Program"
                  onPress={() => router.push({ pathname: '/more/NotificationCenter', params: { initialTab: 'programs' } })}
                />
                <MenuButton 
                  icon={PartyPopper} 
                  label="Event" 
                  onPress={() => router.push({ pathname: '/more/NotificationCenter', params: { initialTab: 'programs' } })}
                />
                <MenuButton icon={Settings} label="Settings" onPress={() => router.push('/more/NotificationSettings')} />
              </View>

          {/* DONATION */}
              <View style={styles.notificationBanner}>
                <Heart color="#FDE68A" size={16} strokeWidth={2.5} style={{ marginRight: 8 }} />
                <Text style={[styles.notificationBannerText, { flex: 1 }]}>
                  All Payments/Donations that are made in or outside of the app are given to MAS Staten Island
                </Text>
              </View>
          <Text style={styles.sectionLabel}>DONATION</Text>
              <View style={styles.menuCard}>
                <MenuButton icon={Heart} label="Phase 2" onPress={() => donationSheetRef.current?.open()} />
                <MenuButton icon={Receipt} label="Payment History" onPress={() => router.push('/more/PaymentHistory')} />
                <MenuButton icon={CreditCard} label="Payment Methods" onPress={() => router.push('/more/PaymentMethods')} />
              </View>

          {/* MAS SHOP */}
          <Text style={styles.sectionLabel}>MAS SHOP</Text>
          <View style={styles.menuCard}>
            <MenuButton icon={Store} label="Programs/Events" onPress={() => WebBrowser.openBrowserAsync('https://massic.shop')} />
          </View>

          {/* BUSINESS ADS */}
          <Text style={styles.sectionLabel}>BUSINESS ADS</Text>
          <View style={styles.menuCard}>
            <MenuButton icon={Briefcase} label="Start an Application" onPress={() => router.push('/more/BusinessAds')} />
            <MenuButton icon={Eye} label="Check the Status" onPress={() => router.push('/more/BusinessStatus')} />
            <MenuButton icon={CreditCard} label="Manage Subscriptions" onPress={() => router.push('/more/BusinessSubscriptions')} />
          </View>

          {/* EDIT PROFILE */}
          <Text style={styles.sectionLabel}>EDIT PROFILE</Text>
          <View style={styles.menuCard}>
            <MenuButton 
              icon={User} 
              label="Profile Page" 
              onPress={() => router.push('/more/ProfilePage')}
            />
            <MenuButton 
              icon={Sparkles} 
              label="Personalize Preferences" 
              onPress={() => router.push('/more/PreferencesOnboarding')} 
            />
          </View>

          {/* LEAVE A COMMENT */}
          <Text style={styles.sectionLabel}>LEAVE A COMMENT</Text>
          <View style={styles.menuCard}>
            <MenuButton icon={MessageSquare} label="Send Feedback" onPress={() => feedbackSheetRef.current?.open()} />
          </View>

          {/* Admin Panel - Only show for admins */}
          {profile?.role === 'ADMIN' && (
            <>
              <Text style={styles.sectionLabel}>ADMIN</Text>
              <View style={styles.menuCard}>
                <Link href="/more/Admin/AdminScreen" asChild>
                  <TouchableOpacity style={styles.menuButton}>
                    <Settings color="white" size={20} strokeWidth={2.5} style={{ marginRight: 12 }} />
                    <Text style={styles.menuButtonText}>Admin Panel</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </>
          )}

          {/* Logout Button */}
          {!anonStatus && (
            <View style={styles.logoutButtonContainer}>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <LogOut color="white" size={20} strokeWidth={2.5} style={{ marginRight: 8 }} />
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          )}
          {/* </View> */}
        </View>
      </ScrollView>

      <SignInAnonModal 
        visible={visible} 
        setVisible={() => setVisible(false)} 
        onDismiss={() => router.push('/menu')}
        onContinueAsGuest={() => {
          router.push('/menu');
        }}
      />
      
      {/* Guest Auth Modal - blocks access for anonymous users */}
      <SignInAnonModal 
        visible={guestAuthModalVisible} 
        setVisible={() => setGuestAuthModalVisible(false)}
        dismissable={true}
        showLanding={true}
        onSignUpPress={() => {
          setGuestAuthModalVisible(false);
          router.push('/(auth)/SignUp');
        }}
        onContinueAsGuest={() => {
          router.push('/menu');
        }}
        onDismiss={() => {
          router.push('/menu');
        }}
      />

      {/* Profile Picture Bottom Sheet */}
      <ProfilePictureBottomSheet 
        ref={profilePictureSheetRef}
        currentProfilePic={profile?.profile_pic}
        onProfilePicUpdated={handleProfilePicUpdated}
      />

      {/* Complete Profile Bottom Sheet */}
      {(showOnboarding || isOnboardingIncomplete) && (
        <PersonalizedAccount
          ref={onboardingSheetRef}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}

      {/* Donation Bottom Sheet */}
      <DonationBottomSheet ref={donationSheetRef} />

      {/* Feedback Bottom Sheet */}
      <FeedbackBottomSheet ref={feedbackSheetRef} userProfile={profile} />
    </LinearGradient>
  );
};

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     width: '100%',
//   },
//   scrollView: {
//     flex: 1,
//   },
//   scrollContent: {
//     paddingBottom: 100,
//   },
//   header: {
//     paddingTop: 60,
//     paddingBottom: 20,
//     paddingHorizontal: 12,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   headerTitle: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: 'white',
//   },
//   profileSection: {
//     alignItems: 'center',
//     paddingHorizontal: 12,
//     paddingBottom: 30,
//   },
//   // avatarContainer: {
//   //   width: 80,
//   //   height: 80,
//   //   borderRadius: 40,
//   //   alignItems: 'center',
//   //   justifyContent: 'center',
//   //   marginBottom: 12,
//   //   overflow: 'hidden',
//   //   backgroundColor: 'rgba(160, 170, 190, 0.5)',
//   // },
//   profileName: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: 'white',
//     marginBottom: 4,
//   },
//   // memberSince: {
//   //   fontSize: 14,
//   //   color: 'white',
//   //   opacity: 0.9,
//   //   marginBottom: 12,
//   // },
//   authButtonsRow: {
//     flexDirection: 'row',
//     width: '100%',
//   },
//   // inviteButtonContainer: {
//   //   width: '100%',
//   //   borderRadius: 999,
//   //   overflow: 'hidden',
//   //   backgroundColor: 'rgba(160, 170, 190, 0.55)',
//   // },
//   // inviteButton: {
//   //   paddingVertical: 12,
//   //   paddingHorizontal: 16,
//   //   flexDirection: 'row',
//   //   alignItems: 'center',
//   //   justifyContent: 'center',
//   //   backgroundColor: 'transparent',
//   // },
//   // inviteButtonText: {
//   //   color: 'white',
//   //   fontWeight: '700',
//   //   fontSize: 17,
//   // },
//   // contentSections: {
//   //   paddingHorizontal: 12,
//   //   paddingTop: 10,
//   // },
//   // sectionLabel: {
//   //   fontSize: 12,
//   //   fontWeight: '600',
//   //   textTransform: 'uppercase',
//   //   letterSpacing: 1,
//   //   color: 'white',
//   //   opacity: 0.9,
//   //   marginBottom: 10,
//   //   marginTop: 8,
//   // },
//   menuCard: {
//     width: '100%',
//     borderRadius: 20,
//     overflow: 'hidden',
//     marginBottom: 16,
//     backgroundColor: 'rgba(160, 170, 190, 0.55)',
//   },
//   menuButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'flex-start',
//     paddingLeft: 16,
//     paddingVertical: 14,
//     paddingHorizontal: 16,
//     backgroundColor: 'transparent',
//   },
//   menuButtonText: {
//     fontSize: 17,
//     fontWeight: '700',
//     color: 'white',
//   },
//   logoutButtonContainer: {
//     width: '100%',
//     borderRadius: 20,
//     overflow: 'hidden',
//     marginTop: 8,
//     backgroundColor: 'rgba(160, 170, 190, 0.55)',
//   },
//   logoutButton: {
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: 'transparent',
//   },
//   logoutButtonText: {
//     color: 'white',
//     fontWeight: '700',
//     fontSize: 17,
//   },
//   avatarBadge: {
//     position: 'absolute',
//     top: 0,
//     right: 0,
//     width: 24,
//     height: 24,
//     borderRadius: 12,
//     backgroundColor: '#EF4444',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 3,
//     borderColor: '#87CEEB',
//   },
//   avatarBadgeBlue: {
//     backgroundColor: '#0F4184',
//   },
//   avatarBadgeText: {
//     color: '#ffffff',
//     fontSize: 14,
//     fontWeight: '700',
//   },
//   // Setup Cards Styles
//   setupCardsRow: {
//     flexDirection: 'row',
//     gap: 12,
//     marginBottom: 16,
//   },
//   setupCard: {
//     flex: 1,
//     backgroundColor: 'rgba(160, 170, 190, 0.55)',
//     borderRadius: 16,
//     padding: 12,
//     paddingTop: 14,
//     paddingBottom: 12,
//     alignItems: 'center',
//     borderWidth: 0,
//     borderColor: 'transparent',
//     position: 'relative',
//     minHeight: 110,
//   },
//   setupCardIncomplete: {
//     backgroundColor: 'rgba(160, 170, 190, 0.55)',
//     borderColor: 'transparent',
//   },
//   setupCardComplete: {
//     backgroundColor: 'rgba(160, 170, 190, 0.55)',
//     borderColor: 'transparent',
//   },
//   setupCardIcon: {
//     width: 42,
//     height: 42,
//     borderRadius: 21,
//     backgroundColor: 'rgba(255, 255, 255, 0.15)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   setupCardIconIncomplete: {
//     backgroundColor: 'rgba(255, 255, 255, 0.15)',
//   },
//   setupCardIconComplete: {
//     backgroundColor: 'rgba(255, 255, 255, 0.15)',
//   },
//   setupCardBadge: {
//     position: 'absolute',
//     top: 10,
//     right: 10,
//     width: 10,
//     height: 10,
//     borderRadius: 5,
//     backgroundColor: '#EF4444',
//   },
//   setupCardTitle: {
//     color: '#ffffff',
//     fontWeight: '700',
//     fontSize: 13,
//     textAlign: 'center',
//     marginBottom: 2,
//   },
//   setupCardTitleComplete: {
//     color: 'rgba(255, 255, 255, 0.9)',
//   },
//   setupCardSubtitle: {
//     color: 'rgba(255, 255, 255, 0.7)',
//     fontSize: 11,
//     textAlign: 'center',
//   },
//   setupCardSubtitleComplete: {
//     color: 'rgba(255, 255, 255, 0.5)',
//   },
//   checkmarkBadge: {
//     position: 'absolute',
//     top: 8,
//     right: 8,
//     width: 18,
//     height: 18,
//     borderRadius: 9,
//     backgroundColor: 'rgba(255, 255, 255, 0.25)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   memberEmail: {
//     fontSize: 14,
//     color: 'rgba(255, 255, 255, 0.8)',
//     marginBottom: 4,
//   },
//   memberSince: {
//     fontSize: 14,
//     color: 'white',
//     opacity: 0.9,
//     marginBottom: 12,
//   },
//   inviteButtonContainer: {
//     width: '100%',
//     borderRadius: 999,
//     overflow: 'hidden',
//     backgroundColor: 'rgba(160, 170, 190, 0.55)',
//   },
//   inviteButton: {
//     paddingVertical: 14,
//     paddingHorizontal: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: 'transparent',
//   },
//   inviteButtonText: {
//     color: 'white',
//     fontWeight: '700',
//     fontSize: 17,
//   },
//   contentSections: {
//     paddingHorizontal: 16,
//     paddingTop: 10,
//   },
//   sectionLabel: {
//     fontSize: 12,
//     fontWeight: '600',
//     textTransform: 'uppercase',
//     letterSpacing: 1,
//     color: 'white',
//     opacity: 0.9,
//     marginBottom: 10,
//     marginTop: 8,
//   },
//   signInButton: {
//     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 20,
//   },
//   signInButtonText: {
//     color: 'white',
//     fontWeight: '600',
//     fontSize: 14,
//   },
//   avatarContainer: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 12,
//     overflow: 'hidden',
//     backgroundColor: 'rgba(160, 170, 190, 0.5)',
//   },
//   avatarIcon: {
//     fontSize: 40,
//   },
//   logoutButtonSmall: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
// });

{/* <MenuButton
  icon={Star}
  label="Admin Panel"
  onPress={() => router.push('/more/Admin/AdminScreen')}
/>
              </View >
            </>
          )} */}

{/* Logout Button */ }
{/* {
  !anonStatus && (
    <View style={styles.logoutButtonContainer}>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut color="white" size={20} strokeWidth={2.5} style={{ marginRight: 8 }} />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  )
} */}

{/* Footer */ }
{/* <View style={styles.footer}>
  <Text style={styles.footerText}>Created By</Text>
  <Text style={styles.footerBrand}>AppFlow Creations</Text>
  <TouchableOpacity onPress={() => Linking.openURL('mailto:appflowcreations@gmail.com')}>
    <Text style={styles.footerEmail}>appflowcreations@gmail.com</Text>
  </TouchableOpacity>
</View>
        </View >
      </ScrollView > */}

{/* Sign In Modal for Anonymous Users */ }
{/* < SignInAnonModal visible = { signInModalVisible } setVisible = {() => setSignInModalVisible(false)} />
    </LinearGradient >
  );
} */}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  authButtonsRow: {
    flexDirection: 'row',
    width: '100%',
  },
  guestAuthContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  signUpButton: {
    width: '100%',
    backgroundColor: 'rgba(160, 170, 190, 0.55)',
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  signUpButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  signInLink: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  avatarBadge: {
    position: 'absolute',
    top: -5,
    right: "40%",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#87CEEB',
  },
  avatarBadgeBlue: {
    backgroundColor: '#0F4184',
  },
  avatarBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 8,
    right: '35%',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0E519F',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  signInButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  signInButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  logoutButtonSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  //   setupCardsRow: {
  //   flexDirection: 'row',
  //   gap: 12,
  //   marginBottom: 16,
  // },
  setupCard: {
    flex: 1,
    backgroundColor: 'rgba(160, 170, 190, 0.55)',
    borderRadius: 16,
    padding: 12,
    paddingTop: 14,
    paddingBottom: 12,
    alignItems: 'center',
    borderWidth: 0,
    borderColor: 'transparent',
    position: 'relative',
    minHeight: 110,
  },
  setupCardIncomplete: {
    backgroundColor: 'rgba(160, 170, 190, 0.55)',
    borderColor: 'transparent',
  },
  setupCardComplete: {
    backgroundColor: 'rgba(160, 170, 190, 0.55)',
    borderColor: 'transparent',
  },
  setupCardIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  setupCardIconIncomplete: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  setupCardIconComplete: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  setupCardBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  checkmarkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  setupCardTitle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 2,
  },
  setupCardTitleComplete: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  setupCardSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    textAlign: 'center',
  },
  setupCardSubtitleComplete: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  setupCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    width: '100%',
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 5,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(160, 170, 190, 0.5)',
  },
  avatarIcon: {
    fontSize: 40,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    marginBottom: 12,
  },
  inviteButtonContainer: {
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(160, 170, 190, 0.55)',
  },
  inviteButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  inviteButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 17,
  },
  notificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  notificationBannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FDE68A',
  },
  contentSections: {
    paddingHorizontal: 12,
    paddingTop: 10,
    width: '100%',
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
  menuCard: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: 'rgba(160, 170, 190, 0.55)',
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: 'white',
  },
  logoutButtonContainer: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 8,
    backgroundColor: 'rgba(160, 170, 190, 0.55)',
  },
  logoutButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 17,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginBottom: 4,
  },
  footerBrand: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  footerEmail: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
}); 
