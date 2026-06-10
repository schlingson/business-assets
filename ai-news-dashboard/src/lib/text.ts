// Lightweight text helpers shared by feed ingestion and the UI.

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
  "&hellip;": "…",
  "&mdash;": "—",
  "&ndash;": "–",
};

/** Strip HTML tags and decode common entities into clean plain text. */
export function stripHtml(input: string | null | undefined): string {
  if (!input) return "";
  let text = input.replace(/<[^>]*>/g, " ");
  text = text.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
  text = text.replace(/&[a-z]+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? " ");
  return text.replace(/\s+/g, " ").trim();
}

/** Return the first `count` sentences of a (plain text) string. */
export function firstSentences(text: string, count = 2): string {
  const clean = text.trim();
  if (!clean) return "";
  // Split on sentence terminators followed by whitespace.
  const parts = clean.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g);
  if (!parts) return clean;
  const out = parts.slice(0, count).join(" ").trim();
  // Guard against runaway single "sentences".
  return out.length > 320 ? out.slice(0, 317).trimEnd() + "…" : out;
}
