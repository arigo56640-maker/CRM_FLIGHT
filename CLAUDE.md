# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the backend

```bash
pip install -r requirements.txt
cd backend
cp .env.example .env   # then fill in SUPABASE_URL and SUPABASE_KEY
python run.py
```

The app runs on `http://localhost:5000`. The frontend is served statically from `../frontend/` — no separate frontend server.

## Project structure

```
CRM_FLIGHT/
├── backend/   Flask app (API + scheduler)
└── frontend/  Vanilla JS single-page app (HTML/CSS/JS)
```

Flask is configured with `static_folder` pointing to `../frontend/` and `static_url_path=""`, so all files in `frontend/` are served directly. The root route `/` sends `frontend/index.html`.

## Backend architecture

**Entry point:** `backend/run.py` → calls `app.create_app()`

**App factory** (`backend/app/__init__.py`): loads `.env`, creates Flask app, registers blueprints, starts APScheduler.

**Services** (`backend/app/services/`) — all business logic lives here, routes are thin wrappers:
- `lead_service.py` — CRUD for leads. `is_overdue` is computed in Python (not stored in DB) on every `get_leads()` / `get_lead()` call. Urgency sort order: overdue(0) > new(1) > stale(2) > other(3).
- `timeline_service.py` — insert/fetch `timeline_events` rows.
- `sla_service.py` — `check_sla()` runs every minute, fetches open non-stale leads and marks `is_stale=True` for any with no activity in 24h.

**Scheduler** (`backend/app/scheduler.py`): APScheduler `BackgroundScheduler(daemon=True)`, single job calling `check_sla()` wrapped in `app.app_context()`. Uses `--workers 1` in Procfile to avoid duplicate scheduler instances.

**Supabase client** (`backend/app/extensions.py`): lazy singleton via `get_supabase()`. All services import this; never instantiate the client elsewhere.

## Database (Supabase / PostgreSQL)

Schema file: `backend/sql/schema.sql` — run this once in Supabase SQL Editor.

Two tables:
- `leads` — core lead data + `is_stale` (persisted by scheduler). `is_overdue` is NOT a column — it's computed at read time.
- `timeline_events` — append-only log linked to a lead. Types: `note`, `status_change`, `bot`.

Status pipeline: `New` → `Contacted` → `Waiting for Customer` → `Closed-Won` / `Closed-Lost`

Any status change via `update_lead()` automatically writes a `status_change` timeline event and sets `last_contacted_at`.
Creating a lead automatically writes a `bot` timeline event ("Auto-response sent").

## Frontend architecture

Five JS files loaded in dependency order at bottom of `index.html`:
1. `api.js` — single `API` object, all `fetch` calls centralized here
2. `dashboard.js` — renders lead table, updates counters, polls every 60s, wires Add Lead modal
3. `drawer.js` — opens/closes side panel, quick-action buttons, save edits, add note
4. `timeline.js` — `loadTimeline(leadId)` / `renderTimeline(events)` used by drawer
5. `bot.js` — bot suggestion buttons populate `#note-input` textarea (agent reviews before submitting)

Required element IDs in `index.html`: `leads-tbody`, `lead-drawer`, `add-lead-modal`, `timeline-feed`, `note-input`, `count-new`, `count-overdue`, `count-stale`.

## Environment variables

| Variable | Notes |
|---|---|
| `SUPABASE_URL` | Project URL from Supabase dashboard |
| `SUPABASE_KEY` | **Service role key** (not anon key — anon key is blocked by RLS) |
| `SECRET_KEY` | Flask secret, generate with `python -c "import secrets; print(secrets.token_hex(32))"` |
| `FLASK_ENV` | `development` or `production` |

## Deployment (Railway)

- Root service directory: `backend/`
- Railway injects `$PORT` — Procfile already uses it
- Run `backend/sql/schema.sql` in Supabase SQL Editor before first deploy
