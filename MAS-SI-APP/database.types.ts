export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      added_notifications_events: {
        Row: {
          created_at: string
          event_id: string
          id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: number
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "added_notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
        ]
      }
      added_notifications_programs: {
        Row: {
          created_at: string
          has_lectures: boolean | null
          id: number
          program_id: string
          program_is_paid: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string
          has_lectures?: boolean | null
          id?: number
          program_id: string
          program_is_paid?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string
          has_lectures?: boolean | null
          id?: number
          program_id?: string
          program_is_paid?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "added_notifications_programs_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["program_id"]
          },
        ]
      }
      added_programs: {
        Row: {
          created_at: string | null
          program_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          program_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          program_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "liked_programs_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["program_id"]
          },
        ]
      }
      approved_business_ads: {
        Row: {
          created_at: string
          id: number
          submission_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          submission_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          submission_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approved_business_ads_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "business_ads_submissions"
            referencedColumns: ["submission_id"]
          },
        ]
      }
      business_ads_submissions: {
        Row: {
          business_address: string | null
          business_email: string | null
          business_flyer_duration: string | null
          business_flyer_img: string | null
          business_flyer_location: string | null
          business_name: string | null
          business_phone_number: string | null
          created_at: string
          id: number
          personal_email: string | null
          personal_full_name: string | null
          personal_phone_number: string | null
          status: string | null
          submission_id: string
          user_id: string
        }
        Insert: {
          business_address?: string | null
          business_email?: string | null
          business_flyer_duration?: string | null
          business_flyer_img?: string | null
          business_flyer_location?: string | null
          business_name?: string | null
          business_phone_number?: string | null
          created_at?: string
          id?: number
          personal_email?: string | null
          personal_full_name?: string | null
          personal_phone_number?: string | null
          status?: string | null
          submission_id?: string
          user_id: string
        }
        Update: {
          business_address?: string | null
          business_email?: string | null
          business_flyer_duration?: string | null
          business_flyer_img?: string | null
          business_flyer_location?: string | null
          business_name?: string | null
          business_phone_number?: string | null
          created_at?: string
          id?: number
          personal_email?: string | null
          personal_full_name?: string | null
          personal_phone_number?: string | null
          status?: string | null
          submission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_ads_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      capacity_alert_subscribers: {
        Row: {
          created_at: string | null
          id: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "capacity_alert_subscribers_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          amountGiven: number | null
          date: string
          id: number
          project_donated_to: string[] | null
        }
        Insert: {
          amountGiven?: number | null
          date?: string
          id?: number
          project_donated_to?: string[] | null
        }
        Update: {
          amountGiven?: number | null
          date?: string
          id?: number
          project_donated_to?: string[] | null
        }
        Relationships: []
      }
      event_islamic_goals: {
        Row: {
          created_at: string | null
          event_id: string
          goal_id: number
        }
        Insert: {
          created_at?: string | null
          event_id: string
          goal_id: number
        }
        Update: {
          created_at?: string | null
          event_id?: string
          goal_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_islamic_goals_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_islamic_goals_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "islamic_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      event_islamic_interests: {
        Row: {
          created_at: string | null
          event_id: string
          interest_id: number
        }
        Insert: {
          created_at?: string | null
          event_id: string
          interest_id: number
        }
        Update: {
          created_at?: string | null
          event_id?: string
          interest_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_islamic_interests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_islamic_interests_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "islamic_interest_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      event_notification_schedule: {
        Row: {
          created_at: string
          event_id: string | null
          event_name: string | null
          id: number
          is_sent: boolean | null
          message: string | null
          notification_time: string | null
          notification_type: string | null
          push_notification_token: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          event_name?: string | null
          id?: number
          is_sent?: boolean | null
          message?: string | null
          notification_time?: string | null
          notification_type?: string | null
          push_notification_token?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string | null
          event_name?: string | null
          id?: number
          is_sent?: boolean | null
          message?: string | null
          notification_time?: string | null
          notification_type?: string | null
          push_notification_token?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_notification_schedule_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
        ]
      }
      event_notification_settings: {
        Row: {
          created_at: string
          event_id: string | null
          id: number
          notification_settings: string[] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: number
          notification_settings?: string[] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: number
          notification_settings?: string[] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_notification_settings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          event_days: string[] | null
          event_desc: string | null
          event_end_date: string | null
          event_gender: string | null
          event_id: string
          event_img: string | null
          event_name: string | null
          event_price: number | null
          event_speaker: string[] | null
          event_start_date: string | null
          event_start_time: string | null
          has_lecture: boolean | null
          id: number
          is_breakfast: boolean | null
          is_education: boolean | null
          is_fourteen_plus: boolean | null
          is_fundraiser: boolean | null
          is_kids: boolean | null
          is_outreach: boolean | null
          is_paid: boolean | null
          is_reverts: boolean | null
          is_social: boolean | null
          pace: boolean | null
          paid_link: string | null
        }
        Insert: {
          created_at?: string
          event_days?: string[] | null
          event_desc?: string | null
          event_end_date?: string | null
          event_gender?: string | null
          event_id?: string
          event_img?: string | null
          event_name?: string | null
          event_price?: number | null
          event_speaker?: string[] | null
          event_start_date?: string | null
          event_start_time?: string | null
          has_lecture?: boolean | null
          id?: number
          is_breakfast?: boolean | null
          is_education?: boolean | null
          is_fourteen_plus?: boolean | null
          is_fundraiser?: boolean | null
          is_kids?: boolean | null
          is_outreach?: boolean | null
          is_paid?: boolean | null
          is_reverts?: boolean | null
          is_social?: boolean | null
          pace?: boolean | null
          paid_link?: string | null
        }
        Update: {
          created_at?: string
          event_days?: string[] | null
          event_desc?: string | null
          event_end_date?: string | null
          event_gender?: string | null
          event_id?: string
          event_img?: string | null
          event_name?: string | null
          event_price?: number | null
          event_speaker?: string[] | null
          event_start_date?: string | null
          event_start_time?: string | null
          has_lecture?: boolean | null
          id?: number
          is_breakfast?: boolean | null
          is_education?: boolean | null
          is_fourteen_plus?: boolean | null
          is_fundraiser?: boolean | null
          is_kids?: boolean | null
          is_outreach?: boolean | null
          is_paid?: boolean | null
          is_reverts?: boolean | null
          is_social?: boolean | null
          pace?: boolean | null
          paid_link?: string | null
        }
        Relationships: []
      }
      events_lectures: {
        Row: {
          created_at: string
          event_id: string | null
          event_lecture_date: string | null
          event_lecture_desc: string | null
          event_lecture_id: string
          event_lecture_img: string | null
          event_lecture_keynotes: string[] | null
          event_lecture_link: string | null
          event_lecture_name: string | null
          event_lecture_speaker: string[] | null
          id: number
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          event_lecture_date?: string | null
          event_lecture_desc?: string | null
          event_lecture_id?: string
          event_lecture_img?: string | null
          event_lecture_keynotes?: string[] | null
          event_lecture_link?: string | null
          event_lecture_name?: string | null
          event_lecture_speaker?: string[] | null
          id?: number
        }
        Update: {
          created_at?: string
          event_id?: string | null
          event_lecture_date?: string | null
          event_lecture_desc?: string | null
          event_lecture_id?: string
          event_lecture_img?: string | null
          event_lecture_keynotes?: string[] | null
          event_lecture_link?: string | null
          event_lecture_name?: string | null
          event_lecture_speaker?: string[] | null
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "events_lectures_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
        ]
      }
      islamic_goals: {
        Row: {
          display_order: number | null
          goal_description: string | null
          goal_key: string
          goal_name: string
          id: number
        }
        Insert: {
          display_order?: number | null
          goal_description?: string | null
          goal_key: string
          goal_name: string
          id?: number
        }
        Update: {
          display_order?: number | null
          goal_description?: string | null
          goal_key?: string
          goal_name?: string
          id?: number
        }
        Relationships: []
      }
      islamic_interest_categories: {
        Row: {
          category_description: string | null
          category_key: string
          category_name: string
          display_order: number | null
          icon_name: string | null
          id: number
          parent_category_id: number | null
        }
        Insert: {
          category_description?: string | null
          category_key: string
          category_name: string
          display_order?: number | null
          icon_name?: string | null
          id?: number
          parent_category_id?: number | null
        }
        Update: {
          category_description?: string | null
          category_key?: string
          category_name?: string
          display_order?: number | null
          icon_name?: string | null
          id?: number
          parent_category_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "islamic_interest_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "islamic_interest_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      jummah: {
        Row: {
          capacity_status: string | null
          created_at: string
          desc: string | null
          id: number
          prayer_time: string | null
          speaker: string | null
          topic: string | null
        }
        Insert: {
          capacity_status?: string | null
          created_at?: string
          desc?: string | null
          id?: number
          prayer_time?: string | null
          speaker?: string | null
          topic?: string | null
        }
        Update: {
          capacity_status?: string | null
          created_at?: string
          desc?: string | null
          id?: number
          prayer_time?: string | null
          speaker?: string | null
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jummah_speaker_fkey"
            columns: ["speaker"]
            isOneToOne: false
            referencedRelation: "speaker_data"
            referencedColumns: ["speaker_id"]
          },
        ]
      }
      jummah_notifications: {
        Row: {
          created_at: string
          id: number
          jummah: string | null
          notification_settings: string[] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          jummah?: string | null
          notification_settings?: string[] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          jummah?: string | null
          notification_settings?: string[] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jummah_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      liked_event_lectures: {
        Row: {
          created_at: string
          event_lecture_id: string
          id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          event_lecture_id: string
          id?: number
          user_id: string
        }
        Update: {
          created_at?: string
          event_lecture_id?: string
          id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "liked_event_lectures_event_lecture_id_fkey"
            columns: ["event_lecture_id"]
            isOneToOne: false
            referencedRelation: "events_lectures"
            referencedColumns: ["event_lecture_id"]
          },
        ]
      }
      liked_lectures: {
        Row: {
          created_at: string
          id: string
          lecture_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lecture_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lecture_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "liked_lectures_lecture_id_fkey"
            columns: ["lecture_id"]
            isOneToOne: false
            referencedRelation: "program_lectures"
            referencedColumns: ["lecture_id"]
          },
        ]
      }
      prayer_notification_schedule: {
        Row: {
          created_at: string
          id: number
          is_sent: boolean | null
          message: string | null
          notification_time: string | null
          notification_type: string | null
          prayer: string | null
          push_notification_token: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          is_sent?: boolean | null
          message?: string | null
          notification_time?: string | null
          notification_type?: string | null
          prayer?: string | null
          push_notification_token?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          is_sent?: boolean | null
          message?: string | null
          notification_time?: string | null
          notification_type?: string | null
          prayer?: string | null
          push_notification_token?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      prayer_notification_settings: {
        Row: {
          id: number
          notification_settings: string[] | null
          prayer: string | null
          user_id: string | null
        }
        Insert: {
          id?: number
          notification_settings?: string[] | null
          prayer?: string | null
          user_id?: string | null
        }
        Update: {
          id?: number
          notification_settings?: string[] | null
          prayer?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      prayers: {
        Row: {
          id: number
          iqamahData: Json | null
          prayerData: Json | null
        }
        Insert: {
          id?: number
          iqamahData?: Json | null
          prayerData?: Json | null
        }
        Update: {
          id?: number
          iqamahData?: Json | null
          prayerData?: Json | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          phone_number: string | null
          profile_email: string | null
          profile_pic: string | null
          push_notification_token: string | null
          role: string | null
          stripe_id: string | null
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          phone_number?: string | null
          profile_email?: string | null
          profile_pic?: string | null
          push_notification_token?: string | null
          role?: string | null
          stripe_id?: string | null
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone_number?: string | null
          profile_email?: string | null
          profile_pic?: string | null
          push_notification_token?: string | null
          role?: string | null
          stripe_id?: string | null
        }
        Relationships: []
      }
      program_forms: {
        Row: {
          created_at: string
          id: number
          program_id: string | null
          question: string | null
          question_type: string | null
          radio_button_prompts: string[] | null
        }
        Insert: {
          created_at?: string
          id?: number
          program_id?: string | null
          question?: string | null
          question_type?: string | null
          radio_button_prompts?: string[] | null
        }
        Update: {
          created_at?: string
          id?: number
          program_id?: string | null
          question?: string | null
          question_type?: string | null
          radio_button_prompts?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "program_forms_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["program_id"]
          },
        ]
      }
      program_islamic_goals: {
        Row: {
          created_at: string | null
          goal_id: number
          program_id: string
        }
        Insert: {
          created_at?: string | null
          goal_id: number
          program_id: string
        }
        Update: {
          created_at?: string | null
          goal_id?: number
          program_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_islamic_goals_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "islamic_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_islamic_goals_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["program_id"]
          },
        ]
      }
      program_islamic_interests: {
        Row: {
          created_at: string | null
          interest_id: number
          program_id: string
        }
        Insert: {
          created_at?: string | null
          interest_id: number
          program_id: string
        }
        Update: {
          created_at?: string | null
          interest_id?: number
          program_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_islamic_interests_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "islamic_interest_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_islamic_interests_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["program_id"]
          },
        ]
      }
      program_lectures: {
        Row: {
          created_at: string | null
          id: number
          lecture_ai: string | null
          lecture_date: string | null
          lecture_id: string
          lecture_img: string | null
          lecture_key_notes: string[] | null
          lecture_link: string | null
          lecture_name: string | null
          lecture_program: string | null
          lecture_speaker: string[] | null
          lecture_time: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          lecture_ai?: string | null
          lecture_date?: string | null
          lecture_id?: string
          lecture_img?: string | null
          lecture_key_notes?: string[] | null
          lecture_link?: string | null
          lecture_name?: string | null
          lecture_program?: string | null
          lecture_speaker?: string[] | null
          lecture_time?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          lecture_ai?: string | null
          lecture_date?: string | null
          lecture_id?: string
          lecture_img?: string | null
          lecture_key_notes?: string[] | null
          lecture_link?: string | null
          lecture_name?: string | null
          lecture_program?: string | null
          lecture_speaker?: string[] | null
          lecture_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_lectures_lecture_program_fkey"
            columns: ["lecture_program"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["program_id"]
          },
        ]
      }
      program_notification_schedule: {
        Row: {
          created_at: string
          id: number
          is_event: boolean | null
          is_sent: boolean | null
          message: string | null
          notification_time: string | null
          notification_type: string | null
          program_event_name: string | null
          push_notification_token: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          is_event?: boolean | null
          is_sent?: boolean | null
          message?: string | null
          notification_time?: string | null
          notification_type?: string | null
          program_event_name?: string | null
          push_notification_token?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          is_event?: boolean | null
          is_sent?: boolean | null
          message?: string | null
          notification_time?: string | null
          notification_type?: string | null
          program_event_name?: string | null
          push_notification_token?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      program_notifications_settings: {
        Row: {
          id: number
          notification_settings: string[] | null
          program_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: number
          notification_settings?: string[] | null
          program_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: number
          notification_settings?: string[] | null
          program_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_notification_settings_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["program_id"]
          },
        ]
      }
      program_tag_assignments: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: number
          program_id: string | null
          relevance_weight: number | null
          tag_id: number
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: number
          program_id?: string | null
          relevance_weight?: number | null
          tag_id: number
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: number
          program_id?: string | null
          relevance_weight?: number | null
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "program_tag_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "program_tag_assignments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "program_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "program_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      program_tags: {
        Row: {
          id: number
          maps_to_interest_id: number | null
          tag_key: string
          tag_name: string
          tag_type: string | null
        }
        Insert: {
          id?: number
          maps_to_interest_id?: number | null
          tag_key: string
          tag_name: string
          tag_type?: string | null
        }
        Update: {
          id?: number
          maps_to_interest_id?: number | null
          tag_key?: string
          tag_name?: string
          tag_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_tags_maps_to_interest_id_fkey"
            columns: ["maps_to_interest_id"]
            isOneToOne: false
            referencedRelation: "islamic_interest_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          has_lectures: boolean
          id: number
          is_education: boolean | null
          is_fourteen_plus: boolean | null
          is_kids: boolean | null
          paid_link: string | null
          program_days: string[] | null
          program_desc: string | null
          program_end_date: string | null
          program_gender: string | null
          program_id: string
          program_img: string
          program_is_paid: boolean | null
          program_name: string | null
          program_price: number | null
          program_speaker: string[] | null
          program_start_date: string | null
          program_start_time: string | null
          stripe_price_id: string | null
          stripe_product_id: string | null
        }
        Insert: {
          has_lectures?: boolean
          id?: number
          is_education?: boolean | null
          is_fourteen_plus?: boolean | null
          is_kids?: boolean | null
          paid_link?: string | null
          program_days?: string[] | null
          program_desc?: string | null
          program_end_date?: string | null
          program_gender?: string | null
          program_id?: string
          program_img?: string
          program_is_paid?: boolean | null
          program_name?: string | null
          program_price?: number | null
          program_speaker?: string[] | null
          program_start_date?: string | null
          program_start_time?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
        }
        Update: {
          has_lectures?: boolean
          id?: number
          is_education?: boolean | null
          is_fourteen_plus?: boolean | null
          is_kids?: boolean | null
          paid_link?: string | null
          program_days?: string[] | null
          program_desc?: string | null
          program_end_date?: string | null
          program_gender?: string | null
          program_id?: string
          program_img?: string
          program_is_paid?: boolean | null
          program_name?: string | null
          program_price?: number | null
          program_speaker?: string[] | null
          program_start_date?: string | null
          program_start_time?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          project_goal: number | null
          project_id: string
          project_linked_to: string | null
          project_name: string | null
          thumbnail: string | null
        }
        Insert: {
          created_at?: string
          project_goal?: number | null
          project_id?: string
          project_linked_to?: string | null
          project_name?: string | null
          thumbnail?: string | null
        }
        Update: {
          created_at?: string
          project_goal?: number | null
          project_id?: string
          project_linked_to?: string | null
          project_name?: string | null
          thumbnail?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_project_linked_to_fkey"
            columns: ["project_linked_to"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      quran_playlist: {
        Row: {
          created_at: string
          id: string
          reciter: string | null
          surah: string | null
          video_type: string
          youtube_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          reciter?: string | null
          surah?: string | null
          video_type?: string
          youtube_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          reciter?: string | null
          surah?: string | null
          video_type?: string
          youtube_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quran_playlist_reciter_fkey"
            columns: ["reciter"]
            isOneToOne: false
            referencedRelation: "speaker_data"
            referencedColumns: ["speaker_id"]
          },
        ]
      }
      ramadan_quran_tracker: {
        Row: {
          ayah: string | null
          ayah_num: number | null
          created_at: string
          id: number
          num_of_ayahs: number | null
          surah: number | null
          surah_name: string | null
        }
        Insert: {
          ayah?: string | null
          ayah_num?: number | null
          created_at?: string
          id?: number
          num_of_ayahs?: number | null
          surah?: number | null
          surah_name?: string | null
        }
        Update: {
          ayah?: string | null
          ayah_num?: number | null
          created_at?: string
          id?: number
          num_of_ayahs?: number | null
          surah?: number | null
          surah_name?: string | null
        }
        Relationships: []
      }
      recommendation_log: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: number
          program_id: string | null
          recommendation_score: number | null
          score_breakdown: Json | null
          user_id: string
          was_added: boolean | null
          was_clicked: boolean | null
          was_shown: boolean | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: number
          program_id?: string | null
          recommendation_score?: number | null
          score_breakdown?: Json | null
          user_id: string
          was_added?: boolean | null
          was_clicked?: boolean | null
          was_shown?: boolean | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: number
          program_id?: string | null
          recommendation_score?: number | null
          score_breakdown?: Json | null
          user_id?: string
          was_added?: boolean | null
          was_clicked?: boolean | null
          was_shown?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_log_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "recommendation_log_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "recommendation_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      speaker_data: {
        Row: {
          created_at: string
          speaker_creds: string[] | null
          speaker_id: string
          speaker_img: string | null
          speaker_name: string | null
        }
        Insert: {
          created_at?: string
          speaker_creds?: string[] | null
          speaker_id?: string
          speaker_img?: string | null
          speaker_name?: string | null
        }
        Update: {
          created_at?: string
          speaker_creds?: string[] | null
          speaker_id?: string
          speaker_img?: string | null
          speaker_name?: string | null
        }
        Relationships: []
      }
      taraweeh_lineup: {
        Row: {
          created_at: string | null
          date: string
          id: string
          lineup: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          lineup?: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          lineup?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      todays_prayers: {
        Row: {
          athan_time: string | null
          id: number
          iqamah_time: string | null
          prayer_name: string | null
        }
        Insert: {
          athan_time?: string | null
          id?: number
          iqamah_time?: string | null
          prayer_name?: string | null
        }
        Update: {
          athan_time?: string | null
          id?: number
          iqamah_time?: string | null
          prayer_name?: string | null
        }
        Relationships: []
      }
      user_bookmarked_ayahs: {
        Row: {
          ayah_number: number
          created_at: string
          id: number
          surah_number: number
          user_id: string
        }
        Insert: {
          ayah_number: number
          created_at?: string
          id?: number
          surah_number: number
          user_id: string
        }
        Update: {
          ayah_number?: number
          created_at?: string
          id?: number
          surah_number?: number
          user_id?: string
        }
        Relationships: []
      }
      user_bookmarked_surahs: {
        Row: {
          created_at: string
          id: number
          surah_number: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          surah_number: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          surah_number?: number
          user_id?: string
        }
        Relationships: []
      }
      user_cart: {
        Row: {
          created_at: string
          event_id: string | null
          id: number
          product_price: number | null
          product_quantity: number | null
          program_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: number
          product_price?: number | null
          product_quantity?: number | null
          program_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: number
          product_price?: number | null
          product_quantity?: number | null
          program_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_cart_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "user_cart_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["program_id"]
          },
        ]
      }
      user_continue_read: {
        Row: {
          ayah_number: number | null
          created_at: string
          id: number
          juz_number: number | null
          surah_number: number | null
          user_id: string | null
        }
        Insert: {
          ayah_number?: number | null
          created_at?: string
          id?: number
          juz_number?: number | null
          surah_number?: number | null
          user_id?: string | null
        }
        Update: {
          ayah_number?: number | null
          created_at?: string
          id?: number
          juz_number?: number | null
          surah_number?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_islamic_goals: {
        Row: {
          created_at: string | null
          goal_id: number
          id: number
          priority: number | null
          target_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          goal_id: number
          id?: number
          priority?: number | null
          target_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          goal_id?: number
          id?: number
          priority?: number | null
          target_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_islamic_goals_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "islamic_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_islamic_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_islamic_interests: {
        Row: {
          created_at: string | null
          id: number
          interest_id: number
          interest_level: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          interest_id: number
          interest_level?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          interest_id?: number
          interest_level?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_islamic_interests_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "islamic_interest_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_islamic_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_liked_ayahs: {
        Row: {
          ayah_number: number
          created_at: string
          id: number
          surah_number: number
          user_id: string
        }
        Insert: {
          ayah_number: number
          created_at?: string
          id?: number
          surah_number: number
          user_id: string
        }
        Update: {
          ayah_number?: number
          created_at?: string
          id?: number
          surah_number?: number
          user_id?: string
        }
        Relationships: []
      }
      user_liked_surahs: {
        Row: {
          created_at: string
          id: number
          surah_number: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          surah_number: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          surah_number?: number
          user_id?: string
        }
        Relationships: []
      }
      user_playlist: {
        Row: {
          created_at: string
          def_background: string | null
          playlist_id: string
          playlist_img: string | null
          playlist_name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          def_background?: string | null
          playlist_id?: string
          playlist_img?: string | null
          playlist_name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          def_background?: string | null
          playlist_id?: string
          playlist_img?: string | null
          playlist_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_playlist_lectures: {
        Row: {
          created_at: string
          event_lecture_id: string | null
          id: number
          playlist_id: string
          program_lecture_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_lecture_id?: string | null
          id?: number
          playlist_id: string
          program_lecture_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_lecture_id?: string | null
          id?: number
          playlist_id?: string
          program_lecture_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_playlist_lectures_event_lecture_id_fkey"
            columns: ["event_lecture_id"]
            isOneToOne: false
            referencedRelation: "events_lectures"
            referencedColumns: ["event_lecture_id"]
          },
          {
            foreignKeyName: "user_playlist_lectures_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "user_playlist"
            referencedColumns: ["playlist_id"]
          },
          {
            foreignKeyName: "user_playlist_lectures_program_lecture_id_fkey"
            columns: ["program_lecture_id"]
            isOneToOne: false
            referencedRelation: "program_lectures"
            referencedColumns: ["lecture_id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          birth_year: number | null
          children_ages: number[] | null
          created_at: string | null
          ethnicity: string[] | null
          gender: string | null
          has_children: boolean | null
          id: number
          is_revert: boolean | null
          islamic_knowledge_level: string | null
          life_stage: string | null
          max_commute_willingness: string | null
          preferred_days: string[] | null
          preferred_language: string | null
          preferred_sports: string[] | null
          preferred_times: string[] | null
          revert_year: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          birth_year?: number | null
          children_ages?: number[] | null
          created_at?: string | null
          ethnicity?: string[] | null
          gender?: string | null
          has_children?: boolean | null
          id?: number
          is_revert?: boolean | null
          islamic_knowledge_level?: string | null
          life_stage?: string | null
          max_commute_willingness?: string | null
          preferred_days?: string[] | null
          preferred_language?: string | null
          preferred_sports?: string[] | null
          preferred_times?: string[] | null
          revert_year?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          birth_year?: number | null
          children_ages?: number[] | null
          created_at?: string | null
          ethnicity?: string[] | null
          gender?: string | null
          has_children?: boolean | null
          id?: number
          is_revert?: boolean | null
          islamic_knowledge_level?: string | null
          life_stage?: string | null
          max_commute_willingness?: string | null
          preferred_days?: string[] | null
          preferred_language?: string | null
          preferred_sports?: string[] | null
          preferred_times?: string[] | null
          revert_year?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_program_interactions: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: number
          interaction_type: string | null
          program_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: number
          interaction_type?: string | null
          program_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: number
          interaction_type?: string | null
          program_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_program_interactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "user_program_interactions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "user_program_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_missing_jummah_notifications: { Args: never; Returns: undefined }
      add_ramandan_prayer_notifications: { Args: never; Returns: undefined }
      bytea_to_text: { Args: { data: string }; Returns: string }
      call_get_prayer_data: { Args: never; Returns: Json }
      callprayernotification: {
        Args: { notification_batch: Json }
        Returns: undefined
      }
      delete_expired_notifications_events: { Args: never; Returns: undefined }
      delete_expired_notifications_programs: { Args: never; Returns: undefined }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "http_request"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_delete:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_get:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
        SetofOptions: {
          from: "*"
          to: "http_header"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_list_curlopt: {
        Args: never
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_post:
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_put: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_reset_curlopt: { Args: never; Returns: boolean }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      prayertimechecker: { Args: never; Returns: undefined }
      process_prayer_notifications: { Args: never; Returns: undefined }
      text_to_bytea: { Args: { data: string }; Returns: string }
      update_status_to_received: { Args: never; Returns: undefined }
      urlencode:
        | { Args: { data: Json }; Returns: string }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
