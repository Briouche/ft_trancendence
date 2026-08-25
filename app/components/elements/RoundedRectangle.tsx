import type { ReactNode } from "react";

export default function RoundedRectangle({
  children,
  className = "",
  variant = "book-panel",
}: {
  children: ReactNode;
  className?: string;
  /** "book-panel" (petit panneau plat, cartes), "book-cover-panel" (couverture illustrée,
   *  bandeaux larges comme Header/Footer), ou "book-slot" (case fine, petites pastilles). */
  variant?: "book-panel" | "book-cover-panel" | "book-slot";
}) {
  return (
    <div className={`${variant} text-ink-text p-1.5 px-2 ${className}`}>
      {children}
    </div>
  );
}
