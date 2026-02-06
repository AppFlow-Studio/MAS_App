import { View, Text, ScrollView, Pressable, Alert, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import { format } from 'date-fns'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Icon } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'

type CapacityStatus = 'green' | 'yellow' | 'red' | null

interface StatusOption {
  value: CapacityStatus
  label: string
  color: string
  description: string
}

const STATUS_OPTIONS: StatusOption[] = [
  { value: null, label: 'Off', color: '#9CA3AF', description: 'Hidden' },
  { value: 'green', label: 'Available', color: '#22C55E', description: 'Space available' },
  { value: 'yellow', label: 'Filling', color: '#EAB308', description: 'Filling up' },
  { value: 'red', label: 'Full', color: '#EF4444', description: 'No space' },
]

// Animated status light preview
const StatusLightPreview = ({ status }: { status: CapacityStatus }) => {
  const opacity = useSharedValue(1)

  useEffect(() => {
    if (status === 'green') {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    } else {
      opacity.value = withTiming(1, { duration: 200 })
    }
  }, [status])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  if (!status) return null

  const color = STATUS_OPTIONS.find(o => o.value === status)?.color || '#9CA3AF'

  return (
    <Animated.View
      style={[
        {
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: color,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 4,
        },
        animatedStyle,
      ]}
    />
  )
}

// Status button component
const StatusButton = ({
  option,
  isSelected,
  onPress,
}: {
  option: StatusOption
  isSelected: boolean
  onPress: () => void
}) => {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 400 })
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 })
  }

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          onPress()
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 10,
          paddingHorizontal: 6,
          borderRadius: 12,
          backgroundColor: isSelected ? option.color : '#F3F4F6',
          borderWidth: 2,
          borderColor: isSelected ? option.color : '#E5E7EB',
        }}
      >
        <View
          style={{
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: isSelected ? '#FFFFFF' : option.color,
            marginBottom: 4,
          }}
        />
        <Text
          style={{
            fontSize: 11,
            fontWeight: '600',
            color: isSelected ? '#FFFFFF' : '#6B7280',
          }}
        >
          {option.label}
        </Text>
      </Pressable>
    </Animated.View>
  )
}

// Prayer row component
const PrayerRow = ({
  title,
  subtitle,
  status,
  onStatusChange,
  icon,
}: {
  title: string
  subtitle?: string
  status: CapacityStatus
  onStatusChange: (status: CapacityStatus) => void
  icon: string
}) => {
  return (
    <View
      style={{
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#EFF6FF',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Icon source={icon} size={22} color="#3B82F6" />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937' }}>{title}</Text>
            <StatusLightPreview status={status} />
          </View>
          {subtitle && (
            <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{subtitle}</Text>
          )}
        </View>
      </View>

      {/* Status buttons */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {STATUS_OPTIONS.map((option) => (
          <StatusButton
            key={option.label}
            option={option}
            isSelected={status === option.value}
            onPress={() => onStatusChange(option.value)}
          />
        ))}
      </View>
    </View>
  )
}

const CapacityStatusAdmin = () => {
  // Jummah statuses (current saved values)
  const [savedJummahStatuses, setSavedJummahStatuses] = useState<(CapacityStatus)[]>([null, null, null, null])
  // Jummah statuses (local edits)
  const [jummahStatuses, setJummahStatuses] = useState<(CapacityStatus)[]>([null, null, null, null])
  
  // Taraweeh statuses (current saved values)
  const [savedTaraweehSession1Status, setSavedTaraweehSession1Status] = useState<CapacityStatus>(null)
  const [savedTaraweehSession2Status, setSavedTaraweehSession2Status] = useState<CapacityStatus>(null)
  // Taraweeh statuses (local edits)
  const [taraweehSession1Status, setTaraweehSession1Status] = useState<CapacityStatus>(null)
  const [taraweehSession2Status, setTaraweehSession2Status] = useState<CapacityStatus>(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Check if there are unsaved changes
  const hasChanges = 
    JSON.stringify(jummahStatuses) !== JSON.stringify(savedJummahStatuses) ||
    taraweehSession1Status !== savedTaraweehSession1Status ||
    taraweehSession2Status !== savedTaraweehSession2Status

  // Fetch all data
  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Fetch Jummah data
      const { data: jummahData } = await supabase
        .from('jummah')
        .select('id, capacity_status')
        .order('id', { ascending: true })

      if (jummahData) {
        const statuses = jummahData.map((j) => j.capacity_status as CapacityStatus)
        setSavedJummahStatuses(statuses)
        setJummahStatuses(statuses)
      }

      // Fetch today's Taraweeh lineup
      const today = format(new Date(), 'yyyy-MM-dd')
      const { data: taraweehData } = await supabase
        .from('taraweeh_lineup')
        .select('lineup')
        .eq('date', today)
        .single()

      if (taraweehData?.lineup) {
        const session1 = taraweehData.lineup.sessionOne?.capacity_status || null
        const session2 = taraweehData.lineup.sessionTwo?.capacity_status || null
        setSavedTaraweehSession1Status(session1)
        setSavedTaraweehSession2Status(session2)
        setTaraweehSession1Status(session1)
        setTaraweehSession2Status(session2)
      }
    } catch (error) {
      console.log('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Update Jummah status locally (no API call)
  const updateJummahStatus = (index: number, status: CapacityStatus) => {
    const newStatuses = [...jummahStatuses]
    newStatuses[index] = status
    setJummahStatuses(newStatuses)
  }

  // Update Taraweeh status locally (no API call)
  const updateTaraweehStatus = (session: 1 | 2, status: CapacityStatus) => {
    if (session === 1) {
      setTaraweehSession1Status(status)
    } else {
      setTaraweehSession2Status(status)
    }
  }

  // Send capacity notifications to subscribed users
  const sendCapacityNotifications = async (changedPrayers: { name: string; status: CapacityStatus }[]) => {
    // Filter to only send notifications for "filling" (yellow) or "full" (red) statuses
    const notifiablePrayers = changedPrayers.filter(p => p.status === 'yellow' || p.status === 'red')
    
    if (notifiablePrayers.length === 0) return

    try {
      // Get all users who have push tokens and are subscribed to capacity alerts
      const { data: subscribers, error: subError } = await supabase
        .from('capacity_alert_subscribers')
        .select('user_id, profiles!inner(push_notification_token)')
        .not('profiles.push_notification_token', 'is', null)

      if (subError) {
        console.log('Error fetching subscribers:', subError)
        // Fallback: try to get all users with push tokens if the subscription table doesn't exist
        const { data: allUsers, error: usersError } = await supabase
          .from('profiles')
          .select('id, push_notification_token')
          .not('push_notification_token', 'is', null)

        if (usersError || !allUsers || allUsers.length === 0) {
          console.log('No users to notify')
          return
        }

        // Build notifications batch
        const notifications = []
        for (const user of allUsers) {
          for (const prayer of notifiablePrayers) {
            const message = prayer.status === 'red' 
              ? `${prayer.name} is now filled.`
              : `${prayer.name} is filling up, consider waiting for the next salah.`
            notifications.push({
              id: Date.now() + Math.random(),
              user_id: user.id,
              push_notification_token: user.push_notification_token,
              title: `${prayer.name} Capacity Alert`,
              message,
            })
          }
        }

        if (notifications.length > 0) {
          await supabase.functions.invoke('send-prayer-notification', {
            body: { notifications_batch: notifications }
          })
        }
        return
      }

      if (!subscribers || subscribers.length === 0) {
        console.log('No subscribers for capacity alerts')
        return
      }

      // Build notifications batch for subscribers
      const notifications = []
      for (const sub of subscribers) {
        const token = (sub.profiles as any)?.push_notification_token
        if (!token) continue

        for (const prayer of notifiablePrayers) {
          const message = prayer.status === 'red' 
            ? `${prayer.name} is now filled.`
            : `${prayer.name} is filling up, consider waiting for the next salah.`
          notifications.push({
            id: Date.now() + Math.random(),
            user_id: sub.user_id,
            push_notification_token: token,
            title: `${prayer.name} Capacity Alert`,
            message,
          })
        }
      }

      if (notifications.length > 0) {
        const { error: sendError } = await supabase.functions.invoke('send-prayer-notification', {
          body: { notifications_batch: notifications }
        })
        if (sendError) {
          console.log('Error sending notifications:', sendError)
        } else {
          console.log(`Sent ${notifications.length} capacity notifications`)
        }
      }
    } catch (error) {
      console.log('Error in sendCapacityNotifications:', error)
    }
  }

  // Save all changes to database
  const handleSubmit = async () => {
    setIsSaving(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    // Track which prayers changed status for notifications
    const changedPrayers: { name: string; status: CapacityStatus }[] = []

    try {
      // Save Jummah statuses that have changed
      for (let i = 0; i < jummahStatuses.length; i++) {
        if (jummahStatuses[i] !== savedJummahStatuses[i]) {
          const { error } = await supabase
            .from('jummah')
            .update({ capacity_status: jummahStatuses[i] })
            .eq('id', i + 1)

          if (error) {
            throw new Error(`Failed to update Jummah ${i + 1}: ${error.message}`)
          }

          // Track change for notification
          if (jummahStatuses[i] === 'yellow' || jummahStatuses[i] === 'red') {
            changedPrayers.push({ name: jummahLabels[i], status: jummahStatuses[i] })
          }
        }
      }

      // Save Taraweeh statuses if changed
      if (taraweehSession1Status !== savedTaraweehSession1Status || 
          taraweehSession2Status !== savedTaraweehSession2Status) {
        const today = format(new Date(), 'yyyy-MM-dd')
        
        const { data: currentData } = await supabase
          .from('taraweeh_lineup')
          .select('lineup')
          .eq('date', today)
          .single()

        if (currentData?.lineup) {
          const updatedLineup = { ...currentData.lineup }
          if (taraweehSession1Status !== savedTaraweehSession1Status) {
            updatedLineup.sessionOne = { ...updatedLineup.sessionOne, capacity_status: taraweehSession1Status }
            // Track change for notification
            if (taraweehSession1Status === 'yellow' || taraweehSession1Status === 'red') {
              changedPrayers.push({ name: 'Taraweeh Session 1', status: taraweehSession1Status })
            }
          }
          if (taraweehSession2Status !== savedTaraweehSession2Status) {
            updatedLineup.sessionTwo = { ...updatedLineup.sessionTwo, capacity_status: taraweehSession2Status }
            // Track change for notification
            if (taraweehSession2Status === 'yellow' || taraweehSession2Status === 'red') {
              changedPrayers.push({ name: 'Taraweeh Session 2', status: taraweehSession2Status })
            }
          }

          const { error } = await supabase
            .from('taraweeh_lineup')
            .update({ lineup: updatedLineup })
            .eq('date', today)

          if (error) {
            throw new Error(`Failed to update Taraweeh: ${error.message}`)
          }
        } else {
          // Create new entry if doesn't exist
          const newLineup = {
            sessionOne: { capacity_status: taraweehSession1Status },
            sessionTwo: { capacity_status: taraweehSession2Status },
          }

          const { error } = await supabase
            .from('taraweeh_lineup')
            .insert({ date: today, lineup: newLineup })

          if (error) {
            throw new Error(`Failed to create Taraweeh entry: ${error.message}`)
          }

          // Track new entries for notification
          if (taraweehSession1Status === 'yellow' || taraweehSession1Status === 'red') {
            changedPrayers.push({ name: 'Taraweeh Session 1', status: taraweehSession1Status })
          }
          if (taraweehSession2Status === 'yellow' || taraweehSession2Status === 'red') {
            changedPrayers.push({ name: 'Taraweeh Session 2', status: taraweehSession2Status })
          }
        }
      }

      // Send notifications for capacity changes (in background, don't block UI)
      sendCapacityNotifications(changedPrayers)

      // Update saved states to match current
      setSavedJummahStatuses([...jummahStatuses])
      setSavedTaraweehSession1Status(taraweehSession1Status)
      setSavedTaraweehSession2Status(taraweehSession2Status)

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Alert.alert('Success', 'Capacity statuses updated successfully!')
    } catch (error: any) {
      console.log('Error saving:', error)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert('Error', error.message || 'Failed to save changes. Please try again.')
      // Revert to saved values on error
      fetchData()
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Set up real-time listeners
    const jummahChannel = supabase
      .channel('capacity-jummah')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jummah' }, () => fetchData())
      .subscribe()

    const taraweehChannel = supabase
      .channel('capacity-taraweeh')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'taraweeh_lineup' }, () => fetchData())
      .subscribe()

    return () => {
      supabase.removeChannel(jummahChannel)
      supabase.removeChannel(taraweehChannel)
    }
  }, [])

  const jummahLabels = ['First Jummah', 'Second Jummah', 'Third Jummah', 'Student Jummah']
  const jummahTimes = ['12:15 PM', '1:00 PM', '1:45 PM', '3:40 PM']

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Capacity Status',
          headerStyle: { backgroundColor: '#F9FAFB' },
          headerTitleStyle: { fontSize: 22, fontWeight: '600', color: '#1F2937' },
          headerTintColor: '#4A5568',
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Legend */}
        <View
          style={{
            backgroundColor: '#EFF6FF',
            borderRadius: 12,
            padding: 12,
            marginBottom: 20,
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#22C55E' }} />
            <Text style={{ fontSize: 12, color: '#374151' }}>Space Available</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#EAB308' }} />
            <Text style={{ fontSize: 12, color: '#374151' }}>Filling Up</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' }} />
            <Text style={{ fontSize: 12, color: '#374151' }}>Full</Text>
          </View>
        </View>

        {/* Jummah Section */}
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#6B7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Jummah Prayers
        </Text>

        {isLoading ? (
          <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 40, alignItems: 'center' }}>
            <Text style={{ color: '#6B7280' }}>Loading...</Text>
          </View>
        ) : (
          <>
            {jummahLabels.map((label, index) => (
              <PrayerRow
                key={label}
                title={label}
                subtitle={jummahTimes[index]}
                status={jummahStatuses[index]}
                onStatusChange={(status) => updateJummahStatus(index, status)}
                icon="mosque"
              />
            ))}
          </>
        )}

        {/* Taraweeh Section */}
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#6B7280', marginBottom: 12, marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Taraweeh Sessions (Today)
        </Text>

        {isLoading ? (
          <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 40, alignItems: 'center' }}>
            <Text style={{ color: '#6B7280' }}>Loading...</Text>
          </View>
        ) : (
          <>
            <PrayerRow
              title="Session 1"
              subtitle="First Taraweeh"
              status={taraweehSession1Status}
              onStatusChange={(status) => updateTaraweehStatus(1, status)}
              icon="moon-waning-crescent"
            />
            <PrayerRow
              title="Session 2"
              subtitle="Second Taraweeh"
              status={taraweehSession2Status}
              onStatusChange={(status) => updateTaraweehStatus(2, status)}
              icon="moon-waning-crescent"
            />
          </>
        )}
      </ScrollView>

      {/* Submit Button at Bottom */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 16,
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
        }}
      >
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!hasChanges || isSaving || isLoading}
          activeOpacity={0.8}
          style={{
            backgroundColor: hasChanges ? '#3B82F6' : '#E5E7EB',
            borderRadius: 14,
            height: 56,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: hasChanges ? '#FFFFFF' : '#6B7280',
              fontSize: 16,
              fontWeight: '700',
            }}
          >
            {isSaving ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes'}
          </Text>
        </TouchableOpacity>

        <Text
          style={{
            textAlign: 'center',
            color: hasChanges ? '#3B82F6' : '#9CA3AF',
            fontSize: 12,
            marginTop: 8,
          }}
        >
          {hasChanges ? 'You have unsaved changes' : 'All changes saved'}
        </Text>
      </View>
    </SafeAreaView>
  )
}

export default CapacityStatusAdmin
