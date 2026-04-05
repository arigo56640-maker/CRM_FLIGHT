# CRM FLIGHT

A lightweight CRM for flight travel agencies. Manage passenger leads through a status pipeline, track activity timelines, and get bot-assisted message suggestions — all in a single-page interface.

---

## Features

- **Lead pipeline** — New → Contacted → Waiting for Customer → Closed-Won / Closed-Lost
- **Urgency sorting** — overdue leads surface first; stale leads (idle 24 h) are flagged automatically
- **Activity timeline** — every status change and note is logged per lead
- **Bot suggestions** — one-click templates for common follow-up messages (passport, baggage, date change)
- **SLA scheduler** — background job marks leads stale after 24 h of inactivity

---

## Project Structure

```
CRM_FLIGHT/
├── backend/
│   ├── app/
│   │   ├── __init__.py        # App factory
│   │   ├── config.py          # Dev / production config classes
│   │   ├── extensions.py      # Supabase client singleton
│   │   ├── scheduler.py       # APScheduler — runs SLA check every minute
│   │   ├── routes/
│   │   │   ├── leads.py       # POST /leads, GET /leads, PATCH /leads/:id
│   │   │   └── timeline.py    # GET /leads/:id/timeline, POST /leads/:id/timeline
│   │   └── services/
│   │       ├── lead_service.py     # CRUD + is_overdue computation
│   │       ├── timeline_service.py # Insert / fetch timeline events
│   │       └── sla_service.py      # Marks leads is_stale after 24 h idle
│   ├── sql/
│   │   └── schema.sql         # Run once in Supabase SQL Editor
│   ├── .env.example
│   ├── Procfile               # gunicorn --workers 1 (prevents duplicate scheduler)
│   ├── requirements.txt
│   ├── runtime.txt            # python-3.11.9
│   └── run.py                 # Entry point
└── frontend/
    ├── index.html             # Single-page app shell
    └── js/
        ├── api.js             # Centralised fetch wrapper
        ├── dashboard.js       # Leads table, stat counters, Add Lead modal
        ├── drawer.js          # Lead detail side panel, quick actions, edit form
        ├── timeline.js        # Timeline feed render
        └── bot.js             # Bot suggestion button wiring
```

---

## Prerequisites

- Python 3.11+
- A [Supabase](https://supabase.com) project (free tier is fine)
- The **service role key** from Supabase — the anon key is blocked by RLS

---

## Local Setup

### 1. Database

Open your Supabase project → **SQL Editor** → paste and run `backend/sql/schema.sql`.

This creates two tables (`leads`, `timeline_events`), the status/event-type enums, and the necessary indexes.

### 2. Environment

```bash
cp backend/.env.example backend/.env
```

Fill in `backend/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
SECRET_KEY=<run: python -c "import secrets; print(secrets.token_hex(32))">
FLASK_ENV=development
```

### 3. Install & Run

```bash
cd backend
pip install -r requirements.txt
python run.py
```

Open [http://localhost:5000](http://localhost:5000).

The Flask app serves the frontend statically — no separate frontend server needed.

---

## Environment Variables

| Variable       | Description                                              |
|----------------|----------------------------------------------------------|
| `SUPABASE_URL` | Project URL from Supabase dashboard                      |
| `SUPABASE_KEY` | **Service role key** (not anon key — anon key is blocked by RLS) |
| `SECRET_KEY`   | Flask secret key — generate with `secrets.token_hex(32)` |
| `FLASK_ENV`    | `development` (debug mode) or `production`               |

---

## API Reference

### Leads

| Method  | Path              | Description                        |
|---------|-------------------|------------------------------------|
| `GET`   | `/leads`          | List all leads, sorted by urgency  |
| `POST`  | `/leads`          | Create a lead                      |
| `PATCH` | `/leads/:id`      | Update lead fields                 |

**Urgency sort order:** overdue (0) → new (1) → stale (2) → other (3)

`is_overdue` is computed at read time (not stored). A lead is overdue if its status is `New`, it has never been contacted, and it was created more than 10 minutes ago.

### Timeline

| Method | Path                       | Description                    |
|--------|----------------------------|--------------------------------|
| `GET`  | `/leads/:id/timeline`      | Fetch events for a lead        |
| `POST` | `/leads/:id/timeline`      | Add a note or bot event        |

Event types: `note`, `status_change`, `bot`

Status changes and lead creation automatically write timeline events.

---

## Deployment (Railway)

1. Push the repo to GitHub.
2. Create a new Railway project → **Deploy from GitHub repo**.
3. Set the **root directory** to `backend/`.
4. Add environment variables in Railway's dashboard (`SUPABASE_URL`, `SUPABASE_KEY`, `SECRET_KEY`, `FLASK_ENV=production`).
5. Railway will detect the `Procfile` and deploy automatically.

> The `Procfile` uses `--workers 1` to prevent multiple gunicorn workers from spawning duplicate scheduler instances.

---

## Status Pipeline

```
New  ──►  Contacted  ──►  Waiting for Customer  ──►  Closed-Won
                                                 └──►  Closed-Lost
```

Any status change via the API:
- Writes a `status_change` timeline event
- Sets `last_contacted_at` to now
- Resets the stale clock
