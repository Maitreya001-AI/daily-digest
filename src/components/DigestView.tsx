"use client";

import { useState } from "react";
import Link from "next/link";
import { DOMAINS, type DailyDigest, type Domain } from "@/lib/types";
import DigestCard from "./DigestCard";

interface DigestViewProps {
  dates: string[];
  currentDate: string;
  digest: DailyDigest | null;
}

const DOMAIN_COLORS: Record<Domain, string> = {
  "AI/Tech": "blue",
  "Product Design/Tools": "purple",
  "Startup/Business": "green",
  "Market/Trading": "amber",
};

const TAB_STYLES: Record<string, string> = {
  all: "bg-gray-700 text-white",
  blue: "bg-blue-600/20 text-blue-400 border border-blue-500/30",
  purple: "bg-purple-600/20 text-purple-400 border border-purple-500/30",
  green: "bg-green-600/20 text-green-400 border border-green-500/30",
  amber: "bg-amber-600/20 text-amber-400 border border-amber-500/30",
};

const TAB_INACTIVE: Record<string, string> = {
  all: "text-gray-400 hover:text-white hover:bg-gray-800",
  blue: "text-gray-400 hover:text-blue-400 hover:bg-blue-600/10",
  purple: "text-gray-400 hover:text-purple-400 hover:bg-purple-600/10",
  green: "text-gray-400 hover:text-green-400 hover:bg-green-600/10",
  amber: "text-gray-400 hover:text-amber-400 hover:bg-amber-600/10",
};

function formatDateLabel(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function DigestView({ dates, currentDate, digest }: DigestViewProps) {
  const [selectedDomain, setSelectedDomain] = useState<Domain | "all">("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredCards = digest?.cards.filter(
    (card) => selectedDomain === "all" || card.domain === selectedDomain
  ) ?? [];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-gray-900 border-r border-gray-800
          flex flex-col
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="p-5 border-b border-gray-800">
          <h1 className="text-lg font-semibold text-white tracking-tight">Daily Digest</h1>
          <p className="text-xs text-gray-500 mt-1">Curated daily insights</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider px-2 mb-2">
            Archives
          </p>
          {dates.length === 0 ? (
            <p className="text-sm text-gray-600 px-2">No digests yet</p>
          ) : (
            <ul className="space-y-0.5">
              {dates.map((date) => {
                const isActive = date === currentDate;
                return (
                  <li key={date}>
                    <Link
                      href={`/${date}`}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        block px-3 py-2 rounded-lg text-sm transition-colors
                        ${isActive
                          ? "bg-gray-800 text-white font-medium"
                          : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                        }
                      `}
                    >
                      {formatDateLabel(date)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-gray-950/80 backdrop-blur-md border-b border-gray-800/50">
          <div className="flex items-center gap-3 px-4 lg:px-6 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800"
              aria-label="Open sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h2 className="text-base font-semibold text-white">
                {currentDate ? formatDateLabel(currentDate) : "Daily Digest"}
              </h2>
              {digest && (
                <p className="text-xs text-gray-500">
                  {digest.cards.length} stories
                </p>
              )}
            </div>
          </div>

          {/* Domain filter tabs */}
          {digest && (
            <div className="flex gap-2 px-4 lg:px-6 pb-3 overflow-x-auto">
              <button
                onClick={() => setSelectedDomain("all")}
                className={`
                  px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all
                  ${selectedDomain === "all" ? TAB_STYLES.all : TAB_INACTIVE.all}
                `}
              >
                All ({digest.cards.length})
              </button>
              {DOMAINS.map((domain) => {
                const color = DOMAIN_COLORS[domain];
                const count = digest.cards.filter((c) => c.domain === domain).length;
                if (count === 0) return null;
                return (
                  <button
                    key={domain}
                    onClick={() => setSelectedDomain(domain)}
                    className={`
                      px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all
                      ${selectedDomain === domain ? TAB_STYLES[color] : TAB_INACTIVE[color]}
                    `}
                  >
                    {domain} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </header>

        {/* Content area */}
        <div className="p-4 lg:p-6">
          {!digest ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-400 mb-1">No digest available</h3>
              <p className="text-sm text-gray-600 max-w-sm">
                {currentDate
                  ? `No digest was found for ${formatDateLabel(currentDate)}.`
                  : "No digests have been generated yet. Check back later."}
              </p>
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
              <p className="text-sm text-gray-500">No stories in this category.</p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">
              {filteredCards.map((card, index) => (
                <DigestCard key={`${card.url}-${index}`} card={card} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
