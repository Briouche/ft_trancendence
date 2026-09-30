import Link from "next/link";

import { english } from "@/config/english";
import { ROUTES } from "@/config/routes";

/**
 * Legal links shown on every page (mounted once by the root layout). Fixed and discreet in the
 * bottom-left corner, so the full-screen pages (hub, game, notebook pages) keep their layout.
 */
export default function SiteFooter() {
  return (
    <footer className="pointer-events-none fixed bottom-0 left-0 z-40 p-2">
      <nav
        aria-label="Legal"
        className="pointer-events-auto flex items-center gap-3 rounded bg-ink-950/60 px-2 py-1 font-pixel text-xs text-white/80"
      >
        <Link className="hover:text-white hover:underline" href={ROUTES.privacyNotice}>{english.privacyPolicy}</Link>
        <span aria-hidden="true">·</span>
        <Link className="hover:text-white hover:underline" href={ROUTES.termsOfUse}>{english.termsOfService}</Link>
      </nav>
    </footer>
  );
}
