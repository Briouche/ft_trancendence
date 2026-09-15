import Link from "next/link";

import { english } from "@/config/english";
import { ROUTES } from "@/config/routes";

export default function Footer() {
  return (
    <footer className="flex flex-col gap-0 px-4 py-2 text-sm text-white">
      <nav className="flex justify-between gap-4 font-pixel text-base">
        <Link className="hover:underline" href={ROUTES.privacyNotice}>{english.privacyPolicy}</Link>
        <Link className="hover:underline" href={ROUTES.termsOfUse}>{english.termsOfService}</Link>
      </nav>
      <p className="text-right font-pixel text-xs text-white/70">{english.copyright}</p>
    </footer>
  );
}
