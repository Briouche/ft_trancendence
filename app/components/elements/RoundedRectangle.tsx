import type { ReactNode } from "react";

export default function RoundedRectangle({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-card bg-background-secondary border border-foreground/10 p-1.5 px-2 ${className}`}
    >
      {children}
    </div>
  );
}
