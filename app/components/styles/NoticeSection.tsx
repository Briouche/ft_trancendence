import { ReactNode } from "react";

interface NoticeSectionProps {
  title: string;
  children: ReactNode;
}

export function NoticeSection({ title, children }: NoticeSectionProps) {
  return (
    <section className="mb-section">
      <h2 className="font-pixel text-2xl text-ink-text mb-2">{title}</h2>
      {children}
    </section>
  );
}
