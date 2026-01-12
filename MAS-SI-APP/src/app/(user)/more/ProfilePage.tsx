import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, StatusBar, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  Phone,
  Camera,
  Edit3
} from 'lucide-react-native';
import { useAuth } from '@/src/providers/AuthProvider';
import { supabase } from '@/src/lib/supabase';
import { Profile } from '@/src/types';
import ProfilePictureBottomSheet from '@/src/components/ProfilePictureBottomSheet';

export default function ProfilePage() {
  const router = useRouter();
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile>();
  const [isLoading, setIsLoading] = useState(true);
  const profilePictureSheetRef = useRef<{ present: () => void; dismiss: () => void }>(null);

  const getProfile = async () => {
    if (!session?.user?.id) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (data) {
      setProfile(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    getProfile();
  }, [session]);

  const handleProfilePicUpdated = (newUrl: string | null) => {
    setProfile(prev => prev ? { ...prev, profile_pic: newUrl || undefined } : prev);
  };

  const getMemberSinceDate = () => {
    if (profile?.created_at) {
      const date = new Date(profile.created_at);
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
    }
    return 'N/A';
  };

  const InfoRow = ({ icon: IconComponent, label, value }: { icon: any; label: string; value: string }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoIconContainer}>
        <IconComponent color="#0E519F" size={20} strokeWidth={2} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'Not set'}</Text>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={['#87CEEB', '#214E91', '#2A2A2A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft color="#ffffff" size={24} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Picture Section */}
        <View style={styles.profilePicSection}>
          <TouchableOpacity 
            onPress={() => profilePictureSheetRef.current?.present()}
            activeOpacity={0.8}
            style={styles.profilePicContainer}
          >
            {profile?.profile_pic ? (
              <Image 
                source={{ uri: profile.profile_pic }} 
                style={styles.profilePic}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.profilePicPlaceholder}
              >
                <User color="#ffffff" size={60} strokeWidth={1.5} />
              </LinearGradient>
            )}
            
            {/* Camera Edit Badge */}
            <View style={styles.editBadge}>
              <Camera color="#ffffff" size={16} strokeWidth={2.5} />
            </View>
          </TouchableOpacity>

          {/* Name */}
          <Text style={styles.profileName}>
            {profile?.first_name && profile?.last_name 
              ? `${profile.first_name} ${profile.last_name}`
              : profile?.first_name || 'User'}
          </Text>
          
          {/* Edit Photo Button */}
          <TouchableOpacity 
            onPress={() => profilePictureSheetRef.current?.present()}
            style={styles.editPhotoButton}
          >
            <Edit3 color="#0E519F" size={16} strokeWidth={2} />
            <Text style={styles.editPhotoText}>Edit Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Information Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Profile Information</Text>
          
          <InfoRow 
            icon={User} 
            label="Full Name" 
            value={`${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()} 
          />
          
          <View style={styles.divider} />
          
          <InfoRow 
            icon={Mail} 
            label="Email" 
            value={profile?.profile_email || ''} 
          />
          
          <View style={styles.divider} />
          
          <InfoRow 
            icon={Phone} 
            label="Phone Number" 
            value={profile?.phone_number || ''} 
          />
          
          <View style={styles.divider} />
          
          <InfoRow 
            icon={Calendar} 
            label="Member Since" 
            value={getMemberSinceDate()} 
          />
        </View>

        {/* Account Type Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Account</Text>
          
          <View style={styles.accountTypeRow}>
            <View style={[
              styles.accountTypeBadge,
              profile?.role === 'ADMIN' && styles.adminBadge
            ]}>
              <Text style={[
                styles.accountTypeText,
                profile?.role === 'ADMIN' && styles.adminText
              ]}>
                {profile?.role || 'USER'}
              </Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Profile Picture Bottom Sheet */}
      <ProfilePictureBottomSheet 
        ref={profilePictureSheetRef}
        currentProfilePic={profile?.profile_pic}
        onProfilePicUpdated={handleProfilePicUpdated}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  profilePicSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  profilePicContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    backgroundColor: 'rgba(160, 170, 190, 0.5)',
  },
  profilePic: {
    width: '100%',
    height: '100%',
  },
  profilePicPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0E519F',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  profileName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  editPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editPhotoText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0E519F',
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(14, 81, 159, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginLeft: 58,
  },
  accountTypeRow: {
    paddingVertical: 8,
  },
  accountTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(14, 81, 159, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  adminBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
  },
  accountTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0E519F',
  },
  adminText: {
    color: '#b45309',
  },
});

