-- ============================================================
-- Intertemporal System — Supabase Schema
-- Run this manually in the Supabase SQL Editor
-- ============================================================

-- 1. BLOCKS (static seed — 14 rows)
CREATE TABLE IF NOT EXISTS blocks (
  id TEXT PRIMARY KEY,           -- e.g. 'mon_morning'
  label TEXT NOT NULL,           -- 'Monday Morning Lionel'
  day_of_week INT NOT NULL,      -- 0=Sun, 1=Mon ... 6=Sat
  period TEXT NOT NULL           -- 'morning' | 'evening'
    CHECK (period IN ('morning', 'evening')),
  start_time TIME NOT NULL,      -- '06:00' or '16:00'
  end_time TIME NOT NULL,        -- '14:00' or '00:00'
  color TEXT NOT NULL DEFAULT '#1A5C6B',  -- per-block accent color
  emoji TEXT NOT NULL DEFAULT '🌅'
);

-- 2. RESPONSIBILITIES (fixed recurring items per block)
CREATE TABLE IF NOT EXISTS responsibilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id TEXT NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  fixed_start_time TIME,         -- optional fixed time within block
  fixed_end_time TIME,
  is_recurring BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ACTIVITY LOGS (the heart of the system)
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id TEXT NOT NULL REFERENCES blocks(id),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- actual time activity happened
  activity TEXT NOT NULL,                         -- "cleaned the car"
  duration_minutes INT,                           -- 10
  source TEXT NOT NULL DEFAULT 'gui'              -- 'agent' | 'gui'
    CHECK (source IN ('agent', 'gui')),
  notes TEXT,
  week_start DATE NOT NULL,       -- Monday of that week (for grouping)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_activity_logs_block_id ON activity_logs(block_id);
CREATE INDEX idx_activity_logs_week_start ON activity_logs(week_start);
CREATE INDEX idx_activity_logs_logged_at ON activity_logs(logged_at DESC);
CREATE INDEX idx_responsibilities_block_id ON responsibilities(block_id);

-- ============================================================
-- SEED: 14 Blocks
-- ============================================================
INSERT INTO blocks (id, label, day_of_week, period, start_time, end_time, color, emoji) VALUES
  ('sun_morning', 'Sunday Morning Lionel',    0, 'morning', '06:00', '14:00', '#7C6CAF', '⛪'),
  ('sun_evening', 'Sunday Evening Lionel',    0, 'evening', '16:00', '00:00', '#9B59B6', '🌆'),
  ('mon_morning', 'Monday Morning Lionel',    1, 'morning', '06:00', '14:00', '#1A5C6B', '🌅'),
  ('mon_evening', 'Monday Evening Lionel',    1, 'evening', '16:00', '00:00', '#1A7A8A', '🌙'),
  ('tue_morning', 'Tuesday Morning Lionel',   2, 'morning', '06:00', '14:00', '#2E6B3E', '🌅'),
  ('tue_evening', 'Tuesday Evening Lionel',   2, 'evening', '16:00', '00:00', '#D4A853', '📡'),
  ('wed_morning', 'Wednesday Morning Lionel', 3, 'morning', '06:00', '14:00', '#1A5C6B', '🌅'),
  ('wed_evening', 'Wednesday Evening Lionel', 3, 'evening', '16:00', '00:00', '#1A7A8A', '🌙'),
  ('thu_morning', 'Thursday Morning Lionel',  4, 'morning', '06:00', '14:00', '#2E6B3E', '🌅'),
  ('thu_evening', 'Thursday Evening Lionel',  4, 'evening', '16:00', '00:00', '#8B4513', '🎹'),
  ('fri_morning', 'Friday Morning Lionel',    5, 'morning', '06:00', '14:00', '#1A5C6B', '🌅'),
  ('fri_evening', 'Friday Evening Lionel',    5, 'evening', '16:00', '00:00', '#C0392B', '🎉'),
  ('sat_morning', 'Saturday Morning Lionel',  6, 'morning', '06:00', '14:00', '#2E6B3E', '🌅'),
  ('sat_evening', 'Saturday Evening Lionel',  6, 'evening', '16:00', '00:00', '#9B59B6', '🌆')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEED: Default Responsibilities
-- ============================================================
INSERT INTO responsibilities (block_id, title, description, fixed_start_time, fixed_end_time, is_recurring) VALUES
  ('tue_evening', 'Weekly Livestream', 'Tuesday evening piano livestream', '17:00', '19:00', TRUE),
  ('thu_evening', 'Piano Lessons', 'Thursday evening piano lessons', '18:00', '21:00', TRUE),
  ('sun_morning', 'Church', 'Sunday morning church service', '09:30', '13:30', TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Row Level Security (optional — enable if using anon access)
-- ============================================================
-- ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE responsibilities ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
