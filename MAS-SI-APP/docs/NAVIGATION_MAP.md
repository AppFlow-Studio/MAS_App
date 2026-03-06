# Navigation Map

Full Expo Router route tree for `src/app/`. The app uses file-based routing with nested stack navigators per tab.

---

## Root Layout (`_layout.tsx`)

Providers wrapped around the entire app:
- QueryClientProvider (TanStack Query)
- StripeProvider
- AuthProvider
- DeepLinkProvider
- NotificationProvider
- BottomSheetModalProvider
- PaperProvider
- MenuProvider

### Root Stack Screens

| Route | Screen | Notes |
|-------|--------|-------|
| `(user)` | Main app (tabs) | Authenticated users |
| `(auth)` | Auth flow | Sign in/up/onboarding |
| `WhatsNew` | What's New modal | Shows once ever |
| `ForgotPassword` | Password reset | Email-based recovery |
| `AppStorePreview` | App store preview | Marketing screen |
| `+not-found` | 404 fallback | |

---

## Auth Stack (`(auth)/_layout.tsx`)

| Route | Screen |
|-------|--------|
| `GreetingScreen` | Animated intro with sign in/up options |
| `Onboarding` | Multi-step preferences (auto-shown if not completed) |
| `SignIn` | Email, Google, Apple sign-in |
| `SignUp` | Registration with profile setup |

---

## Main App — 4 Tabs (`(user)/_layout.tsx`)

| Tab | Route Name | Icon | Label |
|-----|-----------|------|-------|
| 1 | `menu` | house.fill | Home |
| 2 | `myPrograms` | book | My Library |
| 3 | `prayersTable` | clock | Prayer Times |
| 4 | `more` | ellipsis.bubble.fill | More |

`(user)/index.tsx` redirects to `/(user)/menu`.

---

### Tab 1: Home (`menu/`)

```
menu/
├── index.tsx                          # Home screen
├── VolunteersModal/
│   └── Volunteers.tsx                 # Volunteer opportunities
└── program/
    ├── _layout.tsx                    # Programs stack
    ├── programsAndEventsScreen.tsx    # Programs & events list
    ├── [programId].tsx                # Program details
    ├── allPrograms.tsx                # All programs grid
    ├── lectures/
    │   └── [lectureID].tsx            # Program lecture player
    ├── events/
    │   ├── [event_id].tsx             # Event details
    │   └── event_lectures/
    │       └── [events_lecture_id].tsx # Event lecture player
    ├── upcomingEvents/
    │   ├── _layout.tsx
    │   └── index.tsx                  # Calendar view
    ├── programInfo/
    │   └── [program_id].tsx           # Program info sheet
    ├── eventInfo/
    │   └── [event_id].tsx             # Event info sheet
    ├── pace/
    │   ├── Pace.tsx                   # PACE program list
    │   └── [paceId].tsx               # PACE details
    └── kids/
        └── Kids.tsx                   # Kids programs
```

---

### Tab 2: My Library (`myPrograms/`)

```
myPrograms/
├── _layout.tsx                        # Library stack
├── index.tsx                          # Library home
├── [programId].tsx                    # Saved program details
├── PlaylistIndex.tsx                  # Playlist management
├── PreferencesOnboardingModal.tsx     # Edit preferences
├── RecommendedForYou.tsx              # Personalized recommendations
├── recordedLectures.tsx               # All recorded lectures
├── events/
│   └── [event_id].tsx                 # Saved event details
├── lectures/
│   └── [lectureID].tsx                # Program lecture player
├── eventLectures/
│   └── [lectureID].tsx                # Event lecture player
├── likedLectures/
│   └── AllLikedLectures.tsx           # All liked lectures
├── playlists/
│   ├── [playlist_id].tsx              # Custom playlist
│   ├── AthkarPlaylist.tsx             # Athkar content
│   └── QuranPlaylist.tsx              # Quran recitations
├── quran/
│   └── QuranVideo.tsx                 # Quran video player
├── athkar/
│   └── AthkarVideo.tsx                # Athkar video player
├── programs/
│   └── [programId].tsx                # Program details (alt route)
└── notifications/
    ├── _layout.tsx
    ├── index.tsx                      # Notification center
    ├── NotificationEvents.tsx         # Event notification settings
    ├── ClassesAndLectures/
    │   └── [program_id].tsx           # Program notification settings
    ├── Prayer/
    │   ├── [prayerDetails].tsx        # Prayer notification config
    │   ├── Jummah/
    │   │   └── [jummahDetails].tsx    # Jummah notification config
    │   └── Tarawih/
    │       └── [tarawihDetails].tsx   # Taraweeh notification config
    └── [event_id].tsx                 # Event notification details
```

---

### Tab 3: Prayer Times (`prayersTable/`)

```
prayersTable/
├── _layout.tsx                        # Prayer stack
├── index.tsx                          # Weekly prayer schedule
├── alertBell.tsx                      # Prayer alert settings
└── Quran/
    ├── Quran.tsx                      # Quran home (tabs)
    ├── ContinueQuran.tsx              # Resume reading
    ├── FavoriteQuran.tsx              # Favorited surahs
    ├── BookmarkQuran.tsx              # Bookmarked content
    └── surahs/
        ├── Surahs.tsx                 # Surah list
        ├── [surah_id].tsx             # Surah reader
        └── RenderSurahs.tsx           # Surah renderer
```

---

### Tab 4: More (`more/`)

```
more/
├── _layout.tsx                        # More stack
├── index.tsx                          # More menu
├── ProfilePage.tsx                    # User profile
├── PreferencesOnboarding.tsx          # Preferences setup
├── NotificationSettings.tsx           # Notification prefs
├── NotificationCenter.tsx             # Notification history
├── BusinessAds.tsx                    # Submit business ad
├── BusinessStatus.tsx                 # Submission status
├── BusinessSubmissions/
│   └── [user_id].tsx                  # User's submissions
├── BusinessSubscriptions.tsx          # Ad subscriptions
├── BusinessSponsersScreen.tsx         # Sponsor info
├── PaymentProcessing.tsx              # Stripe payment modal
├── PaymentHistory.tsx                 # Transaction history
├── PaymentMethods.tsx                 # Saved cards
├── Donation.tsx                       # Donation home
├── DonationCategoires/
│   └── [project_id].tsx               # Donation project
├── MasShop.tsx                        # Shop entry
├── MasShopHomeScreen.tsx              # Shop home
├── ShopCategories.tsx                 # Shop categories
├── UserCart/
│   └── [user_id].tsx                  # Shopping cart
├── ProgramsPage/
│   └── [program_id].tsx               # Program purchase
└── Admin/                             # Admin-only screens
    ├── AdminScreen.tsx                # Admin panel home
    ├── ProgramsScreen.tsx             # Manage programs
    ├── EventsScreen.tsx               # Manage events
    ├── SpeakersScreen.tsx             # Manage speakers
    ├── ProgramLecturesScreen.tsx      # Manage program lectures
    ├── EventLecturesScreen.tsx        # Manage event lectures
    ├── AddNewProgramScreen.tsx        # Create program
    ├── AddNewEventScreen.tsx          # Create event
    ├── AddNewSpeaker.tsx              # Create speaker
    ├── UpdateProgramScreen.tsx        # Edit program
    ├── UpdateProgramHomeScreen.tsx    # Edit program home
    ├── UpdateProgramLectures.tsx      # Edit program lectures
    ├── UploadProgramLectures.tsx      # Upload program lectures
    ├── UpdateEventScreen.tsx          # Edit event
    ├── UpdateEventHomeScreen.tsx      # Edit event home
    ├── UpdateEventLectures.tsx        # Edit event lectures
    ├── UploadEventLectures.tsx        # Upload event lectures
    ├── DeleteProgramScreen.tsx        # Delete program
    ├── DeleteEventScreen.tsx          # Delete event
    ├── DeleteSpeakers.tsx             # Delete speaker
    ├── EditSpeakerInfo.tsx            # Edit speaker
    ├── SendToEveryoneScreen.tsx       # Broadcast notification
    ├── ProgramsNotificationScreen.tsx # Program notifications
    ├── EventsNotificationScreen.tsx   # Event notifications
    ├── NotiPrograms.tsx               # Program notification list
    ├── NotiEvents.tsx                 # Event notification list
    ├── ApproveBusinessScreen.tsx      # Review ad submissions
    ├── ApprovedAdsScreen.tsx          # Manage approved ads
    ├── BusinessAdsApprovalScreen.tsx  # Ad approval details
    ├── CapacityStatusAdmin.tsx        # Mosque capacity controls
    ├── RamadanQuranTracker.tsx        # Quran progress admin
    ├── TaraweehLineupAdmin.tsx        # Taraweeh lineup config
    ├── ManagePreferencesScreen.tsx    # Interest/goal management
    ├── JummahDetails/
    │   └── [jummah_id].tsx            # Jummah session editor
    ├── CreateNewDonationProject.tsx   # New donation project
    └── EditDonationCategory.tsx       # Edit donation project
```

---

## Screen Count Summary

| Section | Screens |
|---------|---------|
| Root | 5 |
| Auth | 4 |
| Home tab | ~15 |
| My Library tab | ~25 |
| Prayer Times tab | ~10 |
| More tab | ~20 |
| Admin | ~35 |
| **Total** | **~114** |
