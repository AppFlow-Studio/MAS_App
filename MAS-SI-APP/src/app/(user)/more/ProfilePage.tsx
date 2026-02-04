import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, StatusBar, Platform, Alert, TextInput, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/providers/AuthProvider';
import { supabase } from '@/src/lib/supabase';
import { Profile } from '@/src/types';
import ProfilePictureBottomSheet from '@/src/components/ProfilePictureBottomSheet';
import { Svg, Path } from 'react-native-svg';

export default function ProfilePage() {
  const router = useRouter();
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile>();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
  });
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

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('profiles').update({ push_notification_token: null }).eq('id', session?.user.id);
            await supabase.auth.signOut();
            router.replace('/');
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.functions.invoke('delete-user', {
                body: { user_id: session?.user.id }
              });
              await supabase.auth.signOut();
              router.replace('/');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          }
        }
      ]
    );
  };

  const startEditing = () => {
    setEditedProfile({
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      phone_number: profile?.phone_number || '',
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const saveProfile = async () => {
    if (!session?.user?.id) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: editedProfile.first_name,
          last_name: editedProfile.last_name,
          phone_number: editedProfile.phone_number,
        })
        .eq('id', session.user.id);
      
      if (error) throw error;
      
      setProfile(prev => prev ? {
        ...prev,
        first_name: editedProfile.first_name,
        last_name: editedProfile.last_name,
        phone_number: editedProfile.phone_number,
      } : prev);
      
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const getMemberSinceDate = () => {
    if (profile?.created_at) {
      const date = new Date(profile.created_at);
      const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      const year = date.getFullYear();
      return `${month} ${year}`;
    }
    return 'N/A';
  };

  // Custom Mosque Icon - dome with crescent
  const MosqueIcon = ({ size = 20, color = "#0E519F" }: { size?: number; color?: string }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Dome */}
      <Path
        d="M12 3C8 3 5 7 5 11V13H19V11C19 7 16 3 12 3Z"
        fill={color}
      />
      {/* Base/Building */}
      <Path
        d="M3 13H21V21H3V13Z"
        fill={color}
      />
      {/* Door */}
      <Path
        d="M10 16H14V21H10V16Z"
        fill="white"
      />
      {/* Crescent on top */}
      <Path
        d="M12 1C11 1 10.2 1.8 10.2 2.8C10.2 3.8 11 4.6 12 4.6C12.4 4.6 12.7 4.4 12.9 4.2C12.6 4.4 12.2 4.5 11.8 4.5C10.9 4.5 10.2 3.7 10.2 2.8C10.2 1.9 10.9 1.2 11.8 1.2C12.2 1.2 12.6 1.3 12.9 1.5C12.7 1.2 12.4 1 12 1Z"
        fill={color}
      />
    </Svg>
  );

  const InfoRow = ({ iconName, label, value, customIcon }: { iconName?: string; label: string; value: string; customIcon?: React.ReactNode }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoIconContainer}>
        {customIcon ? customIcon : <Ionicons name={iconName as any} size={20} color="#0E519F" />}
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'Not set'}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 36 }} />
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={22} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Name */}
        <Text style={styles.profileName}>
          {profile?.first_name && profile?.last_name 
            ? `${profile.first_name} ${profile.last_name}`
            : profile?.first_name || 'User'}
        </Text>

        {/* Profile Picture Section */}
        <View style={styles.profilePicSection}>
          <TouchableOpacity 
            onPress={() => profilePictureSheetRef.current?.present()}
            activeOpacity={0.8}
            style={styles.profilePicWrapper}
          >
            <View style={styles.profilePicContainer}>
              {profile?.profile_pic ? (
                <Image 
                  source={{ uri: profile.profile_pic }} 
                  style={styles.profilePic}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.profilePicPlaceholder}>
                  <Ionicons name="person" size={44} color="#9ca3af" />
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Joined Badge */}
        <View style={styles.joinedBadge}>
          <View style={styles.joinedIconContainer}>
            <Ionicons name="calendar" size={12} color="#0E519F" />
          </View>
          <Text style={styles.joinedText}>JOINED {getMemberSinceDate()}</Text>
        </View>

        {/* Profile Information Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.infoCardTitle}>Profile Information</Text>
            {!isEditing ? (
              <TouchableOpacity style={styles.editButton} onPress={startEditing}>
                <Ionicons name="pencil" size={14} color="#0E519F" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.editActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={cancelEditing}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {!isEditing ? (
            <>
              <InfoRow 
                iconName="person"
                label="Full Name" 
                value={`${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()} 
              />
              
              <View style={styles.divider} />
              
              <InfoRow 
                iconName="mail"
                label="Email" 
                value={profile?.profile_email || ''} 
              />
              
              <View style={styles.divider} />
              
              <InfoRow 
                iconName="call"
                label="Phone" 
                value={profile?.phone_number || ''} 
              />
              
              <View style={styles.divider} />
              
              <InfoRow 
                label="Mosque" 
                value="MAS Staten Island"
                customIcon={<MosqueIcon size={20} color="#0E519F" />}
              />
            </>
          ) : (
            <>
              <View style={styles.editRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="person" size={20} color="#0E519F" />
                </View>
                <View style={styles.editInputContainer}>
                  <Text style={styles.infoLabel}>First Name</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editedProfile.first_name}
                    onChangeText={(text) => setEditedProfile(prev => ({ ...prev, first_name: text }))}
                    placeholder="First name"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.editRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="person" size={20} color="#0E519F" />
                </View>
                <View style={styles.editInputContainer}>
                  <Text style={styles.infoLabel}>Last Name</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editedProfile.last_name}
                    onChangeText={(text) => setEditedProfile(prev => ({ ...prev, last_name: text }))}
                    placeholder="Last name"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.editRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="mail" size={20} color="#0E519F" />
                </View>
                <View style={styles.editInputContainer}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValueDisabled}>{profile?.profile_email || 'Not set'}</Text>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.editRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="call" size={20} color="#0E519F" />
                </View>
                <View style={styles.editInputContainer}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editedProfile.phone_number}
                    onChangeText={(text) => setEditedProfile(prev => ({ ...prev, phone_number: text }))}
                    placeholder="Phone number"
                    placeholderTextColor="#9ca3af"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            </>
          )}
        </View>

        {/* Account Actions */}
        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.actionRow} onPress={handleSignOut}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="log-out" size={18} color="#0E519F" />
            </View>
            <Text style={styles.actionText}>Sign Out</Text>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.actionRow} onPress={handleDeleteAccount}>
            <View style={[styles.actionIconContainer, styles.deleteIconContainer]}>
              <Ionicons name="trash" size={18} color="#dc2626" />
            </View>
            <Text style={styles.deleteActionText}>Delete Account</Text>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Profile Picture Bottom Sheet */}
      <ProfilePictureBottomSheet 
        ref={profilePictureSheetRef}
        currentProfilePic={profile?.profile_pic}
        onProfilePicUpdated={handleProfilePicUpdated}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
    alignItems: 'center',
  },
  profileName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  profilePicSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profilePicWrapper: {
    position: 'relative',
  },
  profilePicContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#ffffff',
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
    backgroundColor: '#f3f4f6',
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingVertical: 4,
    paddingLeft: 4,
    paddingRight: 10,
    borderRadius: 16,
    gap: 6,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  joinedIconContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(14, 81, 159, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1f2937',
    letterSpacing: 0.3,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 81, 159, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 4,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0E519F',
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  saveButton: {
    backgroundColor: '#0E519F',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  editInputContainer: {
    flex: 1,
  },
  editInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    paddingVertical: 4,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  infoValueDisabled: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(14, 81, 159, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 2,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginLeft: 58,
  },
  accountTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(14, 81, 159, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginTop: 4,
  },
  adminBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
  },
  accountTypeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E519F',
    textTransform: 'capitalize',
  },
  adminText: {
    color: '#b45309',
  },
  actionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 8,
    marginBottom: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(14, 81, 159, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deleteIconContainer: {
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  deleteActionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#dc2626',
  },
});

