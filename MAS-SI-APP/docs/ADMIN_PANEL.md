# Admin Panel

The admin panel is accessible from the **More** tab for users with an admin role. All admin screens live under `src/app/(user)/more/Admin/`.

---

## Programs Management

### Create Program
- Name, description, speaker assignment
- Start/end dates and times
- Day of the week
- Pricing (free or paid with Stripe product)
- Program image/flyer upload

### Update Program
- Edit all program fields
- Update program home screen content

### Upload / Manage Lectures
- Add lectures with YouTube video links
- Assign speaker to each lecture
- Set lecture date and time
- AI summary and keynote generation
- Edit or remove existing lectures

### Delete Program
- Remove program and associated data

---

## Events Management

### Create Event
- Name, description, speaker assignment
- Event date and time
- Event image/flyer upload

### Update Event
- Edit all event fields
- Update event home screen content

### Upload / Manage Lectures
- Add event lectures with video links
- Assign speakers
- Set date/time
- AI summary and keynote content
- Edit or remove lectures

### Delete Event
- Remove event and associated data

---

## Speakers Management

### Add Speaker
- Name and credentials
- Profile photo upload (stored in `sheikh_img` bucket)
- Bio information

### Edit Speaker
- Update name, credentials, photo

### Delete Speaker
- Remove speaker profile

---

## Push Notifications

### Broadcast to Everyone
- Send push notification to all users with registered tokens
- Custom title and body

### Program-Specific Notifications
- Target users subscribed to a specific program
- Select program, compose notification

### Event-Specific Notifications
- Target users subscribed to a specific event
- Select event, compose notification

---

## Business Ads

### Review Submissions
- View pending business ad applications
- See contact info, business details, flyer preview

### Approve / Reject
- **Approve** — Triggers payment charge via `activate-business-subscription` edge function, sends confirmation email, moves ad to approved list
- **Reject** — Sends rejection email with guidelines via Resend

### Manage Approved Ads
- Edit approved ad details
- Remove ads from rotation

---

## Jummah Management

4 configurable Jummah sessions:

| Session | Fields |
|---------|--------|
| First Jummah | Topic, Speaker, Time, Capacity Status |
| Second Jummah | Topic, Speaker, Time, Capacity Status |
| Third Jummah | Topic, Speaker, Time, Capacity Status |
| Student Jummah | Topic, Speaker, Time, Capacity Status |

Capacity status options: Green, Yellow, Red, Off

---

## Ramadan Features

### Taraweeh Lineup Admin
- Configure imam and speaker assignments per date
- Set Session One and Session Two leaders
- JSONB-based lineup storage per night

### Quran Tracker
- Update current Juz, Surah, and Ayah progress
- Displayed on the Taraweeh tracker timeline for all users

---

## Capacity Status

Real-time mosque capacity indicators:
- **Green** — Plenty of space
- **Yellow** — Filling up
- **Red** — At capacity
- **Off** — Not tracking

Applied to Jummah sessions and Taraweeh. Users see the indicator on the Home tab and Prayer Times tab.

---

## Preferences Management

### Interest Categories
- Manage Islamic interest categories (hierarchical with parent categories)
- Map categories to programs and events for recommendation matching

### Islamic Goals
- Manage goal options available during onboarding
- Track which goals are associated with programs/events

### Program Tags
- Create and assign tags to programs/events
- Tags map to interest categories with relevance weights

---

## Donations (Currently Disabled)

### Create Donation Project
- Project name, description, goal amount
- Linked projects (related campaigns)
- Flyer image

### Edit Donation Category
- Update project details and goals
