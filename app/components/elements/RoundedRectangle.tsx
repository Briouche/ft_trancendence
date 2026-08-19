import type { ReactNode } from "react";

export default function RoundedRectangle({
  children,
  className = "",
  variant = "parchment-panel",
}: {
  children: ReactNode;
  className?: string;
  /** "parchment-panel" (coin unique enroulé, cartes hautes) ou "parchment-roll-panel"
   *  (rouleau à deux embouts, bandeaux larges et fins comme Header/Footer). */
  variant?: "parchment-panel" | "parchment-roll-panel";
}) {
  return (
    <div className={`${variant} text-ink-text p-1.5 px-2 ${className}`}>
      {children}
    </div>
  );
}
