// Keyword-based auto-categorization for incoming articles.
// Primary category is derived from title + description keyword scoring.
// German sources additionally carry the "German News" tag (handled at the
// query/UI layer so the primary category is preserved).

export const CATEGORIES = [
  "Models & Research",
  "Products & Launches",
  "Business & Funding",
  "Policy & Ethics",
  "Tutorials & Tools",
  "German News",
] as const;

export type Category = (typeof CATEGORIES)[number];

// Categories that can be assigned as a *primary* category from keywords.
export const PRIMARY_CATEGORIES = CATEGORIES.filter((c) => c !== "German News");

const KEYWORDS: Record<string, string[]> = {
  "Models & Research": [
    "gpt",
    "claude",
    "gemini",
    "llama",
    "model",
    "benchmark",
    "training",
    "fine-tune",
    "fine tune",
    "finetune",
  ],
  "Products & Launches": [
    "launch",
    "release",
    "feature",
    "update",
    "announce",
    "api",
  ],
  "Business & Funding": [
    "funding",
    "acquisition",
    "revenue",
    "startup",
    "valuation",
    "ipo",
  ],
  "Policy & Ethics": [
    "regulation",
    "eu",
    "safety",
    "bias",
    "ethics",
    "policy",
    "law",
  ],
  "Tutorials & Tools": [
    "tutorial",
    "how to",
    "guide",
    "open source",
    "open-source",
    "github",
    "tool",
  ],
};

const DEFAULT_CATEGORY = "Products & Launches";

/**
 * Count whole-word-ish keyword matches per category and return the best match.
 * Falls back to a sensible default when nothing matches.
 */
export function categorize(title: string, description: string): string {
  const haystack = `${title} ${description}`.toLowerCase();

  let bestCategory = DEFAULT_CATEGORY;
  let bestScore = 0;

  // Iterate in declared order so earlier categories win ties.
  for (const category of PRIMARY_CATEGORIES) {
    const keywords = KEYWORDS[category] ?? [];
    let score = 0;
    for (const kw of keywords) {
      if (matchKeyword(haystack, kw)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
}

// Match the keyword on a word boundary so "eu" doesn't fire inside "neural"
// and "api" doesn't fire inside "rapidly".
function matchKeyword(haystack: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
  return re.test(haystack);
}
