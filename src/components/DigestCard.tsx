import type { DigestCard as DigestCardType, Domain } from "@/lib/types";

interface DigestCardProps {
  card: DigestCardType;
}

const DOMAIN_BADGE_STYLES: Record<Domain, string> = {
  "AI/Tech": "bg-blue-500/15 text-blue-400 border-blue-500/20",
  "Product Design/Tools": "bg-purple-500/15 text-purple-400 border-purple-500/20",
  "Startup/Business": "bg-green-500/15 text-green-400 border-green-500/20",
  "Market/Trading": "bg-amber-500/15 text-amber-400 border-amber-500/20",
};

const RANK_STYLES: Record<Domain, string> = {
  "AI/Tech": "bg-blue-500 text-white",
  "Product Design/Tools": "bg-purple-500 text-white",
  "Startup/Business": "bg-green-500 text-white",
  "Market/Trading": "bg-amber-500 text-white",
};

export default function DigestCard({ card }: DigestCardProps) {
  const domainBadge = DOMAIN_BADGE_STYLES[card.domain];
  const rankStyle = RANK_STYLES[card.domain];

  return (
    <article className="group relative bg-gray-900 border border-gray-800 rounded-xl p-5 transition-all duration-200 hover:border-gray-700 hover:bg-gray-900/80">
      {/* Header: rank + domain */}
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold ${rankStyle}`}>
          {card.rank}
        </span>
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${domainBadge}`}>
          {card.domain}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-[15px] font-semibold text-gray-100 leading-snug mb-1.5 group-hover:text-white">
        <a
          href={card.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline decoration-gray-600 underline-offset-2"
        >
          {card.title}
          <span className="inline-block ml-1.5 text-gray-600 group-hover:text-gray-400 transition-colors">
            <svg className="w-3.5 h-3.5 inline -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </span>
        </a>
      </h3>

      {/* Source */}
      <p className="text-xs text-gray-500 mb-3">{card.source}</p>

      {/* Summary */}
      <p className="text-sm text-gray-300 leading-relaxed mb-3">
        {card.summary}
      </p>

      {/* Insight */}
      <div className="flex gap-2 items-start bg-gray-800/50 rounded-lg px-3 py-2.5 border border-gray-800">
        <span className="text-yellow-500/80 mt-0.5 shrink-0" aria-hidden="true">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM4 11a1 1 0 100-2H3a1 1 0 000 2h1zM10 18a1 1 0 001-1v-1a1 1 0 10-2 0v1a1 1 0 001 1zM7 10a3 3 0 116 0 3 3 0 01-6 0z" />
          </svg>
        </span>
        <p className="text-xs text-gray-400 italic leading-relaxed">
          {card.insight}
        </p>
      </div>
    </article>
  );
}
