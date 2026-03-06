# MAS Staten Island App Documentation

The MAS Staten Island app is a comprehensive community hub for the Muslim American Society of Staten Island. It provides Islamic learning resources, prayer times, event management, a donation platform, and business advertising — all in one integrated mobile experience.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native / Expo (Expo Router) |
| Backend | Supabase (Postgres, Auth, Realtime, Storage, Edge Functions) |
| State Management | TanStack Query (React Query) |
| Styling | NativeWind (Tailwind CSS) + React Native Paper |
| Payments | Stripe (PaymentSheet, subscriptions, saved cards) |
| Notifications | Expo Push Notifications |
| Emails | Resend API |
| Auth Providers | Email/Password, Google OAuth, Apple Sign-In |

## Documentation Index

| Document | Description |
|----------|-------------|
| [App Features](./APP_FEATURES.md) | Complete feature breakdown across all tabs |
| [Admin Panel](./ADMIN_PANEL.md) | Admin-only management screens and capabilities |
| [Data Model](./DATA_MODEL.md) | Supabase tables, storage buckets, and RLS overview |
| [Backend Services](./BACKEND_SERVICES.md) | Edge functions, push notifications, Stripe, and email pipelines |
| [Navigation Map](./NAVIGATION_MAP.md) | Full Expo Router route tree and screen hierarchy |

## Project Structure

```
src/
├── app/                  # Expo Router screens & layouts
│   ├── (auth)/           # Auth flow (sign in, sign up, onboarding)
│   ├── (user)/           # Main app (4 tabs)
│   │   ├── menu/         # Home tab
│   │   ├── myPrograms/   # My Library tab
│   │   ├── prayersTable/ # Prayer Times tab
│   │   └── more/         # More tab + Admin panel
│   ├── WhatsNew.tsx      # What's New modal
│   └── _layout.tsx       # Root providers
├── components/           # Shared UI components
├── hooks/                # Custom React hooks (TanStack Query)
├── lib/                  # Utilities & config
├── providers/            # Context providers (Auth, Notifications)
└── types/                # TypeScript type definitions
supabase/
├── functions/            # Edge functions (notifications, Stripe, email)
├── migrations/           # Database schema migrations
└── config.toml           # Supabase project config
```

## Key Architectural Decisions

- **TanStack Query** for all data fetching with tiered stale times: 2min (user data), 5min (programs/events), 30min (speaker/reference data)
- **Supabase Realtime** subscriptions for cache invalidation (not direct state updates)
- **Expo Router** file-based routing with nested stacks per tab
- **Edge Functions** for server-side logic (Deno runtime) — notifications, payments, email
