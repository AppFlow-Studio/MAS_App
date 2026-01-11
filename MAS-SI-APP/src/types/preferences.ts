// Types for user preferences and related tables

// Life stage options
export type LifeStage =
  | 'student_high_school'
  | 'student_college'
  | 'young_professional'
  | 'parent_young_kids'
  | 'parent_teens'
  | 'empty_nester'
  | 'retiree'

// Islamic knowledge level options
export type IslamicKnowledgeLevel = 'beginner' | 'intermediate' | 'advanced'

// Commute willingness options
export type CommuteWillingness = 'local_only' | 'willing_to_travel' | 'online_preferred'

// Gender options
export type Gender = 'male' | 'female' | 'prefer_not_to_say'

// User Preferences - maps to user_preferences table
export interface UserPreferences {
  id?: number
  user_id: string

  // Demographics
  birth_year: number | null
  gender: Gender | null
  ethnicity: string[] | null

  // Life Stage
  life_stage: LifeStage | null
  has_children: boolean
  children_ages: number[] | null

  // Islamic Journey
  is_revert: boolean
  revert_year: number | null
  islamic_knowledge_level: IslamicKnowledgeLevel | null

  // Scheduling Preferences
  preferred_days: string[]
  preferred_times: string[]
  max_commute_willingness: CommuteWillingness | null

  preferred_language: string | null
  preferred_sports: string[]

  created_at?: string
  updated_at?: string
}

// Islamic Interest Category - maps to islamic_interest_categories table
export interface IslamicInterestCategory {
  id: number
  category_key: string
  category_name: string
  category_description: string | null
  icon_name: string | null
  parent_category_id: number | null
  display_order: number
}

// Grouped interest for UI display
export interface GroupedInterestCategory extends IslamicInterestCategory {
  children: IslamicInterestCategory[]
}

// User Islamic Interest - maps to user_islamic_interests table
export interface UserIslamicInterest {
  id?: number
  user_id: string
  interest_id: number
  interest_level: number // 1-5, default 3
  created_at?: string
}

// Islamic Goal - maps to islamic_goals table
export interface IslamicGoal {
  id: number
  goal_key: string
  goal_name: string
  goal_description: string | null
  display_order: number
}

// User Islamic Goal - maps to user_islamic_goals table
export interface UserIslamicGoal {
  id?: number
  user_id: string
  goal_id: number
  priority: number // 1-3, default 2
  target_date: string | null
  created_at?: string
}

// Form data structure for the onboarding flow
export interface PreferencesFormData {
  // Demographics (Step 1)
  birthYear: string
  gender: Gender | null
  lifeStage: LifeStage | null
  hasChildren: boolean
  childrenAges: number[]

  // Islamic Journey (Step 2)
  isRevert: boolean
  revertYear: string
  islamicKnowledgeLevel: IslamicKnowledgeLevel | null

  // Availability (Step 3)
  preferredDays: string[]
  preferredTimes: string[]
  preferredLanguage: string | null
  preferredSports: string[]

  // Interests (Step 4) - IDs from islamic_interest_categories
  selectedInterestIds: number[]

  // Goals (Step 5) - IDs from islamic_goals
  selectedGoalIds: number[]
}

// Default form values
export const DEFAULT_PREFERENCES_FORM: PreferencesFormData = {
  birthYear: '',
  gender: null,
  lifeStage: null,
  hasChildren: false,
  childrenAges: [],
  isRevert: false,
  revertYear: '',
  islamicKnowledgeLevel: null,
  preferredDays: [],
  preferredTimes: [],
  preferredLanguage: null,
  preferredSports: [],
  selectedInterestIds: [],
  selectedGoalIds: [],
}

// Constants for UI options
export const LIFE_STAGE_OPTIONS: { value: LifeStage; label: string }[] = [
  { value: 'student_high_school', label: 'High School Student' },
  { value: 'student_college', label: 'College Student' },
  { value: 'young_professional', label: 'Young Professional' },
  { value: 'parent_young_kids', label: 'Parent (Young Kids)' },
  { value: 'parent_teens', label: 'Parent (Teenagers)' },
  { value: 'empty_nester', label: 'Empty Nester' },
  { value: 'retiree', label: 'Retiree' },
]

export const ISLAMIC_KNOWLEDGE_OPTIONS: { value: IslamicKnowledgeLevel; label: string; description: string }[] = [
  { value: 'beginner', label: 'Beginner', description: 'New to learning about Islam' },
  { value: 'intermediate', label: 'Intermediate', description: 'Some foundational knowledge' },
  { value: 'advanced', label: 'Advanced', description: 'Strong Islamic foundation' },
]

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Brother' },
  { value: 'female', label: 'Sister' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

export const PREFERRED_DAYS_OPTIONS: { value: string; label: string }[] = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
]

export const PREFERRED_TIMES_OPTIONS: { value: string; label: string; sublabel: string; icon: string }[] = [
  { value: 'morning', label: 'Mornings', sublabel: '6am - 12pm', icon: 'weather-sunny' },
  { value: 'afternoon', label: 'Afternoons', sublabel: '12pm - 5pm', icon: 'weather-partly-cloudy' },
  { value: 'evening', label: 'Evenings', sublabel: '5pm - 9pm', icon: 'weather-sunset' },
  { value: 'night', label: 'Nights', sublabel: 'After Isha', icon: 'moon-waning-crescent' },
]

export const LANGUAGE_OPTIONS: { value: string; label: string; icon: string }[] = [
  { value: 'english', label: 'English', icon: 'alpha-e-circle' },
  { value: 'arabic', label: 'Arabic', icon: 'alpha-a-circle' },
  { value: 'urdu', label: 'Urdu', icon: 'alpha-u-circle' },
  { value: 'albanian', label: 'Albanian', icon: 'alpha-a-circle-outline' },
]

export const SPORTS_OPTIONS: { value: string; label: string; icon: string }[] = [
  { value: 'basketball', label: 'Basketball', icon: 'basketball' },
  { value: 'soccer', label: 'Soccer', icon: 'soccer' },
  { value: 'volleyball', label: 'Volleyball', icon: 'volleyball' },
  { value: 'swimming', label: 'Swimming', icon: 'swim' },
  { value: 'martial_arts', label: 'Martial Arts', icon: 'karate' },
]

export const CHILDREN_AGE_RANGES: { value: number; label: string }[] = [
  { value: 2, label: '0-4 years' },
  { value: 7, label: '5-9 years' },
  { value: 11, label: '10-13 years' },
  { value: 15, label: '14-17 years' },
  { value: 18, label: '18+ years' },
]

