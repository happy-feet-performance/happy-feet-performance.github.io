<!-- HEADER -->
<div align="center">
  <img src="https://github.com/user-attachments/assets/d03a49d5-8eb5-440b-bc9d-75f4eabffde4" height=80>
  <h1>HappyFeet Performance Hub</h1>
  <p>Built by Augustine Boadi and Paula Sefia</p>
  <h1 />
</div>
    
> *"I want every player in Ghana and Africa to have what I found in America." ~ Augie*

---

Players across Ghana and Africa develop with zero performance tracking, health monitoring, or structured feedback. Elite talent in Kumasi, Tamale, and Accra goes unnoticed because there is no platform to surface it to clubs globally. Even gifted players lack training structure, injury prevention, and a clear development pathway from youth to professional.

---

## The Founders

Augie grew up in Ghana and experienced the raw talent and total absence of structure in African football. He later played in the USA and saw what world-class data, coaching infrastructure, and player support looks like. His vision is to give African players the same tools he has been provided in America.

Paula translated that mission into an AI-powered athletic performance platform built for Ghana and Africa from U10 academy players to professional athletes.

---

## HappyFeet

HappyFeet is an AI-powered athletic performance platform for players, coaches, and scouts throughout Africa.

**Players** track their development journey through performance ratings, health logs, training plans, highlight reels, and a faith and purpose section grounded in the values of African football culture.

**Coaches** manage their squads through session building, player tracking, health and wellness monitoring, recruitment pipelines, and AI-assisted performance insights.

**Scouts** discover and place talent through prospect pipelines, club networks, placement records, and scouting reports that connect African players to opportunities worldwide.

**Admins** verify squads and agencies, manage users, and oversee platform activity through a dedicated admin panel.

---

## Architecture

```
happyfeet/
├── index.html                  # App entry point
├── netlify.toml                # Netlify deployment config + CSP headers
├── css/
│   ├── base.css                # Design tokens, reset, utilities, shared components
│   ├── auth.css                # Login, signup, role selection screens
│   └── dashboard.css           # App shell, topbar, sidenav, layout
└── js/
├── config.js               # Supabase URL + anon key
├── theme.js                # Light/dark mode toggle with localStorage persistence
├── scripture.js            # Daily rotating scripture from a pool of 30 (day-of-year based)
├── utils.js                # DOM, avatars, bars, badges, toasts, hashing, mini charts, calendars
├── db.js                   # Database abstraction layer (Supabase)
├── auth.js                 # Login, signup, role selection, squad/agency verification, admin login
├── router.js               # Session validation, role routing, sidenav, real-time subscriptions
└── dashboards/
├── player.js           # All views for the Player role
├── coach.js            # All views for the Coach role
├── scout.js            # All views for the Scout role
└── admin.js            # Admin panel for verifications, users, ban/kick/remove
```

### Design system

The UI is built on a custom editorial design system with sharp corners, condensed uppercase typography, a black and gold palette, and a newspaper-style layout language. Fonts are **Oswald** (headings) and **Inter** (body). Icons are **Tabler Icons** (outline webfont).

Dark mode is fully supported and persists across sessions.

### Database

**Supabase** (PostgreSQL) handles all data persistence. The `db.js` module is an async abstraction layer, so the underlying database can be swapped without touching any other file.

All tables have Row Level Security enabled with `allow_all` policies (to be tightened post-demo). Real-time subscriptions are enabled via `REPLICA IDENTITY FULL` on all key tables.

Tables:

| Table | Purpose |
| --- | --- |
| `users` | All registered players, coaches, scouts, and admins |
| `tracker` | Player session and rating data |
| `health` | Legacy wellness data (replaced by `health_logs`) |
| `training` | Training plans and session schedules |
| `scout` | Legacy scout data |
| `squad_verifications` | Coach squad registration and admin approval workflow |
| `agency_verifications` | Scout agency registration and admin approval workflow |
| `squad_invites` | Coach invitations to players with 24hr cooldown on decline |
| `scout_prospects` | Players saved by scouts with pipeline stage tracking |
| `scout_clubs` | Scout personal club network from verified coach clubs |
| `session_ratings` | Coach session ratings per player (one per day, re-editable) |
| `health_logs` | Player daily wellness check-ins (one per day, re-editable) |
| `messages` | Thread-based in-app messaging between all roles |

### Authentication

HappyFeet uses a custom auth system built on top of Supabase's database layer. Passwords are hashed with SHA-256 via the Web Crypto API before storage. Users sign in with email or phone number (WhatsApp numbers also allowed).

**Signup flows:**
- Players: 3-step flow (contact → role fields → confirm)
- Coaches: 4-step flow ending with squad registration (requires admin approval)
- Scouts: 4-step flow ending with agency registration including multiselect regions and target leagues (requires admin approval)

**Session management:**
- Sessions are stored in `sessionStorage` (tab-isolated to prevent cross-tab collision)
- Banned users are blocked at login with reason shown
- Kicked users are blocked for 1 hour with countdown shown

**Admin:**
- Admins are stored in the `users` table with `role: 'admin'`
- Multiple admins supported: all receive notifications for verification events
- Accessed via separate admin login screen

### Real-time

All key events are delivered in real-time via Supabase Postgres Changes:
- New messages → badge update + thread refresh for recipient
- Squad/agency status changes → immediate nav rebuild + overlay notification
- New verifications → admin badge update + dashboard refresh

### Messaging

Messages are thread-based with full conversation history. Features include:
- Multi-recipient compose with tag-style input
- Emoji picker with confetti animation on emoji-only messages
- Archive / unarchive with full thread archiving
- Reply, view profile, and report actions per message
- Sender names resolved from database for all roles
- Contact admin from all roles with subject categories and custom reason

### Verification workflows

**Coach squad verification:**
1. Coach submits squad details
2. Admin reviews, can edit details
3. Coach accepts or declines admin edits
4. Admin approves or rejects
5. On approval, full nav unlocks in real-time

**Scout agency verification:**
1. Scout submits agency details with regions and target leagues
2. Admin approves or rejects
3. On approval, all scouting features unlock in real-time

### User management (admin)

- Ban with reason: blocked at login
- Kick for 1 hour: auto-expires
- Users page shows players, coaches, scouts, and admins in collapsible sections with live counts

---

## Hosting

HappyFeet is deployed on **Netlify** from the `main` branch of the GitHub repository..

Netlify was chosen over GitHub Pages because it supports custom HTTP response headers, which are required to set a Content Security Policy that allows the Supabase JS client (which uses `eval` internally) to function correctly.

The `netlify.toml` at the repo root configures the CSP header:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net; connect-src 'self' https://*.supabase.co; img-src 'self' data:;"
```

---

## Built with

- Vanilla HTML, CSS, JavaScript
- [Supabase](https://supabase.com): PostgreSQL database, RLS, real-time subscriptions
- [Netlify](https://netlify.com): static hosting + HTTP headers
- [Tabler Icons](https://tabler.io/icons): outline icon webfont
- [Inter](https://fonts.google.com/specimen/Inter) + [Oswald](https://fonts.google.com/specimen/Oswald): Google Fonts
- [Anthropic API](https://anthropic.com): AI features (in progress)

---

_HappyFeet Performance Hub is changing the narrative of African football._
