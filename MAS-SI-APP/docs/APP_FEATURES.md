# App Features

The app has 4 main tabs, an auth flow, and several special features. See [Navigation Map](./NAVIGATION_MAP.md) for exact routes.

---

## 1. Home Tab

The landing screen after sign-in. Provides a snapshot of everything happening at MAS SI.

### Prayer Widget
- Current day's Adhan and Iqamah times for all 5 prayers
- Highlights the current/next prayer

### Jummah Schedule
- 4 Jummah sessions: First, Second, Third, Student
- Displays speaker name, topic, and capacity status per session

### Programs Carousel
- Active weekly/recurring programs with quick navigation to details
- Suggested programs based on user preferences

### Business Ads
- Approved business advertisements in a carousel format
- Links to advertiser details

### Donation Quick Links
- Fast access to active donation projects

### Social Media Links
- YouTube, Instagram, TikTok, WhatsApp, Twitter/X, Meta, LinkedIn

### Volunteers
- Link to volunteer signup opportunities

---

## 2. My Library Tab

The user's personal content hub — saved programs, playlists, liked lectures, and notifications.

### My Programs
- Programs the user has added to their library
- Quick access to program details and lectures

### Playlists
- **Custom Playlists** — User-created playlists to organize lectures with custom cover images
- **Quran Playlist** — Curated Quran recitations by various reciters
- **Athkar Playlist** — Remembrance and supplication content

### Liked Lectures
- All favorited program and event lectures in one place
- Statistics with animated counters (view counts)
- Unfavorite/manage from here

### Recorded Lectures
- Complete library of recorded lectures across all programs and events
- Search and filter by program, speaker, or date

### Notifications Center
- Per-program and per-event notification settings
- Prayer notification configuration (Adhan time, Iqamah time, 30 min before)
- Jummah notification settings
- Taraweeh notification settings (during Ramadan)

### Recommendations
- Personalized lecture recommendations based on user preferences and interaction history

### Preferences Onboarding Modal
- Set or update Islamic interests and learning goals from within the library

---

## 3. Prayer Times Tab

Prayer schedule, Quran reader, and Islamic content widgets.

### Weekly Prayer Times Table
- Full weekly schedule with Adhan and Iqamah columns
- Current prayer highlighted
- Data fetched daily from the Masjidal API

### Prayer Notifications
- Configure alerts for each prayer: at Adhan, at Iqamah, or 30 minutes before
- Quiet hours / do-not-disturb configuration

### Quran Reader
- **Surah Browser** — Browse all 114 Surahs
- **Continue Reading** — Resume from last-read Surah and Ayah
- **Bookmarks** — Bookmark specific Ayahs for quick access
- **Favorites** — Like/favorite Surahs and Ayahs

### Qibla Compass
- Direction indicator for prayer orientation (widget placeholder)

### Athkar / Dua / Names of Allah Widgets
- Quick-access widgets for daily remembrance content

### Taraweeh Tracker (Ramadan)
- **Visual Timeline** — Session One and Session Two with break period
- **Juz Progress** — Current Juz being recited, Surah and Ayah markers
- **Imam & Speaker Lineup** — Who is leading each session tonight
- **Capacity Status** — Real-time green/yellow/red indicators
- **Session Details** — Bottom sheet showing full breakdown (first 4 units, speaker, second 4 units, Witr)
- **Notifications** — Alerts for Taraweeh start times and reminders

---

## 4. More Tab

Profile, settings, payments, donations, shopping, and business ads.

### Profile
- Profile picture upload/change
- Name, email, phone
- Member-since date
- Account management

### Preferences Onboarding
Multi-step personalization flow:
- Gender, marital status, children ages
- Weekday and weekend availability
- Language preferences
- Islamic interests and topics
- Priority reminders
- Quiet hours

### Donations
- Browse active donation projects with goals and progress bars
- YouTube video integration for fundraiser content
- Multiple payment methods: Stripe card, Venmo, Zelle
- In-app payment sheet for secure processing
- Visual donation charts

### MAS Shop
- Browse available courses and materials
- Category-based browsing
- Shopping cart with add/remove
- Stripe checkout

### Business Ads Submission
Multi-step form for local business owners:
1. Contact information
2. Business details
3. Flyer/image upload
4. Location selection
5. Duration and subscription plan selection
6. Payment processing

Track submission status and manage approved ads.

### Payment Management
- **Saved Payment Methods** — Add/remove Stripe cards
- **Payment History** — View all past transactions with refund detection
- **Subscriptions** — Manage active recurring subscriptions

### Notification Settings
- Toggle prayer, program, event, and Taraweeh notifications
- General notification preferences

---

## 5. Auth & Onboarding

### Greeting Screen
- Animated intro with floating orbs and video background
- Sign In / Sign Up entry points

### Sign In
- Email/password login
- Google Sign-In
- Apple Sign-In
- Forgot password flow (email reset)

### Sign Up
- Email/password registration
- Google and Apple social sign-up
- Profile setup

### Guest Mode
- Browse content without an account
- Limited functionality (no library, no notifications)

### Onboarding Flow
Shown once after first sign-up:
- Date of birth, gender, marital status
- Children ages
- Weekday/weekend availability
- Language preferences
- Islamic interests
- Priority reminders
- Quiet hours
- Can be skipped and completed later from More tab

---

## 6. Special Features

### What's New Modal
- Feature slideshow showcasing app updates
- Phone mockup UI with animated screens
- Shows only once ever (persisted in AsyncStorage)
- Skip/Continue navigation

### AI-Powered Content
- **AI Summaries** — Auto-generated lecture summaries
- **Keynotes** — AI-extracted key points from lecture content
- Animated "thinking" skeleton while generating
- Rich markdown rendering

### Ramadan Features
- Taraweeh tracking with timeline visualization
- Quran juz progress tracking (official boundaries)
- Taraweeh imam/speaker lineup management
- Capacity status indicators during Taraweeh
- Special Taraweeh notifications

### PACE Learning Programs
- Structured Islamic learning curriculum
- Current, past, and social PACE event browsing

### Kids Programs
- Dedicated children's Islamic education section

### Volunteer Signups
- Community service opportunity listings

### Real-Time Updates
- Supabase Realtime subscriptions for live data: programs, events, capacity status, notifications

### Capacity Status
- Green / Yellow / Red / Off indicators for mosque capacity
- Displayed on Jummah schedule and Taraweeh tracker
- Users can subscribe to capacity alerts
