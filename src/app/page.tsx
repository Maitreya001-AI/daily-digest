import { getAvailableDates, getDigest, getLatestDate } from "@/lib/data";
import DigestView from "@/components/DigestView";

export default function Home() {
  const dates = getAvailableDates();
  const latestDate = getLatestDate();
  const digest = latestDate ? getDigest(latestDate) : null;

  return (
    <DigestView
      dates={dates}
      currentDate={latestDate ?? ""}
      digest={digest}
    />
  );
}
