-- Migration 001: initial schema

CREATE TABLE IF NOT EXISTS sessions (
  user_id       TEXT    NOT NULL,
  topic         TEXT    NOT NULL DEFAULT '',
  created_at    INTEGER NOT NULL,   -- Unix epoch seconds
  message_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, created_at)
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id, created_at DESC);
