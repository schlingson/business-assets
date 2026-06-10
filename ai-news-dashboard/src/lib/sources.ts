// Canonical definition of every feed the dashboard aggregates.
// `color`/`textColor` drive the per-source badge in the UI.

export type SourceDef = {
  name: string;
  feedUrl: string;
  /** Source homepage, used for the badge link & description. */
  siteUrl: string;
  color: string;
  textColor: string;
  description: string;
  /** German sources also receive the "German News" tag. */
  german?: boolean;
};

export const SOURCES: SourceDef[] = [
  {
    name: "TechCrunch AI",
    feedUrl: "https://techcrunch.com/category/artificial-intelligence/feed/",
    siteUrl: "https://techcrunch.com/category/artificial-intelligence/",
    color: "#00A651",
    textColor: "#ffffff",
    description: "Startup and Silicon Valley reporting with a dedicated AI desk.",
  },
  {
    name: "The Verge AI",
    feedUrl: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
    siteUrl: "https://www.theverge.com/ai-artificial-intelligence",
    color: "#E4007C",
    textColor: "#ffffff",
    description: "Consumer tech, gadgets and culture coverage of artificial intelligence.",
  },
  {
    name: "OpenAI",
    feedUrl: "https://openai.com/news/rss.xml",
    siteUrl: "https://openai.com/news/",
    color: "#10A37F",
    textColor: "#ffffff",
    description: "Official product and research announcements from OpenAI.",
  },
  {
    name: "Google DeepMind",
    feedUrl: "https://deepmind.google/blog/rss.xml",
    siteUrl: "https://deepmind.google/discover/blog/",
    color: "#4285F4",
    textColor: "#ffffff",
    description: "Research and breakthroughs from Google DeepMind.",
  },
  {
    name: "MIT Tech Review",
    feedUrl: "https://www.technologyreview.com/topic/artificial-intelligence/feed/",
    siteUrl: "https://www.technologyreview.com/topic/artificial-intelligence/",
    color: "#C4302B",
    textColor: "#ffffff",
    description: "In-depth analysis of AI's impact on science and society.",
  },
  {
    name: "Ars Technica",
    feedUrl: "https://arstechnica.com/ai/feed/",
    siteUrl: "https://arstechnica.com/ai/",
    color: "#FF6600",
    textColor: "#ffffff",
    description: "Technical reporting on AI, computing and the industry.",
  },
  {
    name: "Wired AI",
    feedUrl: "https://www.wired.com/feed/tag/ai/latest/rss",
    siteUrl: "https://www.wired.com/tag/artificial-intelligence/",
    color: "#000000",
    textColor: "#ffffff",
    description: "How AI is shaping business, culture and the future.",
  },
  {
    name: "VentureBeat AI",
    feedUrl: "https://venturebeat.com/category/ai/feed/",
    siteUrl: "https://venturebeat.com/category/ai/",
    color: "#2563EB",
    textColor: "#ffffff",
    description: "Enterprise AI, funding and the business of machine learning.",
  },
  {
    name: "Hacker News",
    feedUrl: "https://news.ycombinator.com/rss",
    siteUrl: "https://news.ycombinator.com/",
    color: "#FF6600",
    textColor: "#ffffff",
    description: "Top stories from the Hacker News community.",
  },
  {
    name: "Hugging Face",
    feedUrl: "https://huggingface.co/blog/feed.xml",
    siteUrl: "https://huggingface.co/blog",
    color: "#FFD21E",
    textColor: "#1a1a1a",
    description: "Open-source models, datasets and ML tooling from the HF community.",
  },
  {
    name: "t3n",
    feedUrl: "https://t3n.de/rss.xml",
    siteUrl: "https://t3n.de/",
    color: "#E5001A",
    textColor: "#ffffff",
    description: "Deutsches Digital- und Tech-Magazin.",
    german: true,
  },
  {
    name: "Heise KI",
    feedUrl: "https://www.heise.de/thema/Kuenstliche-Intelligenz.xml",
    siteUrl: "https://www.heise.de/thema/Kuenstliche-Intelligenz",
    color: "#007CC3",
    textColor: "#ffffff",
    description: "KI-Nachrichten vom deutschen IT-Nachrichtendienst heise online.",
    german: true,
  },
];

export const SOURCE_BY_NAME = new Map(SOURCES.map((s) => [s.name, s]));

export const GERMAN_SOURCE_NAMES = SOURCES.filter((s) => s.german).map((s) => s.name);

export function isGermanSource(name: string): boolean {
  return GERMAN_SOURCE_NAMES.includes(name);
}
