import fs from "fs";
import path from "path";
import { DailyDigestSchema, type DailyDigest } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

export function getAvailableDates(): string[] {
  if (!fs.existsSync(DATA_DIR)) return [];
  return fs
    .readdirSync(DATA_DIR)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .map((f) => f.replace(".json", ""))
    .sort()
    .reverse();
}

export function getDigest(date: string): DailyDigest | null {
  const filePath = path.join(DATA_DIR, `${date}.json`);
  if (!fs.existsSync(filePath)) return null;
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const result = DailyDigestSchema.safeParse(raw);
  if (!result.success) {
    console.error(`Invalid digest for ${date}:`, result.error);
    return null;
  }
  return result.data;
}

export function getLatestDate(): string | null {
  const dates = getAvailableDates();
  return dates.length > 0 ? dates[0] : null;
}
