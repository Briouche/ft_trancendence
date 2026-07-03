// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css"; // <--- Make sure this path points to your globals.css

export const metadata: Metadata = {
  title: "My Full-Stack App",
  description: "Built with Next.js, Prisma, and Tailwind v4",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
