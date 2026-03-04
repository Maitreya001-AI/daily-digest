You are implementing a small product called Daily Digest based on the PRD below.

Repo: /Users/xrensiu/dev/openclaw-repos/daily-digest (already git init).

Goal: static site deployable on Vercel, no backend. Data files in /data/YYYY-MM-DD.json committed to repo. UI: left date nav, right content grouped by domains, with domain filter tabs.

Implement MVP:
1) Next.js (App Router) + Tailwind CSS for UI.
2) Data loader reads JSON files from /data at build/runtime (static). List available dates by reading /data directory.
3) Scripts to generate today's digest:
   - Fetch content from public sources WITHOUT auth for now: Hacker News (Algolia API), Reddit subreddits via RSS, arXiv API, GitHub Trending scrape, plus a generic RSS list for blogs (LangChain, CrewAI, a16z, YC, PG, TLDR, Ben's Bites, Finviz if possible).
   - Store raw items in /data/raw/YYYY-MM-DD.raw.json (optional) then run AI selection+summaries.
   - For AI, call existing OpenClaw Gateway model via CLI: `openclaw agent --message <prompt> --json` (no --deliver) and parse JSON. Prompt the agent to select top 10 per domain and produce cards fields: title, source, url, domain, summary, insight, rank. Ensure insight is objective.
   - Output final /data/YYYY-MM-DD.json.
4) Provide README with how to run generator and dev server.
5) Add type definitions and zod validation for JSON structure.

Constraints:
- Must run locally with Node 20+.
- Avoid requiring external API keys for fetching (except OpenClaw uses existing auth).
- Handle failures per source gracefully and continue.

When completely finished, run:
openclaw system event --text "Done: Daily Digest MVP scaffolded (Next.js UI + generator script) in workspace/daily-digest" --mode now

PRD summary:
- Domains: AI/Tech; Product Design/Tools; Startup/Business; Market/Trading
- Per domain: daily select top 10, rank them, produce summary+insight+url+source.
