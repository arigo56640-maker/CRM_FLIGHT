-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE lead_status AS ENUM (
    'New',
    'Contacted',
    'Waiting for Customer',
    'Closed-Won',
    'Closed-Lost'
);

CREATE TYPE event_type AS ENUM (
    'note',
    'status_change',
    'bot'
);

-- Leads table
CREATE TABLE leads (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                  TEXT NOT NULL,
    phone                 TEXT,
    email                 TEXT,
    destination           TEXT,
    departure_date        DATE,
    status                lead_status NOT NULL DEFAULT 'New',
    baggage_required      BOOLEAN DEFAULT FALSE,
    baggage_details       TEXT,
    date_change_requested BOOLEAN DEFAULT FALSE,
    date_change_details   TEXT,
    is_stale              BOOLEAN DEFAULT FALSE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_contacted_at     TIMESTAMPTZ
);

-- Timeline events table
CREATE TABLE timeline_events (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id    UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    type       event_type NOT NULL DEFAULT 'note',
    content    TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for frequent query patterns
CREATE INDEX idx_leads_status          ON leads(status);
CREATE INDEX idx_leads_created_at      ON leads(created_at);
CREATE INDEX idx_leads_last_contacted  ON leads(last_contacted_at);
CREATE INDEX idx_timeline_lead_id      ON timeline_events(lead_id);
CREATE INDEX idx_timeline_created_at   ON timeline_events(created_at);
