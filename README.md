<!-- HEADER -->
<div align="center">
  <!-- Source: https://tenor.com/view/football-soccer-ball-goal-golazo-gif-21897044 -->
  <img src="https://github.com/user-attachments/assets/d03a49d5-8eb5-440b-bc9d-75f4eabffde4" height=80>
  <h1>HappyFeet Performance Hub</h1>
  <p>Built by Augie and Paula</p>
  <h1 />
</div>
    
> *"I want every player in Ghana and Africa to have what I found in America." ~ Augie*

---

Players across Ghana and Africa develop with zero performance tracking, health monitoring, or structured feedback. Elite talent in Kumasi, Tamale, and Accra goes unnoticed because there is no platform to surface it to clubs globally. Even gifted players lack training structure, injury prevention, and a clear development pathway from youth to professional.

---

## The Founders

Augie grew up in Ghana and experienced the raw talent and total absence of structure in African football. He later played in the USA and saw what world-class data, coaching infrastructure, and player support looks like. His vision is to give African players the same tools he has been provided in America.

Paula translated that mission into a platform built from the ground up to serve athletes from U10 academy level all the way through to professional careers.

---

## HappyFeet

HappyFeet is an AI-powered athletic performance platform for players, coaches, and scouts throughout Africa.

**Players** track their development journey through performance ratings, health logs, training plans, highlight reels, and a faith and purpose section grounded in the values of African football culture.

**Coaches** manage their squads through session building, player tracking, health and wellness monitoring, recruitment pipelines, and AI-assisted performance insights.

**Scouts** discover and place talent through prospect pipelines, club networks, placement records, and scouting reports that connect African players to opportunities worldwide.

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
    ├── utils.js                # DOM, avatars, bars, badges, toasts, hashing
    ├── db.js                   # Database abstraction layer (Supabase)
    ├── auth.js                 # Login, signup, role selection, squad verification, admin login
    ├── router.js               # Session validation, role routing, sidenav, view switching
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

Tables:

| Table | Purpose |
|---|---|
| `users` | All registered players, coaches, and scouts |
| `tracker` | Player session and rating data |
| `health` | Daily wellness check-ins and injury flags |
| `training` | Training plans and session schedules |
| `scout` | Prospect pipelines, placements, club networks |
| `squad_verifications` | Coach squad registration and admin approval workflow |
| `messages` | In-app notifications, admin to coach, system alerts |
| `admins` | Admin users with hashed credentials |

### Authentication

HappyFeet uses a custom auth system built on top of Supabase's database layer. Users sign in with email or phone number (WhatsApp numbers also allowed). Coaches go through a four-step signup flow that ends with a squad registration form, which requires admin approval before full platform access is granted.

Admin accounts are managed directly in Supabase and accessed through a separate admin portal on the login screen.

### AI

The platform is designed for progressive AI integration. The coach dashboard surfaces an AI agent activity feed. The AI scouting report feature generates player strengths, weaknesses, and scout summaries from session data using the Anthropic API.

---

## Hosting

HappyFeet is deployed on **Netlify** from the `main` branch of the GitHub repository. Every push to `main` triggers an automatic deployment.

Netlify was chosen over GitHub Pages because it supports custom HTTP response headers, which are required to set a Content Security Policy that allows the Supabase JS client (which uses `eval` internally) to function correctly.

The `netlify.toml` at the repo root configures the CSP header:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net; connect-src 'self' https://*.supabase.co; img-src 'self' data:;"
```

The production domain `happyfeet.org` will be pointed to Netlify via DNS once acquired.

---

## Built with

- Vanilla HTML, CSS, JavaScript
- [Supabase](https://supabase.com) — PostgreSQL database + RLS
- [Netlify](https://netlify.com) — static hosting + HTTP headers
- [Tabler Icons](https://tabler.io/icons) — outline icon webfont
- [Inter](https://fonts.google.com/specimen/Inter) + [Oswald](https://fonts.google.com/specimen/Oswald) — Google Fonts
- [Anthropic API](https://anthropic.com) — AI features

---

*HappyFeet Performance Hub — Changing the narrative of African football.*
