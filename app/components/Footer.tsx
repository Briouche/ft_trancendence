import Link from "next/link";

import { english } from "@/config/english";
import { ROUTES } from "@/config/routes";

/**
 * Site footer with the legal links, rendered once by the root layout so it is present on every
 * page (the subject requires Privacy Policy and Terms of Service to be reachable from all of
 * them). Pinned to the bottom-left corner in small print because most pages are full-screen
 * scenes (3D hub, notebook pages, the game canvas) with no document flow to put it in.
 */
export default function Footer() {
  return (
    <footer className="pointer-events-none fixed bottom-0 left-0 z-50 p-2">
      <nav
        aria-label="Legal"
        className="pointer-events-auto flex items-center gap-3 rounded bg-ink-950/70 px-2 py-1 font-pixel text-xs text-parchment-200"
      >
        <Link className="hover:underline" href={ROUTES.privacyNotice}>{english.privacyPolicy}</Link>
        <span aria-hidden="true">·</span>
        <Link className="hover:underline" href={ROUTES.termsOfUse}>{english.termsOfService}</Link>
      </nav>
    </footer>
  );
}
