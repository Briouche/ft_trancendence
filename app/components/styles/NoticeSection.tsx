import { ReactNode } from "react";

interface NoticeSectionProps {
  title: string;
  children: ReactNode;
}

/** One titled section of a legal page (see NoticePage). */
export function NoticeSection({ title, children }: NoticeSectionProps) {
  return (
    <section className="mb-section">
      <h2 className="font-pixel text-2xl text-ink-text mb-2">{title}</h2>
      {children}
    </section>
  );
}
