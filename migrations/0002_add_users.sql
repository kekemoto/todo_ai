CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO users (id, name) VALUES (1, 'Guest');

ALTER TABLE todos ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1 REFERENCES users(id);
