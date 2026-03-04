import { getAvailableDates, getDigest } from "@/lib/data";
import DigestView from "@/components/DigestView";

interface DatePageProps {
  params: Promise<{ date: string }>;
}

export function generateStaticParams() {
  const dates = getAvailableDates();
  return dates.map((date) => ({ date }));
}

export default async function DatePage({ params }: DatePageProps) {
  const { date } = await params;
  const dates = getAvailableDates();
  const digest = getDigest(date);

  return (
    <DigestView
      dates={dates}
      currentDate={date}
      digest={digest}
    />
  );
}
