# Data Model

All data is stored in Supabase (Postgres). TypeScript types are auto-generated in `database.types.ts`. Application-level types are in `src/types.ts` and `src/types/preferences.ts`.

---

## Tables

### Core Content

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `programs` | Weekly/recurring programs | name, desc, speaker, start/end dates, day of week, pricing, image, is_paid, has_lectures |
| `program_lectures` | Lectures within a program | lecture_name, lecture_link (YouTube), lecture_speaker, lecture_date, lecture_ai_summary, lecture_ai_keynotes, lecture_program (FK → programs) |
| `events` | One-time events | event_name, event_desc, event_speaker, event_date, event_img, has_lectures |
| `events_lectures` | Lectures within an event | event_lecture_name, event_lecture_link, event_lecture_speaker, event_lecture_date, event_lecture_ai_summary, event_lecture_ai_keynotes, event_id (FK → events) |
| `speaker_data` | Speaker/imam profiles | speaker_name, speaker_creds (array), speaker_img |

### Jummah & Taraweeh

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `jummah` | Jummah session info | jummah_topic, jummah_speaker (FK → speaker_data), prayer_time, capacity_status |
| `taraweeh_lineup` | Nightly taraweeh lineups | date, lineup (JSONB — imams, speakers per session) |

### User Library & Interactions

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `added_programs` | User's saved programs | user_id, program_id |
| `liked_lectures` | User's liked program lectures | user_id, lecture_id |
| `liked_event_lectures` | User's liked event lectures | user_id, event_lecture_id |
| `user_playlist` | User-created playlists | user_id, playlist_name, playlist_img |
| `user_playlist_lectures` | Lectures in playlists | playlist_id, lecture_id |
| `user_cart` | Shopping cart items | user_id, program_id/event_id, quantity, price |
| `user_program_interactions` | Interaction tracking | user_id, program_id/event_id, interaction type, timestamp |
| `recommendation_log` | Recommendation engine logs | user_id, scores, interactions, score_breakdown (JSONB) |

### Quran

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `user_bookmarked_ayahs` | Bookmarked verses | user_id, surah_number, ayah_number |
| `user_bookmarked_surahs` | Bookmarked chapters | user_id, surah_number |
| `user_liked_ayahs` | Liked verses | user_id, surah_number, ayah_number |
| `user_liked_surahs` | Liked chapters | user_id, surah_number |
| `user_continue_read` | Reading progress | user_id, surah, ayah, juz |
| `quran_playlist` | Quran recitations | reciter (FK → speaker_data), surah, youtube_id |
| `ramadan_quran_tracker` | Ramadan recitation progress | juz, surah, ayah data |

### Prayer Times

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `prayers` | Full prayer schedule | JSON with athan and iqamah times |
| `todays_prayers` | Today's prayer times | fajr, dhuhr, asr, maghrib, isha (athan + iqamah) |

### Notifications

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `prayer_notification_settings` | User prayer alert prefs | user_id, prayer_name, notification_type ("Alert at Athan time", "Alert at Iqamah time", "Alert 30 mins before next prayer") |
| `jummah_notifications` | User Jummah alert prefs | user_id, jummah session, notification_type |
| `program_notifications_settings` | User program alert prefs | user_id, program_id, notification_type ("Day Before", "When Program Starts", "30 Mins Before") |
| `event_notification_settings` | User event alert prefs | user_id, event_id, notification_type |
| `added_notifications_programs` | Programs with notifications on | user_id, program_id |
| `added_notifications_events` | Events with notifications on | user_id, event_id |
| `prayer_notification_schedule` | Scheduled prayer notifications | user_id, push_token, prayer, scheduled_time, sent |
| `program_notification_schedule` | Scheduled program notifications | user_id, push_token, program/event, scheduled_time, sent |
| `push_notification_tickets` | Expo delivery receipts | ticket_id, push_token, status, receipt_fetched |

### User Preferences

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `user_preferences` | Demographic & lifestyle | user_id, birth_year, gender, life_stage, islamic_knowledge_level, preferred_days, preferred_times, preferred_languages, preferred_sports, commute_willingness, revert_status |
| `islamic_interest_categories` | Interest taxonomy | name, description, parent_id (self-referential hierarchy) |
| `user_islamic_interests` | User's selected interests | user_id, interest_id (FK → islamic_interest_categories), interest_level (1-5) |
| `islamic_goals` | Goal options | name, description |
| `user_islamic_goals` | User's selected goals | user_id, goal_id (FK → islamic_goals), priority, target_date |

### Program Metadata

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `program_tags` | Categorization tags | name, maps_to_interest_id (FK → islamic_interest_categories) |
| `program_tag_assignments` | Tag → program/event mapping | tag_id, program_id/event_id, relevance_weight |
| `program_islamic_interests` | Interest → program mapping | program_id, interest_id |
| `program_islamic_goals` | Goal → program mapping | program_id, goal_id |
| `event_islamic_interests` | Interest → event mapping | event_id, interest_id |
| `event_islamic_goals` | Goal → event mapping | event_id, goal_id |
| `program_forms` | Forms/questionnaires | program_id, form data |
| `program_event_preferences` | User preferences for types | user_id (placeholder — empty migration) |

### Business & Donations

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `business_ads_submissions` | Ad applications | user_id, contact info, business details, flyer_url, status, plan |
| `approved_business_ads` | Live advertisements | business name, flyer, link, expiration |
| `projects` | Donation campaigns | name, description, goal_amount, linked_projects (self-referential) |
| `donations` | Donation transactions | user_id, project_id, amount |

### User Profiles

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `profiles` | User accounts | id (FK → auth.users), first_name, last_name, email, phone, profile_pic, role, stripe_id, push_notification_token |
| `capacity_alert_subscribers` | Capacity alert opt-ins | user_id (FK → profiles) |

---

## Storage Buckets

| Bucket | Purpose |
|--------|---------|
| `fliers` | Program and project flyers/images |
| `event_flyers` | Event promotional images |
| `sheikh_img` | Speaker/imam profile photos |
| `profile_pic` | User profile pictures |
| `user_playlist_img` | Custom playlist cover images |
| `business_flyers` | Business ad flyer images |

---

## Row-Level Security (RLS)

All 57 tables have RLS enabled. Key patterns:

### Public Read, Authenticated Write
Most content tables (`programs`, `events`, `speaker_data`, `profiles`) are readable by everyone. Inserts, updates, and deletes require authentication with `user_id = auth.uid()`.

### User-Scoped Access
User data tables (`added_programs`, `liked_lectures`, `user_playlist`, `user_bookmarked_ayahs`, etc.) enforce that users can only read and write their own rows via `user_id = auth.uid()` checks on all operations.

### Admin Access
`capacity_alert_subscribers` has a special policy granting admin read access to all rows.

### Service-Role Only
`push_notification_tickets` is accessible only via service-role key (edge functions), not from the client.

### Storage Policies
`user_playlist_img` and `business_flyers` use folder-based policies where each user can only access files within their own `auth.uid()` subfolder.

---

## Key Relationships

```
programs ←── program_lectures
events ←── events_lectures
speaker_data ←── jummah (speaker)
speaker_data ←── quran_playlist (reciter)
profiles ←── user_preferences (1:1)
profiles ←── capacity_alert_subscribers (1:1)
islamic_interest_categories ←── user_islamic_interests
islamic_interest_categories ←── program_islamic_interests
islamic_interest_categories ←── event_islamic_interests
islamic_interest_categories ←── program_tags (maps_to_interest_id)
islamic_goals ←── user_islamic_goals
projects ←── projects (self-referential linked projects)
```
