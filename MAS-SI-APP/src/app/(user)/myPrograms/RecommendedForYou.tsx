import { 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  Image, 
  RefreshControl,
  Dimensions,
  StatusBar
} from 'react-native'
import React, { useState, useCallback, useMemo } from 'react'
import { Stack, useRouter, useNavigation } from 'expo-router'
import { Icon } from 'react-native-paper'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/src/providers/AuthProvider'
import { 
  useRecommendedContent,
  useIslamicInterests,
  RecommendedProgram,
  RecommendedEvent
} from '@/src/hooks/usePreferences'
import { FlyerSkeleton } from '@/src/components/FlyerSkeleton'
import FlyerImageComponent from '@/src/components/FlyerImageComponent'
import EventImageComponent from '@/src/components/EventImageComponent'
import { Program, EventsType } from '@/src/types'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LiquidGlassView, isLiquidGlassSupported } from '@/src/lib/liquidGlass'
import * as Haptics from 'expo-haptics'
import { MenuView } from '@react-native-menu/menu'

const { width } = Dimensions.get('window')

// Loading skeleton for content cards
const ContentSkeleton = () => (
  <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 12 }}>
    {[1, 2, 3].map((i) => (
      <View key={i} style={{ width: 150 }}>
        <FlyerSkeleton width={150} height={150} style={{ borderRadius: 12 }} />
        <View style={{ 
          height: 14, 
          width: '80%', 
          backgroundColor: 'rgba(15, 65, 132, 0.1)', 
          borderRadius: 6, 
          marginTop: 8 
        }} />
      </View>
    ))}
  </View>
)

// Empty state when no preferences are set
const EmptyPreferencesState = ({ onSetPreferences }: { onSetPreferences: () => void }) => (
  <View style={{
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  }}>
    <View style={{
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: 'rgba(15, 65, 132, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    }}>
      <Icon source="star-settings" size={48} color="#0F4184" />
    </View>
    <Text style={{
      fontFamily: 'Poppins_700Bold',
      fontSize: 22,
      color: '#0f172a',
      textAlign: 'center',
      marginBottom: 12,
    }}>
      Personalize Your Experience
    </Text>
    <Text style={{
      fontFamily: 'Poppins_400Regular',
      fontSize: 15,
      color: 'rgba(15, 23, 42, 0.6)',
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 28,
    }}>
      Set your interests and goals to get personalized program and event recommendations tailored just for you.
    </Text>
    <Pressable
      onPress={onSetPreferences}
      style={{
        backgroundColor: '#0F4184',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <Icon source="tune" size={20} color="#fff" />
      <Text style={{
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 16,
        color: '#fff',
      }}>
        Set Preferences
      </Text>
    </Pressable>
  </View>
)

// Empty state when no recommendations found
const NoRecommendationsState = () => (
  <View style={{
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  }}>
    <View style={{
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(15, 65, 132, 0.06)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    }}>
      <Icon source="magnify" size={36} color="rgba(15, 65, 132, 0.4)" />
    </View>
    <Text style={{
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 17,
      color: '#0f172a',
      textAlign: 'center',
      marginBottom: 8,
    }}>
      No Recommendations Yet
    </Text>
    <Text style={{
      fontFamily: 'Poppins_400Regular',
      fontSize: 14,
      color: 'rgba(15, 23, 42, 0.5)',
      textAlign: 'center',
      lineHeight: 20,
    }}>
      We're still matching programs to your interests. Check back soon!
    </Text>
  </View>
)

// No filter results state
const NoFilterResultsState = ({ filter, onClearFilter }: { filter: string; onClearFilter: () => void }) => (
  <View style={{
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  }}>
    <View style={{
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(15, 65, 132, 0.06)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    }}>
      <Icon source="calendar-remove" size={36} color="rgba(15, 65, 132, 0.4)" />
    </View>
    <Text style={{
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 17,
      color: '#0f172a',
      textAlign: 'center',
      marginBottom: 8,
    }}>
      Nothing Scheduled
    </Text>
    <Text style={{
      fontFamily: 'Poppins_400Regular',
      fontSize: 14,
      color: 'rgba(15, 23, 42, 0.5)',
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 16,
    }}>
      No programs or events found for "{filter}".
    </Text>
    <Pressable
      onPress={onClearFilter}
      style={{
        backgroundColor: '#0F4184',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
      }}
    >
      <Text style={{
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 14,
        color: '#fff',
      }}>
        Show All
      </Text>
    </Pressable>
  </View>
)

// Program Card Component
const ProgramCard = ({ program, interests, onPress }: { 
  program: RecommendedProgram
  interests: { id: number; category_name: string }[]
  onPress: () => void
}) => {
  const [imageReady, setImageReady] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Get matched interest names
  const matchedInterestNames = program.matchedInterests
    .map(id => interests.find(i => i.id === id)?.category_name)
    .filter(Boolean)
    .slice(0, 2)

  return (
    <Pressable onPress={onPress} style={{ width: 160, marginRight: 12 }}>
      <View style={{
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      }}>
        {!imageReady && (
          <FlyerSkeleton 
            width={160} 
            height={160} 
            style={{ position: 'absolute', top: 0, zIndex: 2, borderRadius: 14 }} 
          />
        )}
        <Image
          source={
            hasError || !program.program_img
              ? require('@/assets/images/MASHomeLogo.png')
              : { uri: program.program_img }
          }
          style={{ width: 160, height: 160, borderRadius: 14 }}
          resizeMode="cover"
          onLoad={() => setImageReady(true)}
          onError={() => {
            setImageReady(true)
            setHasError(true)
          }}
        />
        
        {/* Match badge */}
        {program.matchScore > 0 && (
          <View style={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'rgba(34, 197, 94, 0.95)',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}>
            <Icon source="check-circle" size={12} color="#fff" />
            <Text style={{
              fontFamily: 'Poppins_600SemiBold',
              fontSize: 10,
              color: '#fff',
            }}>
              {program.matchScore} match{program.matchScore > 1 ? 'es' : ''}
            </Text>
          </View>
        )}
      </View>

      <View style={{ paddingTop: 10, paddingHorizontal: 4 }}>
        <Text 
          style={{
            fontFamily: 'Poppins_600SemiBold',
            fontSize: 13,
            color: '#0f172a',
          }}
          numberOfLines={2}
        >
          {program.program_name}
        </Text>
        
        {matchedInterestNames.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
            {matchedInterestNames.map((name, idx) => (
              <View key={idx} style={{
                backgroundColor: 'rgba(15, 65, 132, 0.08)',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 6,
              }}>
                <Text style={{
                  fontFamily: 'Poppins_500Medium',
                  fontSize: 10,
                  color: '#0F4184',
                }}>
                  {name}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  )
}

// Event Card Component
const EventCard = ({ event, interests, onPress }: { 
  event: RecommendedEvent
  interests: { id: number; category_name: string }[]
  onPress: () => void
}) => {
  const [imageReady, setImageReady] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Get matched interest names
  const matchedInterestNames = event.matchedInterests
    .map(id => interests.find(i => i.id === id)?.category_name)
    .filter(Boolean)
    .slice(0, 2)

  return (
    <Pressable onPress={onPress} style={{ width: 160, marginRight: 12 }}>
      <View style={{
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      }}>
        {!imageReady && (
          <FlyerSkeleton 
            width={160} 
            height={160} 
            style={{ position: 'absolute', top: 0, zIndex: 2, borderRadius: 14 }} 
          />
        )}
        <Image
          source={
            hasError || !event.event_img
              ? require('@/assets/images/MASHomeLogo.png')
              : { uri: event.event_img }
          }
          style={{ width: 160, height: 160, borderRadius: 14 }}
          resizeMode="cover"
          onLoad={() => setImageReady(true)}
          onError={() => {
            setImageReady(true)
            setHasError(true)
          }}
        />
        
        {/* Match badge */}
        {event.matchScore > 0 && (
          <View style={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'rgba(34, 197, 94, 0.95)',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}>
            <Icon source="check-circle" size={12} color="#fff" />
            <Text style={{
              fontFamily: 'Poppins_600SemiBold',
              fontSize: 10,
              color: '#fff',
            }}>
              {event.matchScore} match{event.matchScore > 1 ? 'es' : ''}
            </Text>
          </View>
        )}
      </View>

      <View style={{ paddingTop: 10, paddingHorizontal: 4 }}>
        <Text 
          style={{
            fontFamily: 'Poppins_600SemiBold',
            fontSize: 13,
            color: '#0f172a',
          }}
          numberOfLines={2}
        >
          {event.event_name}
        </Text>
        
        {matchedInterestNames.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
            {matchedInterestNames.map((name, idx) => (
              <View key={idx} style={{
                backgroundColor: 'rgba(15, 65, 132, 0.08)',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 6,
              }}>
                <Text style={{
                  fontFamily: 'Poppins_500Medium',
                  fontSize: 10,
                  color: '#0F4184',
                }}>
                  {name}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  )
}

// Section Header Component
const SectionHeader = ({ 
  title, 
  icon, 
  count 
}: { 
  title: string
  icon: string
  count: number 
}) => (
  <View style={{
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 14,
  }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(15, 65, 132, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Icon source={icon} size={20} color="#0F4184" />
      </View>
      <Text style={{
        fontFamily: 'Poppins_700Bold',
        fontSize: 18,
        color: '#0f172a',
      }}>
        {title}
      </Text>
    </View>
    <View style={{
      backgroundColor: 'rgba(15, 65, 132, 0.08)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    }}>
      <Text style={{
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 12,
        color: '#0F4184',
      }}>
        {count} found
      </Text>
    </View>
  </View>
)

// Demo data for preview - set to true to see UI with sample content
const DEMO_MODE = true

// Helper to get date strings relative to today
const getDateString = (daysFromNow: number): string => {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date.toISOString().split('T')[0]
}

// Full Program objects for the bottom sheet modal
const DEMO_PROGRAM_DATA: Program[] = [
  {
    id: 1,
    program_id: 'demo-1',
    program_name: 'Fiqh Essentials: A Journey Through Islamic Jurisprudence',
    program_desc: 'Master the fundamentals of Islamic jurisprudence through comprehensive lessons. This program covers the essential principles of fiqh including purification, prayer, fasting, zakat, and hajj. Perfect for those looking to strengthen their understanding of daily Islamic practices.',
    program_img: 'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=400',
    program_speaker: null,
    lectures: [],
    has_lectures: false,
    program_is_paid: false,
    program_price: 0,
    is_paid: false,
    is_kids: false,
    is_fourteen_plus: false,
    is_education: true,
    program_start_date: getDateString(0), // Today
    program_end_date: getDateString(60),
    program_days: ['Monday', 'Wednesday'],
    program_start_time: '19:00:00',
    paid_link: '',
  },
  {
    id: 2,
    program_id: 'demo-2', 
    program_name: 'Tajweed Mastery Program',
    program_desc: 'Perfect your Quran recitation with expert guidance from certified instructors. Learn the rules of tajweed, proper pronunciation, and beautify your recitation. Suitable for all levels from beginner to advanced.',
    program_img: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=400',
    program_speaker: null,
    lectures: [],
    has_lectures: false,
    program_is_paid: true,
    program_price: 50,
    is_paid: true,
    is_kids: false,
    is_fourteen_plus: false,
    is_education: true,
    program_start_date: getDateString(2), // In 2 days
    program_end_date: getDateString(90),
    program_days: ['Saturday'],
    program_start_time: '10:00:00',
    paid_link: 'https://example.com/register',
  },
  {
    id: 3,
    program_id: 'demo-3',
    program_name: 'Youth Leadership Initiative',
    program_desc: 'Developing tomorrow\'s Muslim leaders through mentorship, workshops, and hands-on community service projects. Build confidence, public speaking skills, and a strong Islamic identity.',
    program_img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400',
    program_speaker: null,
    lectures: [],
    has_lectures: false,
    program_is_paid: false,
    program_price: 0,
    is_paid: false,
    is_kids: false,
    is_fourteen_plus: true,
    is_education: false,
    program_start_date: getDateString(5), // In 5 days
    program_end_date: getDateString(150),
    program_days: ['Friday'],
    program_start_time: '18:30:00',
    paid_link: '',
  },
  {
    id: 4,
    program_id: 'demo-4',
    program_name: 'Sisters Circle: Spiritual Growth',
    program_desc: 'A supportive community for sisters to grow in faith together. Weekly halaqas covering topics of spirituality, self-improvement, and strengthening one\'s relationship with Allah.',
    program_img: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400',
    program_speaker: null,
    lectures: [],
    has_lectures: false,
    program_is_paid: false,
    program_price: 0,
    is_paid: false,
    is_kids: false,
    is_fourteen_plus: false,
    is_education: true,
    program_start_date: getDateString(10), // In 10 days (outside 1 week)
    program_end_date: getDateString(365),
    program_days: ['Sunday'],
    program_start_time: '11:00:00',
    paid_link: '',
  },
]

// Full Event objects for the bottom sheet modal
const DEMO_EVENT_DATA: EventsType[] = [
  {
    id: 1,
    event_id: 'demo-e1',
    event_name: 'Family Fun Night: Eid Celebration',
    event_desc: 'Join us for games, food, and community bonding! Activities for all ages including bounce houses, face painting, henna, and delicious food from local vendors. A celebration for the whole family!',
    event_img: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400',
    event_speaker: '',
    has_lecture: false,
    event_price: 0,
    is_paid: false,
    is_kids: true,
    is_fourteen_plus: false,
    is_education: false,
    event_start_date: getDateString(0), // Today
    event_end_date: getDateString(0),
    event_start_time: '17:00:00',
    event_days: ['Friday'],
    pace: false,
    paid_link: '',
  },
  {
    id: 2,
    event_id: 'demo-e2',
    event_name: 'Community Iftar Gathering',
    event_desc: 'Break your fast with the community during Ramadan. Enjoy a delicious meal, pray Maghrib together, and strengthen the bonds of brotherhood and sisterhood.',
    event_img: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=400',
    event_speaker: '',
    has_lecture: false,
    event_price: 0,
    is_paid: false,
    is_kids: false,
    is_fourteen_plus: false,
    is_education: false,
    event_start_date: getDateString(1), // Tomorrow
    event_end_date: getDateString(1),
    event_start_time: '18:30:00',
    event_days: ['Saturday'],
    pace: false,
    paid_link: '',
  },
  {
    id: 3,
    event_id: 'demo-e3',
    event_name: 'Islamic Finance Workshop',
    event_desc: 'Learn halal investment strategies and financial planning from certified Islamic finance experts. Topics include halal investing, avoiding riba, zakat calculation, and building wealth the Islamic way.',
    event_img: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
    event_speaker: '',
    has_lecture: true,
    event_price: 25,
    is_paid: true,
    is_kids: false,
    is_fourteen_plus: true,
    is_education: true,
    event_start_date: getDateString(3), // In 3 days
    event_end_date: getDateString(3),
    event_start_time: '14:00:00',
    event_days: ['Saturday'],
    pace: false,
    paid_link: 'https://example.com/finance-workshop',
  },
  {
    id: 4,
    event_id: 'demo-e4',
    event_name: 'Quran Competition 2026',
    event_desc: 'Annual Quran memorization and recitation competition for all ages. Categories include Juz Amma, 5 Juz, 10 Juz, and full Quran. Prizes and certificates for all participants!',
    event_img: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=400',
    event_speaker: '',
    has_lecture: false,
    event_price: 0,
    is_paid: false,
    is_kids: true,
    is_fourteen_plus: false,
    is_education: true,
    event_start_date: getDateString(6), // In 6 days
    event_end_date: getDateString(6),
    event_start_time: '09:00:00',
    event_days: ['Sunday'],
    pace: false,
    paid_link: '',
  },
  {
    id: 5,
    event_id: 'demo-e5',
    event_name: 'Marriage & Family Seminar',
    event_desc: 'Building strong Muslim families in the modern world. Topics include selecting a spouse, rights and responsibilities, communication skills, and raising righteous children.',
    event_img: 'https://images.unsplash.com/photo-1529634597503-139d3726fed5?w=400',
    event_speaker: '',
    has_lecture: true,
    event_price: 20,
    is_paid: true,
    is_kids: false,
    is_fourteen_plus: true,
    is_education: true,
    event_start_date: getDateString(14), // In 2 weeks (outside filter)
    event_end_date: getDateString(15),
    event_start_time: '10:00:00',
    event_days: ['Saturday', 'Sunday'],
    pace: false,
    paid_link: 'https://example.com/marriage-seminar',
  },
]

const DEMO_PROGRAMS: RecommendedProgram[] = DEMO_PROGRAM_DATA.map((p, idx) => ({
  program_id: p.program_id,
  program_name: p.program_name,
  program_desc: p.program_desc,
  program_img: p.program_img,
  matchedInterests: idx === 0 ? [1, 3] : idx === 1 ? [2] : idx === 2 ? [4, 5, 6] : [1],
  matchScore: idx === 0 ? 2 : idx === 1 ? 1 : idx === 2 ? 3 : 1,
}))

const DEMO_EVENTS: RecommendedEvent[] = DEMO_EVENT_DATA.map((e, idx) => ({
  event_id: e.event_id,
  event_name: e.event_name,
  event_desc: e.event_desc,
  event_img: e.event_img,
  matchedInterests: idx === 0 ? [4, 7] : idx === 1 ? [1, 4] : idx === 2 ? [8] : idx === 3 ? [2, 3] : [5, 6],
  matchScore: idx === 2 ? 1 : 2,
}))

const DEMO_INTERESTS = [
  { id: 1, category_name: 'Spirituality' },
  { id: 2, category_name: 'Quran' },
  { id: 3, category_name: 'Fiqh' },
  { id: 4, category_name: 'Community' },
  { id: 5, category_name: 'Marriage' },
  { id: 6, category_name: 'Parenting' },
  { id: 7, category_name: 'Youth' },
  { id: 8, category_name: 'Finance' },
]

// Time filter options
type TimeFilter = 'all' | 'today' | '3days' | '1week'

const TIME_FILTER_OPTIONS: { value: TimeFilter; label: string; description: string; icon: string }[] = [
  { value: 'all', label: 'All', description: 'Show all programs & events', icon: 'calendar-blank' },
  { value: 'today', label: 'Today', description: 'Happening today', icon: 'calendar-today' },
  { value: '3days', label: '3 Days', description: 'Within 3 days', icon: 'calendar-week' },
  { value: '1week', label: 'Week', description: 'Within 7 days', icon: 'calendar-month' },
]

export default function RecommendedForYou() {
  const router = useRouter()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { session } = useAuth()
  const userId = session?.user?.id
  const [refreshing, setRefreshing] = useState(false)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  
  // State for selected program/event to show in bottom sheet
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<EventsType | null>(null)

  const { programs: realPrograms, events: realEvents, isLoading: realLoading, hasPreferences: realHasPreferences } = useRecommendedContent(userId)
  const { data: allInterests } = useIslamicInterests()

  // Use demo data if DEMO_MODE is enabled
  const programs = DEMO_MODE ? DEMO_PROGRAMS : realPrograms
  const events = DEMO_MODE ? DEMO_EVENTS : realEvents
  const isLoading = DEMO_MODE ? false : realLoading
  const hasPreferences = DEMO_MODE ? true : realHasPreferences

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    // The queries will refetch automatically due to staleTime
    setTimeout(() => setRefreshing(false), 1000)
  }, [])

  const handleSetPreferences = () => {
    router.push('/more/PreferencesOnboarding')
  }

  const interestsMap = DEMO_MODE ? DEMO_INTERESTS : (allInterests?.map(i => ({ id: i.id, category_name: i.category_name })) ?? [])

  // Helper function to check if a date falls within the filter range
  const isDateInRange = useCallback((dateString: string | undefined, filter: TimeFilter): boolean => {
    if (!dateString || filter === 'all') return true
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const targetDate = new Date(dateString)
    targetDate.setHours(0, 0, 0, 0)
    
    const diffTime = targetDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    switch (filter) {
      case 'today':
        return diffDays === 0
      case '3days':
        return diffDays >= 0 && diffDays <= 3
      case '1week':
        return diffDays >= 0 && diffDays <= 7
      default:
        return true
    }
  }, [])

  // Filter programs and events based on time filter
  const filteredPrograms = useMemo(() => {
    if (timeFilter === 'all') return programs
    
    if (DEMO_MODE) {
      return programs.filter(program => {
        const fullProgram = DEMO_PROGRAM_DATA.find(p => p.program_id === program.program_id)
        return fullProgram && isDateInRange(fullProgram.program_start_date, timeFilter)
      })
    }
    
    return programs
  }, [programs, timeFilter, isDateInRange])

  const filteredEvents = useMemo(() => {
    if (timeFilter === 'all') return events
    
    if (DEMO_MODE) {
      return events.filter(event => {
        const fullEvent = DEMO_EVENT_DATA.find(e => e.event_id === event.event_id)
        return fullEvent && isDateInRange(fullEvent.event_start_date, timeFilter)
      })
    }
    
    return events
  }, [events, timeFilter, isDateInRange])

  const hasContent = programs.length > 0 || events.length > 0
  const hasFilteredContent = filteredPrograms.length > 0 || filteredEvents.length > 0
  const isFiltering = timeFilter !== 'all'

  const currentFilterOption = TIME_FILTER_OPTIONS.find(opt => opt.value === timeFilter) || TIME_FILTER_OPTIONS[0]

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      {/* Custom Header */}
      <View style={{ backgroundColor: '#0F4184', paddingTop: insets.top }}>
        <View style={{ 
          height: 56, 
          flexDirection: 'row', 
          alignItems: 'center', 
          paddingHorizontal: 16,
        }}>
          {/* Back Button */}
          {isLiquidGlassSupported ? (
            <LiquidGlassView
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                overflow: 'hidden',
              }}
              interactive
              effect="clear"
            >
              <Pressable 
                onPress={() => router.back()}
                style={{
                  width: 40,
                  height: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="chevron-back" size={22} color="white" />
              </Pressable>
            </LiquidGlassView>
          ) : (
            <Pressable 
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="chevron-back" size={22} color="white" />
            </Pressable>
          )}
          
          {/* Title */}
          <Text style={{ 
            flex: 1,
            color: 'white', 
            fontSize: 17, 
            fontWeight: '600',
            textAlign: 'center',
            fontFamily: 'Poppins_600SemiBold',
          }}>
            Recommended For You
          </Text>
          
          {/* Update Preferences Button */}
          {isLiquidGlassSupported ? (
            <LiquidGlassView
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                overflow: 'hidden',
              }}
              interactive
              effect="clear"
            >
              <Pressable 
                onPress={handleSetPreferences}
                style={{
                  width: 40,
                  height: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="create-outline" size={20} color="white" />
              </Pressable>
            </LiquidGlassView>
          ) : (
            <Pressable 
              onPress={handleSetPreferences}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="create-outline" size={20} color="white" />
            </Pressable>
          )}

          {/* Filter Button - Native iOS Menu */}
          <MenuView
            style={{ marginLeft: 8 }}
            shouldOpenOnLongPress={false}
            onPressAction={({ nativeEvent }) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              setTimeFilter(nativeEvent.event as TimeFilter)
            }}
            actions={[
                {
                  id: 'group1',
                  title: '',
                  displayInline: true,
                  subactions: [
                    {
                      id: 'all',
                      title: 'All',
                      state: timeFilter === 'all' ? 'on' as const : 'off' as const,
                    },
                  ],
                },
                {
                  id: 'group2',
                  title: '',
                  displayInline: true,
                  subactions: [
                    {
                      id: 'today',
                      title: 'Today',
                      state: timeFilter === 'today' ? 'on' as const : 'off' as const,
                    },
                  ],
                },
                {
                  id: 'group3',
                  title: '',
                  displayInline: true,
                  subactions: [
                    {
                      id: '3days',
                      title: '3 Days',
                      state: timeFilter === '3days' ? 'on' as const : 'off' as const,
                    },
                  ],
                },
                {
                  id: 'group4',
                  title: '',
                  displayInline: true,
                  subactions: [
                    {
                      id: '1week',
                      title: 'Week',
                      state: timeFilter === '1week' ? 'on' as const : 'off' as const,
                    },
                  ],
                },
              ]}
            >
              {isLiquidGlassSupported ? (
                <LiquidGlassView
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    overflow: 'hidden',
                  }}
                  interactive
                  effect="clear"
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name={timeFilter === 'all' ? 'filter-outline' : 'filter'} size={20} color="white" />
                  </View>
                </LiquidGlassView>
              ) : (
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: timeFilter !== 'all' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={timeFilter === 'all' ? 'filter-outline' : 'filter'} size={20} color="white" />
                </View>
              )}
          </MenuView>
        </View>
      </View>

      {/* Active Filter Chip */}
      {timeFilter !== 'all' && (
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
          <Pressable
            onPress={() => setTimeFilter('all')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-start',
              backgroundColor: 'rgba(15, 65, 132, 0.1)',
              paddingLeft: 10,
              paddingRight: 8,
              paddingVertical: 6,
              borderRadius: 20,
              gap: 6,
            }}
          >
            <Icon source={currentFilterOption.icon} size={16} color="#0F4184" />
            <Text style={{
              fontFamily: 'Poppins_500Medium',
              fontSize: 13,
              color: '#0F4184',
            }}>
              {currentFilterOption.label}
            </Text>
            <View style={{
              width: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: 'rgba(15, 65, 132, 0.15)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Ionicons name="close" size={12} color="#0F4184" />
            </View>
          </Pressable>
        </View>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Loading State */}
        {isLoading && (
          <View style={{ marginTop: 32 }}>
            <View style={{ paddingHorizontal: 16, marginBottom: 14 }}>
              <View style={{ 
                height: 24, 
                width: 160, 
                backgroundColor: 'rgba(15, 65, 132, 0.1)', 
                borderRadius: 8 
              }} />
            </View>
            <ContentSkeleton />
            <View style={{ marginTop: 32 }}>
              <View style={{ paddingHorizontal: 16, marginBottom: 14 }}>
                <View style={{ 
                  height: 24, 
                  width: 140, 
                  backgroundColor: 'rgba(15, 65, 132, 0.1)', 
                  borderRadius: 8 
                }} />
              </View>
              <ContentSkeleton />
            </View>
          </View>
        )}

        {/* No Preferences State */}
        {!isLoading && !hasPreferences && (
          <EmptyPreferencesState onSetPreferences={handleSetPreferences} />
        )}

        {/* No Recommendations State */}
        {!isLoading && hasPreferences && !hasContent && (
          <NoRecommendationsState />
        )}

        {/* No Filter Results State */}
        {!isLoading && hasContent && isFiltering && !hasFilteredContent && (
          <NoFilterResultsState filter={currentFilterOption.label} onClearFilter={() => setTimeFilter('all')} />
        )}

        {/* Programs Section */}
        {!isLoading && filteredPrograms.length > 0 && (
          <>
            <SectionHeader 
              title="Programs For You" 
              icon="book-open-page-variant" 
              count={filteredPrograms.length} 
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            >
              {filteredPrograms.map((program) => (
                <ProgramCard 
                  key={program.program_id} 
                  program={program} 
                  interests={interestsMap}
                  onPress={() => {
                    // Find full program data (from demo or real data)
                    if (DEMO_MODE) {
                      const fullProgram = DEMO_PROGRAM_DATA.find(p => p.program_id === program.program_id)
                      if (fullProgram) setSelectedProgram(fullProgram)
                    } else {
                      // For real data, create a Program object from the recommendation
                      setSelectedProgram({
                        id: 0,
                        program_id: program.program_id,
                        program_name: program.program_name || '',
                        program_img: program.program_img || null,
                        program_desc: program.program_desc || null,
                        program_speaker: null,
                        lectures: [],
                        has_lectures: false,
                        program_is_paid: false,
                        program_price: 0,
                        is_paid: false,
                        is_kids: false,
                        is_fourteen_plus: false,
                        is_education: false,
                        program_start_date: '',
                        program_end_date: '',
                        program_days: [],
                        program_start_time: '',
                        paid_link: '',
                      })
                    }
                  }}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* Events Section */}
        {!isLoading && filteredEvents.length > 0 && (
          <>
            <SectionHeader 
              title="Events For You" 
              icon="calendar-star" 
              count={filteredEvents.length} 
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            >
              {filteredEvents.map((event) => (
                <EventCard 
                  key={event.event_id} 
                  event={event} 
                  interests={interestsMap}
                  onPress={() => {
                    // Find full event data (from demo or real data)
                    if (DEMO_MODE) {
                      const fullEvent = DEMO_EVENT_DATA.find(e => e.event_id === event.event_id)
                      if (fullEvent) setSelectedEvent(fullEvent)
                    } else {
                      // For real data, create an EventsType object from the recommendation
                      setSelectedEvent({
                        id: 0,
                        event_id: event.event_id,
                        event_name: event.event_name || '',
                        event_speaker: '',
                        event_desc: event.event_desc || '',
                        event_img: event.event_img || '',
                        has_lecture: false,
                        event_price: 0,
                        is_paid: false,
                        is_kids: false,
                        is_fourteen_plus: false,
                        is_education: false,
                        event_start_date: '',
                        event_end_date: '',
                        event_start_time: '',
                        event_days: [],
                        pace: false,
                        paid_link: '',
                      })
                    }
                  }}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* Info Card */}
        {!isLoading && hasFilteredContent && (
          <View style={{
            marginHorizontal: 16,
            marginTop: 32,
            backgroundColor: 'rgba(15, 65, 132, 0.04)',
            borderRadius: 14,
            padding: 16,
            borderWidth: 1,
            borderColor: 'rgba(15, 65, 132, 0.08)',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <Icon source="information" size={22} color="#0F4184" />
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontFamily: 'Poppins_600SemiBold',
                  fontSize: 14,
                  color: '#0F4184',
                  marginBottom: 4,
                }}>
                  How recommendations work
                </Text>
                <Text style={{
                  fontFamily: 'Poppins_400Regular',
                  fontSize: 13,
                  color: 'rgba(15, 23, 42, 0.6)',
                  lineHeight: 19,
                }}>
                  We match your selected interests and goals with tagged programs and events. 
                  The more matches, the higher they appear in your feed.
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Program Bottom Sheet Modal */}
      {selectedProgram && (
        <FlyerImageComponent 
          item={selectedProgram} 
          autoOpen={true}
          onModalClose={() => setSelectedProgram(null)}
        />
      )}

      {/* Event Bottom Sheet Modal */}
      {selectedEvent && (
        <EventImageComponent 
          item={selectedEvent} 
          autoOpen={true}
          onModalClose={() => setSelectedEvent(null)}
        />
      )}
    </View>
  )
}
