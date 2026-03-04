# Daily Digest

A curated daily digest of top content across AI/Tech, Product Design/Tools, Startup/Business, and Market/Trading. Static site built with Next.js, deployable on Vercel.

## Prerequisites

- Node.js 20+
- [OpenClaw CLI](https://openclaw.com) installed and authenticated (for AI-powered content curation)

## Quick Start

```bash
# Install dependencies
npm install

# Generate today's digest
npm run generate

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view.

## Generate Today's Digest

```bash
npm run generate
# or
npx tsx scripts/generate.ts
```

This will:
1. Fetch content from Hacker News, Reddit, arXiv, GitHub Trending, and RSS feeds
2. Save raw items to `data/raw/YYYY-MM-DD.raw.json`
3. Use OpenClaw AI to select top 10 items per domain and generate summaries
4. Save the final digest to `data/YYYY-MM-DD.json`

## Data Format

Each digest file (`data/YYYY-MM-DD.json`) contains:

```json
{
  "date": "2026-03-04",
  "generatedAt": "2026-03-04T12:00:00.000Z",
  "cards": [
    {
      "title": "...",
      "source": "Hacker News",
      "url": "https://...",
      "domain": "AI/Tech",
      "summary": "2-3 sentence summary",
      "insight": "Objective analysis",
      "rank": 1
    }
  ]
}
```

## Domains

- **AI/Tech** - AI research, ML tools, developer platforms
- **Product Design/Tools** - Design systems, dev tools, product management
- **Startup/Business** - Fundraising, strategy, entrepreneurship
- **Market/Trading** - Markets, fintech, economic trends

## Deploy to Vercel

1. Push this repo to GitHub
2. Import the repo on [Vercel](https://vercel.com)
3. Deploy — no configuration needed (uses `output: "export"` for static generation)

To update content: run `npm run generate`, commit the new data file, and push.

## Project Structure

```
├── data/                    # Digest JSON files (committed to repo)
│   ├── raw/                 # Raw fetched data (optional)
│   └── YYYY-MM-DD.json      # Daily digest files
├── scripts/
│   └── generate.ts          # Data fetcher + AI curation pipeline
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React components
│   └── lib/                 # Types, schemas, data loader
└── package.json
```
