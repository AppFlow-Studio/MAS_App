import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ExpoLiquidGlassView, CornerStyle, LiquidGlassType } from 'expo-liquid-glass-view';

interface AccountModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AccountModal({ visible, onClose }: AccountModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={['#5B9FED', '#4A8FDD', '#3B7FCD']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Account</Text>
            <ExpoLiquidGlassView 
              type={LiquidGlassType.Interactive}
              cornerStyle={CornerStyle.Continuous}
              cornerRadius={18}
              style={styles.closeButton}
            >
              <TouchableOpacity style={styles.closeButtonInner} onPress={onClose}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </ExpoLiquidGlassView>
          </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarIcon}>👤</Text>
          </View>
          <Text style={styles.profileName}>Ahmad Hamoudeh</Text>
          <Text style={styles.memberSince}>Member Since 2025</Text>
          
          {/* Invite Friends Button */}
          <ExpoLiquidGlassView 
            type={LiquidGlassType.Interactive}
            cornerStyle={CornerStyle.Continuous}
            cornerRadius={999}
            style={styles.inviteButtonBlur}
          >
            <TouchableOpacity style={styles.inviteButton}>
              <Text style={styles.inviteButtonText}>👥 Invite Friends</Text>
            </TouchableOpacity>
          </ExpoLiquidGlassView>
        </View>

        {/* Content Sections */}
        <View style={styles.contentSections}>
          
          {/* MY ACTIVITY */}
          <Text style={styles.sectionLabel}>MY ACTIVITY</Text>

          <ExpoLiquidGlassView 
            type={LiquidGlassType.Interactive}
            cornerStyle={CornerStyle.Continuous}
            cornerRadius={20}
            style={styles.menuButtonBlur}
          >
            <TouchableOpacity style={styles.menuButton}>
              <Text style={styles.menuButtonText}>Saved Programs/Events</Text>
            </TouchableOpacity>
          </ExpoLiquidGlassView>

          <ExpoLiquidGlassView 
            type={LiquidGlassType.Interactive}
            cornerStyle={CornerStyle.Continuous}
            cornerRadius={20}
            style={styles.menuButtonBlur}
          >
            <TouchableOpacity style={styles.menuButton}>
              <Text style={styles.menuButtonText}>Playlist</Text>
            </TouchableOpacity>
          </ExpoLiquidGlassView>

          {/* NOTIFICATIONS */}
          <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
          
          <ExpoLiquidGlassView 
            type={LiquidGlassType.Interactive}
            cornerStyle={CornerStyle.Continuous}
            cornerRadius={20}
            style={styles.menuButtonBlur}
          >
            <TouchableOpacity style={styles.menuButton}>
              <Text style={styles.menuButtonText}>Prayer</Text>
            </TouchableOpacity>
          </ExpoLiquidGlassView>

          <ExpoLiquidGlassView 
            type={LiquidGlassType.Interactive}
            cornerStyle={CornerStyle.Continuous}
            cornerRadius={20}
            style={styles.menuButtonBlur}
          >
            <TouchableOpacity style={styles.menuButton}>
              <Text style={styles.menuButtonText}>Program</Text>
            </TouchableOpacity>
          </ExpoLiquidGlassView>

          <ExpoLiquidGlassView 
            type={LiquidGlassType.Interactive}
            cornerStyle={CornerStyle.Continuous}
            cornerRadius={20}
            style={styles.menuButtonBlur}
          >
            <TouchableOpacity style={styles.menuButton}>
              <Text style={styles.menuButtonText}>Event</Text>
            </TouchableOpacity>
          </ExpoLiquidGlassView>

          <ExpoLiquidGlassView 
            type={LiquidGlassType.Interactive}
            cornerStyle={CornerStyle.Continuous}
            cornerRadius={20}
            style={styles.menuButtonBlur}
          >
            <TouchableOpacity style={styles.menuButton}>
              <Text style={styles.menuButtonText}>Setting (Pref)</Text>
            </TouchableOpacity>
          </ExpoLiquidGlassView>

          {/* DONATION */}
          <Text style={styles.sectionLabel}>DONATION</Text>
          
          <ExpoLiquidGlassView 
            type={LiquidGlassType.Interactive}
            cornerStyle={CornerStyle.Continuous}
            cornerRadius={20}
            style={styles.menuButtonBlur}
          >
            <TouchableOpacity style={styles.menuButton}>
              <Text style={styles.menuButtonText}>Phase 1</Text>
            </TouchableOpacity>
          </ExpoLiquidGlassView>

          <ExpoLiquidGlassView 
            type={LiquidGlassType.Interactive}
            cornerStyle={CornerStyle.Continuous}
            cornerRadius={20}
            style={styles.menuButtonBlur}
          >
            <TouchableOpacity style={styles.menuButton}>
              <Text style={styles.menuButtonText}>Phase 2</Text>
            </TouchableOpacity>
          </ExpoLiquidGlassView>

          <ExpoLiquidGlassView 
            type={LiquidGlassType.Interactive}
            cornerStyle={CornerStyle.Continuous}
            cornerRadius={20}
            style={styles.menuButtonBlur}
          >
            <TouchableOpacity style={styles.menuButton}>
              <Text style={styles.menuButtonText}>View Full Project</Text>
            </TouchableOpacity>
          </ExpoLiquidGlassView>

          {/* Logout Button */}
          <ExpoLiquidGlassView 
            type={LiquidGlassType.Tint}
            tint="rgba(255, 80, 70, 0.3)"
            cornerStyle={CornerStyle.Continuous}
            cornerRadius={20}
            style={styles.logoutButtonBlur}
          >
            <TouchableOpacity style={styles.logoutButton}>
              <Text style={styles.logoutButtonText}>🚪 Logout</Text>
            </TouchableOpacity>
          </ExpoLiquidGlassView>
        </View>
      </ScrollView>
    </LinearGradient>
    </Modal>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
          paddingTop: 60,
    paddingBottom: 20,
          paddingHorizontal: 20,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
  },
  headerTitle: {
            fontSize: 28, 
            fontWeight: 'bold', 
            color: 'white',
            textShadowColor: 'rgba(0, 0, 0, 0.3)',
            textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  closeButtonInner: {
    flex: 1,
            alignItems: 'center',
                justifyContent: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '300',
  },
  profileSection: {
                alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarIcon: {
    fontSize: 40,
  },
  profileName: {
              fontSize: 24, 
              fontWeight: 'bold', 
              color: 'white', 
              marginBottom: 4,
              textShadowColor: 'rgba(0, 0, 0, 0.3)',
              textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  memberSince: {
                fontSize: 14, 
    color: 'white',
    opacity: 0.9,
                marginBottom: 12,
  },
  inviteButtonBlur: {
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  inviteButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  contentSections: {
                  paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: 'white',
    marginBottom: 8,
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  menuButtonBlur: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  menuButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  logoutButtonBlur: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 8,
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  logoutButton: {
    paddingVertical: 18,
    paddingHorizontal: 20,
                  alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});


