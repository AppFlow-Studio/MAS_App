# Backend Services

All server-side logic runs as Supabase Edge Functions (Deno runtime) under `supabase/functions/`.

---

## Edge Functions Inventory

### Push Notification Pipeline

The notification system follows a 4-stage pipeline: **Schedule → Send → Track Receipts → Cleanup**.

#### 1. Prayer Notification Scheduler
`prayer-notification-scheduler/index.ts`

Daily cron job that builds the notification schedule for all users.

- Fetches prayer times from `todays_prayers`
- Paginates through 8,000+ user profiles with push tokens
- Builds notifications for 3 types: "Alert at Athan time", "Alert at Iqamah time", "Alert 30 mins before next prayer"
- Supports Jummah (Friday only) and Taraweeh (Ramadan: Feb 17 – Mar 20, 2026)
- Bulk inserts into `prayer_notification_schedule`
- Optimized to ~6 DB calls per invocation (down from ~42)
- Timezone: EST (UTC-5)

#### 2. Program Notification Scheduler
`program-notification-scheduler/index.ts`

Daily cron job for program and event notifications.

- Reads `program_notifications_settings` and `event_notification_settings`
- Supports 3 types: "Day Before", "When Program Starts", "30 Mins Before"
- Batch-fetches tokens, programs, and events
- Inserts into `program_notification_schedule`
- Optimized to ~6 DB calls (down from 300+)

#### 3. Send Prayer Notification
`send-prayer-notification/index.ts`

Sends buffered notifications to Expo Push Service.

- Receives batch of notifications with Expo push tokens
- Chunks into 100 per Expo API request
- Validates tokens (must start with `ExponentPushToken[` or `ExpoPushToken[`)
- Cleans up invalid tokens from `profiles`
- Stores ticket IDs in `push_notification_tickets`
- Retry logic: exponential backoff, respects `Retry-After` header
- Hard timeout: 100s (edge function limit: 150s)
- Max parallel requests: 3

#### 4. Check Push Receipts
`check-push-receipts/index.ts`

Polls Expo for delivery status of sent notifications.

- Fetches unfetched tickets older than 15 minutes
- Chunks ticket IDs (max 300 per Expo API call)
- Marks receipts as "ok" or "error"
- Cleans up `DeviceNotRegistered` tokens from `profiles`
- Deletes fetched rows older than 48 hours
- Processes max 3,000 tickets per invocation

#### 5. Cleanup Stale Tokens
`cleanup-stale-tokens/index.ts`

Weekly audit of push token quality.

- Analyzes tickets from last 7 days
- Identifies tokens with >50% error rate AND 5+ sends
- Nullifies stale tokens in `profiles`

#### 6. Send Program Notification
`send-program-notification/index.ts`

Legacy/basic sender for program notifications. Similar pattern to prayer notification sender.

---

### Stripe Payment Integration

#### Checkout & Setup

| Function | Purpose |
|----------|---------|
| `stripe--checkout/index.ts` | Creates PaymentIntent for donations. Supports card-saving with `setup_future_usage: 'off_session'`. Returns client_secret, ephemeralKey, publishableKey, customer ID. |
| `create-setup-intent/index.ts` | Creates SetupIntent for saving a card without charging. Returns setupIntent secret, ephemeralKey, customer ID. |
| `verify-checkout-session/index.ts` | Verifies checkout completion. Handles "setup" and "subscription" modes. Sets default payment method after success. |

#### Card Management

| Function | Purpose |
|----------|---------|
| `get-payment-methods/index.ts` | Lists saved cards (brand, last4, expiry, ID). |
| `delete-payment-method/index.ts` | Detaches a saved card after verifying ownership. |
| `charge-saved-card/index.ts` | Charges a saved card off-session. Handles 3D Secure with HTTP 402. |

#### Subscriptions

| Function | Purpose |
|----------|---------|
| `get-user-subscriptions/index.ts` | Lists active subscriptions with product names, billing period, price. |
| `cancel-subscription/index.ts` | Cancels immediately or at period end. Verifies ownership. |

#### Business Ad Payments

| Function | Purpose |
|----------|---------|
| `create-business-subscription/index.ts` | Creates checkout session for ad plans (Monthly, 3-Month $135, 1-Year $480). |
| `activate-business-subscription/index.ts` | Called on admin approval. Atomically sets status to PROCESSING, charges via Stripe, adds $100 onboarding fee for first ad, sends confirmation email, updates status to POSTED. Rolls back to APPROVED on failure. |

#### Payment History

| Function | Purpose |
|----------|---------|
| `get-payment-history/index.ts` | Lists PaymentIntents (100 max) with charge details, refund detection, payment method info (card/apple_pay, brand, last4). |

#### Shared Utilities

| File | Purpose |
|------|---------|
| `_utils/stripe.ts` | Stripe client initialization with `STRIPE_SECRET_KEY`. |
| `_utils/supabase.ts` | `createOrRetrieveProfile(req)` — Gets or creates Stripe customer. Dual client pattern: user client (RLS) + admin client (bypass RLS). |

---

### Email System (Resend API)

#### Business Ad Emails
`resend/index.ts`

- **Admin notification** — New submission details with flyer image
- **User confirmation** — Application received, next steps
- **Rejection** — Rejection email with guidelines

#### Signup Welcome
`send-signup-email/index.ts`

- Triggered by Supabase auth webhook
- Resend SDK with webhook signature verification
- Welcome email with confirmation code

#### Donation Receipts
`donation-confirmation-email/index.ts`

- **Donation path** — Receipt with amount, EIN (93-3443674), tax-deductible language
- **Feedback path** — Sends to admin + confirmation to user

#### Shared Email Template
`_shared/email-template.ts`

Reusable HTML template with components:
- highlight-box, details-table, steps-list, dua, image, text
- Color variants: green, amber, blue
- MAS SI branding with logo
- Responsive design

---

### Utility Functions

| Function | Purpose |
|----------|---------|
| `getPrayerData/index.ts` | Fetches prayer times from Masjidal API (masjid_id: 3OA8V3Kp). Updates `prayers` and `todays_prayers` tables daily. |
| `delete-user/index.ts` | Deletes user from Supabase auth using admin privileges. |
| `create_stripe_product/index.ts` | Legacy function — iterates paid programs and creates Stripe products with monthly recurring prices. |
| `prayer-scheduler-test/index.ts` | Testing/diagnostic for the scheduler. |

---

## Scheduled Jobs

Edge functions are invoked via HTTP POST. No Supabase-native cron is configured. Expected external scheduling:

| Function | Frequency |
|----------|-----------|
| `prayer-notification-scheduler` | 1-2x daily |
| `program-notification-scheduler` | 1-2x daily |
| `getPrayerData` | Daily |
| `check-push-receipts` | Every 15 min – 1 hour |
| `cleanup-stale-tokens` | Weekly |

---

## Payment Flow Diagrams

### Donation Flow
```
User selects amount → stripe--checkout (PaymentIntent) → Stripe PaymentSheet
→ Payment confirmed → donation-confirmation-email → Receipt sent
```

### Business Ad Flow
```
User submits ad → create-business-subscription (Checkout Session)
→ Card saved → Admin reviews → approve → activate-business-subscription
→ Charge card → resend (confirmation email) → Ad goes live
```

### Saved Card Flow
```
User adds card → create-setup-intent → Stripe SetupIntent → Card saved
User pays later → charge-saved-card → Off-session PaymentIntent → Confirmed
```

### Notification Flow
```
Daily cron → prayer-notification-scheduler → Inserts to schedule table
Trigger time → send-prayer-notification → Expo Push Service → Device
15+ min later → check-push-receipts → Mark delivered / clean bad tokens
Weekly → cleanup-stale-tokens → Remove unreliable tokens
```
