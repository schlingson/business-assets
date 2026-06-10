import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { SOURCES } from "./sources";

// Single shared connection per server process. Next.js may re-evaluate modules
// during dev hot-reloads, so we cache the instance on globalThis.
const globalForDb = globalThis as unknown as { __newsDb?: Database.Database };

function resolveDbPath(): string {
  if (process.env.DATABASE_PATH) return process.env.DATABASE_PATH;
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "news.db");
}

function init(database: Database.Database) {
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");

  database.exec(`
    CREATE TABLE IF NOT EXISTS sources (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      name            TEXT NOT NULL UNIQUE,
      feed_url        TEXT NOT NULL,
      logo_url        TEXT,
      description     TEXT NOT NULL DEFAULT '',
      is_active       INTEGER NOT NULL DEFAULT 1,
      last_fetched_at TEXT
    );

    CREATE TABLE IF NOT EXISTS articles (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      source_name  TEXT NOT NULL,
      source_url   TEXT NOT NULL DEFAULT '',
      title        TEXT NOT NULL,
      description  TEXT NOT NULL DEFAULT '',
      link         TEXT NOT NULL UNIQUE,
      image_url    TEXT,
      published_at TEXT NOT NULL,
      category     TEXT NOT NULL,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_articles_published ON articles (published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_source ON articles (source_name);
    CREATE INDEX IF NOT EXISTS idx_articles_category ON articles (category);

    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (user_id, article_id)
    );

    CREATE INDEX IF NOT EXISTS idx_bookmarks_article ON bookmarks (article_id);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks (user_id);

    CREATE TABLE IF NOT EXISTS user_preferences (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id        INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      hidden_sources TEXT NOT NULL DEFAULT '[]',
      created_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  seedSources(database);
}

// Insert the 12 canonical sources if missing; keep feed_url/description fresh.
function seedSources(database: Database.Database) {
  const upsert = database.prepare(`
    INSERT INTO sources (name, feed_url, logo_url, description, is_active)
    VALUES (@name, @feed_url, @logo_url, @description, 1)
    ON CONFLICT(name) DO UPDATE SET
      feed_url = excluded.feed_url,
      description = excluded.description
  `);
  const tx = database.transaction(() => {
    for (const s of SOURCES) {
      upsert.run({
        name: s.name,
        feed_url: s.feedUrl,
        logo_url: null,
        description: s.description,
      });
    }
  });
  tx();
}

export function getDb(): Database.Database {
  if (!globalForDb.__newsDb) {
    const db = new Database(resolveDbPath());
    init(db);
    globalForDb.__newsDb = db;
  }
  return globalForDb.__newsDb;
}
