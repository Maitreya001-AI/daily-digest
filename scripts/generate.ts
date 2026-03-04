import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import * as cheerio from "cheerio";
import RSSParser from "rss-parser";
import {
  type RawItem,
  type DailyDigest,
  type DigestCard,
  DailyDigestSchema,
  DOMAINS,
} from "../src/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TODAY = (() => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
})();

const PROJECT_ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(PROJECT_ROOT, "data");
const RAW_DIR = path.join(DATA_DIR, "raw");

function ensureDirs() {
  fs.mkdirSync(RAW_DIR, { recursive: true });
}

function log(msg: string) {
  console.log(`[generate] ${msg}`);
}

function logError(source: string, err: unknown) {
  console.error(`[generate] ${source} failed:`, err instanceof Error ? err.message : err);
}

// ---------------------------------------------------------------------------
// Fetchers – each returns RawItem[] and never throws
// ---------------------------------------------------------------------------

async function fetchHackerNews(): Promise<RawItem[]> {
  try {
    log("Fetching Hacker News...");
    const res = await fetch(
      "https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=30"
    );
    const data = await res.json();
    return (data.hits ?? []).map((hit: any) => ({
      title: hit.title ?? "",
      url: hit.url ?? `https://news.ycombinator.com/item?id=${hit.objectID}`,
      source: "Hacker News",
      description: hit.story_text ?? undefined,
      score: hit.points ?? undefined,
      publishedAt: hit.created_at ?? undefined,
    }));
  } catch (err) {
    logError("Hacker News", err);
    return [];
  }
}

async function fetchReddit(): Promise<RawItem[]> {
  const subreddits = [
    "artificial",
    "MachineLearning",
    "startups",
    "technology",
    "ProductManagement",
  ];
  const items: RawItem[] = [];

  for (const sub of subreddits) {
    try {
      log(`Fetching r/${sub}...`);
      const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=20`, {
        headers: {
          "User-Agent": "DailyDigestBot/1.0 (data aggregation script)",
        },
      });
      const data = await res.json();
      const posts = data?.data?.children ?? [];
      for (const post of posts) {
        const d = post.data;
        if (!d || d.stickied) continue;
        items.push({
          title: d.title ?? "",
          url: d.url ?? `https://reddit.com${d.permalink}`,
          source: `Reddit r/${sub}`,
          description: d.selftext ? d.selftext.slice(0, 500) : undefined,
          score: d.score ?? undefined,
          publishedAt: d.created_utc
            ? new Date(d.created_utc * 1000).toISOString()
            : undefined,
        });
      }
    } catch (err) {
      logError(`Reddit r/${sub}`, err);
    }
  }

  return items;
}

async function fetchArxiv(): Promise<RawItem[]> {
  try {
    log("Fetching arXiv...");
    const res = await fetch(
      "http://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.LG&sortBy=submittedDate&sortOrder=descending&max_results=20"
    );
    const xml = await res.text();

    // Parse Atom XML manually – extract <entry> blocks
    const entries: RawItem[] = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match: RegExpExecArray | null;

    while ((match = entryRegex.exec(xml)) !== null) {
      const block = match[1];

      const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/);
      const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : "";

      const linkMatch = block.match(/<id>([\s\S]*?)<\/id>/);
      const url = linkMatch ? linkMatch[1].trim() : "";

      const summaryMatch = block.match(/<summary>([\s\S]*?)<\/summary>/);
      const summary = summaryMatch
        ? summaryMatch[1].replace(/\s+/g, " ").trim().slice(0, 500)
        : undefined;

      const publishedMatch = block.match(/<published>([\s\S]*?)<\/published>/);
      const publishedAt = publishedMatch ? publishedMatch[1].trim() : undefined;

      if (title && url) {
        entries.push({
          title,
          url,
          source: "arXiv",
          description: summary,
          publishedAt,
        });
      }
    }

    return entries;
  } catch (err) {
    logError("arXiv", err);
    return [];
  }
}

async function fetchGitHubTrending(): Promise<RawItem[]> {
  try {
    log("Fetching GitHub Trending...");
    const res = await fetch("https://github.com/trending", {
      headers: {
        "User-Agent": "DailyDigestBot/1.0",
      },
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    const items: RawItem[] = [];

    $("article.Box-row").each((_, el) => {
      const repoLink = $(el).find("h2 a").attr("href")?.trim();
      if (!repoLink) return;

      const repoName = repoLink.replace(/^\//, "").trim();
      const description = $(el).find("p.col-9").text().trim() || undefined;
      const starsText = $(el).find("[href$='/stargazers']").text().trim();
      const stars = starsText ? parseInt(starsText.replace(/,/g, ""), 10) : undefined;

      items.push({
        title: repoName,
        url: `https://github.com${repoLink}`,
        source: "GitHub Trending",
        description,
        score: Number.isNaN(stars) ? undefined : stars,
      });
    });

    return items;
  } catch (err) {
    logError("GitHub Trending", err);
    return [];
  }
}

async function fetchRSSFeeds(): Promise<RawItem[]> {
  const feeds = [
    { url: "https://blog.langchain.dev/rss/", source: "LangChain Blog" },
    { url: "https://www.crewai.com/blog/rss", source: "CrewAI Blog" },
    { url: "https://a16z.com/feed/", source: "a16z" },
    { url: "https://www.ycombinator.com/blog/rss", source: "Y Combinator Blog" },
    { url: "https://paulgraham.com/rss.html", source: "Paul Graham" },
    { url: "https://tldr.tech/api/rss/tech", source: "TLDR Tech" },
    { url: "https://bensbites.beehiiv.com/feed", source: "Ben's Bites" },
  ];

  const parser = new RSSParser();
  const items: RawItem[] = [];

  for (const feed of feeds) {
    try {
      log(`Fetching RSS: ${feed.source}...`);
      const parsed = await parser.parseURL(feed.url);
      for (const entry of parsed.items ?? []) {
        if (!entry.title || !entry.link) continue;
        items.push({
          title: entry.title,
          url: entry.link,
          source: feed.source,
          description: entry.contentSnippet?.slice(0, 500) ?? undefined,
          publishedAt: entry.isoDate ?? entry.pubDate ?? undefined,
        });
      }
    } catch (err) {
      logError(`RSS ${feed.source}`, err);
      // skip on failure
    }
  }

  return items;
}

// ---------------------------------------------------------------------------
// AI Selection Pipeline
// ---------------------------------------------------------------------------

function buildPrompt(rawItems: RawItem[]): string {
  const itemsJson = JSON.stringify(rawItems);

  return `You are a content curator for the Daily Digest newsletter. Today is ${TODAY}.

You are given a JSON array of raw content items fetched from various sources (Hacker News, Reddit, arXiv, GitHub Trending, RSS feeds).

Your task:
1. Review all the items provided.
2. Select the top 10 most interesting and relevant items for EACH of the following domains:
   - "AI/Tech" — artificial intelligence, machine learning, LLMs, developer tools, programming
   - "Product Design/Tools" — product management, design, developer experience, SaaS tools
   - "Startup/Business" — startups, fundraising, business strategy, entrepreneurship
   - "Market/Trading" — markets, finance, economics, trading, crypto

3. For each selected item produce an object with these exact fields:
   - "title": string — the item title (clean it up if needed)
   - "source": string — where it came from
   - "url": string — valid URL to the content
   - "domain": string — one of the four domains listed above (exact string match)
   - "summary": string — 用中文写「更长一点」的总结（建议 4-8 句，覆盖：讲了什么、关键点、背景/上下文、为什么重要）
   - "insight": string — 用中文写「客观洞察」（建议 2-4 句），聚焦行业影响/趋势信号/潜在二阶效应；不输出个人立场、不做投资建议
   - "rank": number — rank 1-10 within its domain (1 = most important)

Output language requirements:
- summary/insight 必须是中文
- 标题 title 可以保留原文（英文也行），但 summary/insight 必须中文

4. Return ONLY a valid JSON object matching this schema:
{
  "date": "${TODAY}",
  "generatedAt": "<ISO timestamp>",
  "cards": [ ...array of selected items... ]
}

Do NOT include any text outside the JSON. Do NOT wrap in markdown code fences.

Here are the raw items:

${itemsJson}`;
}

function callAI(rawItems: RawItem[]): DailyDigest | null {
  try {
    log("Calling openclaw agent for AI selection...");
    const prompt = buildPrompt(rawItems);

    // Write prompt to a temp file to avoid shell argument length limits
    const tmpFile = path.join(PROJECT_ROOT, ".tmp-prompt.txt");
    fs.writeFileSync(tmpFile, prompt, "utf-8");

    const result = execSync(
      // Use an explicit agent so the CLI doesn't require --to/--session-id
      `openclaw agent --agent main --message "$(cat ${JSON.stringify(tmpFile)})" --json`,
      {
        encoding: "utf-8",
        maxBuffer: 50 * 1024 * 1024, // 50 MB
        timeout: 8 * 60 * 1000, // 8 minutes (AI selection can take longer)
        cwd: PROJECT_ROOT,
      }
    );

    // Clean up temp file
    try { fs.unlinkSync(tmpFile); } catch {}

    // Parse the JSON response
    const parsed = JSON.parse(result);

    // openclaw agent --json returns a wrapper; the actual model text is usually in:
    // parsed.result.payloads[0].text
    let candidate: any = parsed;
    const payloadText = parsed?.result?.payloads?.[0]?.text;
    if (typeof payloadText === "string" && payloadText.trim().length > 0) {
      // payloadText itself should be a JSON string per our prompt
      candidate = JSON.parse(payloadText);
    } else if (parsed?.date && parsed?.cards) {
      candidate = parsed;
    } else if (parsed?.result?.date && parsed?.result?.cards) {
      candidate = parsed.result;
    } else if (parsed?.output?.date && parsed?.output?.cards) {
      candidate = parsed.output;
    }

    const validated = DailyDigestSchema.parse(candidate);
    log(`AI selection complete: ${validated.cards.length} cards across domains.`);
    return validated;
  } catch (err) {
    logError("AI selection", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Fallback: simple domain categorisation without AI
// ---------------------------------------------------------------------------

function guessDomain(item: RawItem): (typeof DOMAINS)[number] {
  const text = `${item.title} ${item.description ?? ""} ${item.source}`.toLowerCase();

  const aiKeywords = [
    "ai", "ml", "llm", "gpt", "machine learning", "neural", "transformer",
    "deep learning", "arxiv", "model", "language model", "diffusion",
    "github", "programming", "developer", "rust", "python", "typescript",
    "open source", "api", "framework", "library",
  ];
  const productKeywords = [
    "product", "design", "ux", "ui", "saas", "tool", "feature", "user experience",
    "figma", "notion", "workflow", "productivity",
  ];
  const startupKeywords = [
    "startup", "founder", "fundrais", "vc", "venture", "y combinator", "yc",
    "seed", "series", "entrepreneur", "business", "growth",
  ];
  const marketKeywords = [
    "market", "stock", "trading", "finance", "crypto", "bitcoin", "economy",
    "fed", "inflation", "invest", "etf",
  ];

  const score = (keywords: string[]) =>
    keywords.reduce((n, kw) => n + (text.includes(kw) ? 1 : 0), 0);

  const scores = [
    { domain: "AI/Tech" as const, s: score(aiKeywords) },
    { domain: "Product Design/Tools" as const, s: score(productKeywords) },
    { domain: "Startup/Business" as const, s: score(startupKeywords) },
    { domain: "Market/Trading" as const, s: score(marketKeywords) },
  ];

  scores.sort((a, b) => b.s - a.s);
  return scores[0].s > 0 ? scores[0].domain : "AI/Tech";
}

function buildFallbackDigest(rawItems: RawItem[]): DailyDigest {
  log("Building fallback digest from raw items...");

  const buckets: Record<string, DigestCard[]> = {};
  for (const domain of DOMAINS) buckets[domain] = [];

  for (const item of rawItems) {
    const domain = guessDomain(item);
    if (buckets[domain].length >= 10) continue;

    buckets[domain].push({
      title: item.title,
      source: item.source,
      url: item.url,
      domain,
      summary:
        item.description
          ? `摘要（fallback）：${item.description.slice(0, 800)}`
          : `摘要（fallback）：来自 ${item.source}。该条目标题为「${item.title}」。建议后续开启 AI 管线生成更完整中文总结。`,
      insight:
        `洞察（fallback）：当前为无 AI 模式下的粗分类与占位总结。来源：${item.source}` +
        (item.score ? `；热度/评分：${item.score}` : "") +
        "。",
      rank: buckets[domain].length + 1,
    });
  }

  const cards = Object.values(buckets).flat();

  return {
    date: TODAY,
    generatedAt: new Date().toISOString(),
    cards,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  log(`Starting data generation for ${TODAY}`);
  ensureDirs();

  // 1. Fetch from all sources in parallel
  const [hn, reddit, arxiv, github, rss] = await Promise.all([
    fetchHackerNews(),
    fetchReddit(),
    fetchArxiv(),
    fetchGitHubTrending(),
    fetchRSSFeeds(),
  ]);

  const allItems: RawItem[] = [...hn, ...reddit, ...arxiv, ...github, ...rss];
  log(`Fetched ${allItems.length} total raw items (HN: ${hn.length}, Reddit: ${reddit.length}, arXiv: ${arxiv.length}, GitHub: ${github.length}, RSS: ${rss.length})`);

  // 2. Save raw items
  const rawPath = path.join(RAW_DIR, `${TODAY}.raw.json`);
  const rawDigest = {
    date: TODAY,
    fetchedAt: new Date().toISOString(),
    items: allItems,
  };
  fs.writeFileSync(rawPath, JSON.stringify(rawDigest, null, 2), "utf-8");
  log(`Saved raw items to ${rawPath}`);

  // 3. Call AI selection pipeline
  let digest = callAI(allItems);

  // 4. If AI failed, use fallback
  if (!digest) {
    log("AI selection failed, using fallback categorisation.");
    digest = buildFallbackDigest(allItems);
  }

  // 5. Save final digest
  const digestPath = path.join(DATA_DIR, `${TODAY}.json`);
  fs.writeFileSync(digestPath, JSON.stringify(digest, null, 2), "utf-8");
  log(`Saved digest to ${digestPath}`);
  log(`Done! ${digest.cards.length} cards generated.`);
}

main().catch((err) => {
  console.error("[generate] Fatal error:", err);
  process.exit(1);
});
