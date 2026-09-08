import React from "react";
import Link from "next/link";

export interface NoticeData {
  title: string;
  lastUpdated?: string;
  body: React.ReactNode;
}

interface NoticePageProps {
  data: NoticeData;
}

// Shared layout for the static legal pages (privacy, terms) — content passed via `data` (see
// config/english.tsx for the actual copy) rather than hardcoded here, so both pages reuse the
// same header/back-link/scrolling-body chrome.
export default function NoticePage({ data }: NoticePageProps) {
  const { title, lastUpdated, body } = data;

  return (
    <article className="flex w-full flex-1 min-h-0 flex-col px-15 py-vertical">
      <header className="mb-vertical flex items-end justify-between gap-text-gap border-b border-foreground/10 pb-vertical">
        <div>
          <h1 className="font-pixel text-4xl text-foreground">{title}</h1>
          {lastUpdated && (
            <p className="text-sm text-foreground/60 mt-2">
              Last updated: {lastUpdated}
            </p>
          )}
        </div>

        <Link
          href="/"
          className="shrink-0 text-sm font-medium text-foreground hover:underline"
        >
          back
        </Link>
      </header>

      <div className="w-full flex-1 min-h-0 rounded-card bg-background-secondary p-vertical overflow-y-auto">
        {/* [@tailwindcss/typography] isn't installed, so "prose" carries no styling — not worth
            adding the dependency for just these 2 pages, so <p> is styled directly instead. */}
        <div className="max-w-none text-ink-muted leading-relaxed [&_p]:mb-3">{body}</div>
      </div>
    </article>
  );
}
