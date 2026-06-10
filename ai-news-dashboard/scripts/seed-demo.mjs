#!/usr/bin/env node
/**
 * Inserts a handful of realistic sample articles so the UI can be explored
 * without a live feed fetch (useful behind firewalls or before the first cron run).
 *
 *   node scripts/seed-demo.mjs
 *
 * Idempotent: re-running won't create duplicates (articles dedupe by link).
 * For real data, run `npm run refresh` against a running server instead.
 */

import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "news.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_name TEXT NOT NULL,
    source_url TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    link TEXT NOT NULL UNIQUE,
    image_url TEXT,
    published_at TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const hoursAgo = (h) => new Date(Date.now() - h * 3600_000).toISOString();

const samples = [
  ["OpenAI", "https://openai.com/news/", "OpenAI announces GPT-5 with major reasoning gains",
   "OpenAI today announced GPT-5, its most capable model yet. The release focuses on stronger reasoning and a refreshed API.", 1, "Products & Launches"],
  ["Google DeepMind", "https://deepmind.google/", "DeepMind's new model sets a benchmark record in math",
   "Google DeepMind published research describing a model that beats prior benchmarks. The training approach combines RL with fine-tuned verifiers.", 3, "Models & Research"],
  ["TechCrunch AI", "https://techcrunch.com/", "AI startup raises $200M Series C at $2B valuation",
   "An enterprise AI startup closed a $200M funding round. The revenue-stage company plans to expand its product team.", 5, "Business & Funding"],
  ["The Verge AI", "https://www.theverge.com/", "The EU finalizes sweeping AI regulation",
   "The EU has finalized new AI regulation focused on safety and transparency. Critics argue the policy could slow deployment.", 8, "Policy & Ethics"],
  ["Hugging Face", "https://huggingface.co/blog", "A practical guide to fine-tuning open source LLMs",
   "This tutorial walks through how to fine-tune an open source model on GitHub. It covers tooling, datasets and evaluation.", 12, "Tutorials & Tools"],
  ["Ars Technica", "https://arstechnica.com/", "New benchmark probes how models handle long context",
   "Researchers released a benchmark for long-context reasoning. Several frontier models were evaluated on retrieval tasks.", 20, "Models & Research"],
  ["VentureBeat AI", "https://venturebeat.com/", "Enterprise adoption of AI agents accelerates",
   "VentureBeat reports that enterprises are launching AI agent features. Vendors announced new API integrations this week.", 26, "Products & Launches"],
  ["Wired AI", "https://www.wired.com/", "How bias creeps into AI hiring tools",
   "A Wired investigation looks at bias and ethics in hiring algorithms. Experts call for clearer policy and auditing.", 30, "Policy & Ethics"],
  ["MIT Tech Review", "https://www.technologyreview.com/", "Inside the race to train smaller, cheaper models",
   "MIT Technology Review examines efforts to make model training cheaper. Smaller models increasingly rival larger ones on benchmarks.", 40, "Models & Research"],
  ["Hacker News", "https://news.ycombinator.com/", "Show HN: An open source tool for local LLM inference",
   "A developer shared an open source GitHub tool for running models locally. The guide includes setup and benchmarks.", 44, "Tutorials & Tools"],
  ["t3n", "https://t3n.de/", "KI-Startup aus Berlin sichert sich Millionen-Finanzierung",
   "Ein Berliner KI-Startup hat eine große Finanzierungsrunde abgeschlossen. Das Unternehmen will sein Produktteam ausbauen.", 6, "Business & Funding"],
  ["Heise KI", "https://www.heise.de/", "EU-Regulierung für KI: Das ändert sich für Unternehmen",
   "Die neue EU-Regulierung zur KI bringt Pflichten für Unternehmen. Experten diskutieren die Folgen für Sicherheit und Ethik.", 10, "Policy & Ethics"],
];

const insert = db.prepare(`
  INSERT INTO articles (source_name, source_url, title, description, link, image_url, published_at, category)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(link) DO NOTHING
`);

let n = 0;
for (const [source, url, title, desc, h, category] of samples) {
  const link = `${url}sample/${encodeURIComponent(title.slice(0, 40))}`;
  const info = insert.run(source, url, title, desc, link, null, hoursAgo(h), category);
  n += info.changes;
}

console.log(`Seeded ${n} sample article(s) into ${dbPath}.`);
