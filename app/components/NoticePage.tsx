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

/** Shared layout of the legal pages (privacy, terms): header, back link, scrolling body. */
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
        <div className="max-w-none text-ink-muted leading-relaxed [&_p]:mb-3">{body}</div>
      </div>
    </article>
  );
}
