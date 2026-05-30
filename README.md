# CricBudz 🏏

Fantasy cricket application powered by live IPL match and player data using Cricbuzz APIs via RapidAPI.

---

# Project Overview

CricBudz is a fantasy cricket platform focused on the Indian Premier League (IPL). The app currently supports:

* Live IPL match schedule sync
* Player sync by IPL team
* Firebase-based authentication and Firestore storage
* Match cards with player listing
* User login support
* Firestore-backed match/player data instead of mock data

The project is designed to scale toward:

* 3-player fantasy squad creation
* MVP player tagging
* AI-assisted player recommendations
* Match analytics and insights
* Fantasy scoring engine
* Live match intelligence

---

# Tech Stack

## Frontend

* Next.js 15
* React
* TypeScript
* Tailwind CSS

## Backend / APIs

* Next.js App Router API routes
* RapidAPI (Cricbuzz Cricket API)
* https://rapidapi.com/cricketapilive/api/cricbuzz-cricket

## Database & Authentication

* Firebase Firestore
* Firebase Authentication
* Firebase Admin SDK (server-side writes)
* https://console.firebase.google.com/u/0/project/gen-lang-client-0759118211/overview?utm_source=chatgpt.com

## Hosting (Recommended)

* Vercel (Frontend + API routes)
* Firebase (Auth + Firestore)

---

# Project Structure

```txt
# Project Structure
cricbudz/
│
├── src/
│   ├── app/                          # Next.js App Router Core
│   │   ├── api/
│   │   │   └── sync/
│   │   │       └── route.ts         # Server-side ETL pipeline (Matches + Players)
│   │   │
│   │   ├── dashboard/
│   │   │   └── page.tsx             # Active tracking boards & entry portals
│   │   │
│   │   ├── matches/
│   │   │   ├── [id]/
│   │   │   │   ├── _components/
│   │   │   │   │   ├── PlayerCard.tsx        # High-performance roster item
│   │   │   │   │   ├── SelectedSlots.tsx     # Trio row state tracker
│   │   │   │   │   └── SubmissionControl.tsx # Active rule status & lock bar
│   │   │   │   └── page.tsx         # Trio Selection Arena Parent Controller
│   │   │   └── page.tsx             # Live fixture schedules
│   │   │
│   │   ├── globals.css              # Typography & customized component tokens
│   │   ├── layout.tsx               # Base HTML structure & viewport injection
│   │   └── page.tsx                 # Application gateway
│   │
│   ├── components/
│   │   └── Navbar.tsx               # Sticky navigation wrapper
│   │
│   ├── config/
│   │   └── cricket.ts               # IPL Context Configuration (Series/Year IDs)
│   │
│   ├── context/
│   │   └── AuthContext.tsx          # React Session state broadcast layer
│   │
│   ├── lib/
│   │   ├── firebase-admin.ts        # Privileged Server-Side Admin SDK Core
│   │   ├── firebase.ts              # Client-Side configuration portal
│   │   ├── rapidapi.ts              # Base Axios instances for Cricbuzz routing
│   │   └── utils.ts                 # Classname mergers (clsx/tailwind-merge)
│   │
│   ├── services/
│   │   └── dataService.ts           # Firestore transactional read/write abstractions
│   │
│   └── types/
│       └── index.ts                 # Declarations for Matches, Players, and Squads
│
├── next.config.ts                  # Remote pattern policies & Next.js engine settings
├── package.json                    # Package metadata & script commands
└── README.md                       # Documentation hub
```

---

# Current Features

## 1. Login Feature

Authentication is implemented using:

* Firebase Authentication

Current flow:

```txt
User Login
→ Firebase Auth
→ User Session
→ Fantasy Squad Save Capability
```

Relevant file:

```txt
src/lib/firebase.ts
```

Current supported feature:

* Logged-in user squad saving

Future enhancements:

* Google Sign-in
* Guest mode
* Profile page
* Saved fantasy history

---

## 2. IPL Match Sync

### Route

```txt
/api/sync
```

File:

```txt
src/app/api/sync/route.ts
```

This route:

1. Fetches IPL schedule
2. Parses fixtures
3. Stores matches in Firestore
4. Fetches players for each IPL team
5. Stores players in Firestore

### API Called

#### IPL Schedule

Endpoint:

```txt
https://cricbuzz-cricket.p.rapidapi.com/series/v1/9241
```

Purpose:

* Fetches IPL 2026 schedule
* Includes league matches
* Includes playoffs
* Includes final

Response includes:

* Match ID
* Team details
* Venue
* Match time
* Match state
* Series info

#### Team Players

Endpoint:

```txt
https://cricbuzz-cricket.p.rapidapi.com/teams/v1/{teamId}/players
```

Example:

```txt
https://cricbuzz-cricket.p.rapidapi.com/teams/v1/59/players
```

Purpose:

Fetches:

* Batters
* Bowlers
* All-rounders
* Wicket keepers

Used to populate fantasy player pool.

---

# Database

## Database Type

Firebase Firestore

## Database Name

Named Firestore Database:

```txt
ai-studio-b7247bb1-86cb-432e-9975-eaf84ce93c2b
```

Project ID:

```txt
gen-lang-client-0759118211
```

---

# Firestore Collections

## matches

Stores IPL fixtures.

Example schema:

```json
{
  "id": "152240",
  "seriesId": 9241,
  "team1Id": 255,
  "team2Id": 59,
  "team1": "SRH",
  "team2": "RCB",
  "date": "2026-05-22T14:00:00.000Z",
  "venue": "Ground Name",
  "city": "Hyderabad",
  "status": "Upcoming",
  "matchDesc": "67th Match",
  "seriesName": "Indian Premier League 2026",
  "updatedAt": "timestamp"
}
```

## players

Stores unique IPL players.

Example schema:

```json
{
  "id": "8497",
  "name": "Virat Kohli",
  "team": "RCB",
  "teamId": 59,
  "role": "BATSMEN",
  "price": 10.5,
  "battingStyle": "Right-hand bat",
  "bowlingStyle": "Right-arm medium",
  "imageId": 12345,
  "updatedAt": "timestamp"
}
```

## userSquads

Stores user fantasy teams.

Example schema:

```json
{
  "userId": "uid",
  "matchId": "152240",
  "players": ["123", "456"],
  "mvpId": "123",
  "createdAt": 123456789
}
```

---

# Configuration

## Cricket Config

File:

```txt
src/config/cricket.ts
```

Purpose:

Central place to manage IPL season.

Example:

```ts
export const CRICKET_CONFIG = {
  IPL_SERIES_ID: '9241',
  IPL_SEASON: '2026',
};
```

To move to IPL 2027:

Only update:

```txt
IPL_SERIES_ID
IPL_SEASON
```

No other code changes required.

---

# Environment Variables

File:

```txt
.env.local
```

Required variables:

```env
RAPIDAPI_KEY=
RAPIDAPI_HOST=cricbuzz-cricket.p.rapidapi.com

NEXT_PUBLIC_GEMINI_API_KEY=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_DATABASE_ID=
```

### Variable Purpose

#### RAPIDAPI_KEY

Used to authenticate Cricbuzz API requests.

#### RAPIDAPI_HOST

RapidAPI Cricbuzz hostname.

#### FIREBASE_PROJECT_ID

Firebase project identifier.

#### FIREBASE_CLIENT_EMAIL

Firebase Admin SDK service account email.

#### FIREBASE_PRIVATE_KEY

Private key for Firebase Admin writes.

#### FIREBASE_DATABASE_ID

Named Firestore database ID.

---

# Important Files

## src/lib/rapidapi.ts

Responsible for:

* API calling
* RapidAPI fetch logic
* Cricbuzz endpoints

Functions:

```ts
getIPLSeries()
getTeamPlayers(teamId)
```

---

## src/app/api/sync/route.ts

Responsible for:

* Syncing IPL fixtures
* Syncing players
* Firestore writes

Route:

```txt
/api/sync
```

Recommended usage:

* Manual trigger during development
* Scheduled job later

---

## src/services/dataService.ts

Responsible for:

* Fetch matches
* Fetch players
* Save user squads
* Get user squads

---

## src/lib/firebase.ts

Client-side Firebase.

Used for:

* Auth
* Firestore reads

---

## src/lib/firebase-admin.ts

Server-side Firebase Admin SDK.

Used for:

* Secure Firestore writes
* Batch updates

---

# Current Working Flow

```txt
/api/sync
↓
Fetch IPL schedule
↓
Save matches
↓
Fetch team players
↓
Save players
↓
Frontend loads matches
↓
Click match
↓
Fetch players
↓
Display fantasy player pool
```

---

# Known Limitations

Current app does NOT yet support:

* 3-player squad validation rules
* MVP tagging flow
* Squad save/edit flow
* Match scoring system
* Live points
* AI player recommendations
* Player avatars
* Toss / Playing XI updates
* Match insights & analytics
---

# TODO / Future Scope

## High Priority

### Fantasy Squad Rules

Implement squad validation:

* Exactly **3 players** must be selected
* At least **1 player from each team**
* User must select **1 MVP player**
* Prevent invalid squad submission

### Squad Save

Allow:

* Save selected 3-player squad
* Edit saved squad
* Replace players before match starts
* Store selected MVP

### Player Images

Generate image URL using:

```txt
https://www.cricbuzz.com/a/img/v1/152x152/i1/{imageId}.webp
```

### AI Recommendation Engine

Potential features:

* Recommend best 3-player squad
* Suggest strongest MVP pick
* Risk-balanced recommendations
* Recommendations based on player form and match context

---

## Medium Priority

### Playing XI Updates

After toss:

* Replace unavailable players
* Highlight confirmed XI

### Match Insights

Show:

* Venue stats
* Toss advantage
* Player head-to-head

### Notifications

Notify user:

* Match starting soon
* Toss update
* Squad deadline

---

## Long-Term Features

### Live Scoring Engine

Calculate fantasy points.

### Leaderboards

Compete across users.

### Match Intelligence

Provide:

* Venue insights
* Team form analysis
* Player trends
* Head-to-head insights

### Multi-Tournament Support

Potential future support:

* IPL
* Champions Trophy
* World Cup
* BBL
* PSL

---

# Development Commands

Run app:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

---

# Git Branch Strategy

Recommended:

```txt
main
├── feature/player-images
├── feature/fantasy-rules
├── feature/ai-team-selection
├── feature/scoring-engine
```

Never work directly on `main`.

Always:

```bash
git checkout main
git pull
git checkout -b feature/new-feature
```

---

# Current Status

✅ IPL schedule sync working

✅ Firebase integration working

✅ Firestore player sync working

✅ Match cards working

✅ Match player loading working

🚧 Fantasy rules pending

🚧 AI team generation pending

🚧 Scoring engine pending

# Technical Debt / Optimization TODO

These are known improvements that are not urgent for MVP but recommended later.

## 1. Replace `<img>` with `next/image`

Current warnings from ESLint:

```bash
@next/next/no-img-element