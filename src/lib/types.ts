import { z } from "zod";

export const DOMAINS = [
  "AI/Tech",
  "Product Design/Tools",
  "Startup/Business",
  "Market/Trading",
] as const;

export type Domain = (typeof DOMAINS)[number];

export const DigestCardSchema = z.object({
  title: z.string(),
  source: z.string(),
  url: z.string().url(),
  domain: z.enum(DOMAINS),
  summary: z.string(),
  insight: z.string(),
  rank: z.number().int().min(1).max(10),
});

export type DigestCard = z.infer<typeof DigestCardSchema>;

export const DailyDigestSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  generatedAt: z.string(),
  cards: z.array(DigestCardSchema),
});

export type DailyDigest = z.infer<typeof DailyDigestSchema>;

// Raw item from fetchers before AI processing
export const RawItemSchema = z.object({
  title: z.string(),
  url: z.string(),
  source: z.string(),
  description: z.string().optional(),
  score: z.number().optional(),
  publishedAt: z.string().optional(),
});

export type RawItem = z.infer<typeof RawItemSchema>;

export const RawDigestSchema = z.object({
  date: z.string(),
  fetchedAt: z.string(),
  items: z.array(RawItemSchema),
});

export type RawDigest = z.infer<typeof RawDigestSchema>;
