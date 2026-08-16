import Link from "next/link";

import { english } from "@/config/english";
import { ROUTES } from "@/config/routes";
import RoundedRectangle from "./elements/RoundedRectangle";

export default function Footer() {
  return (
    <footer className="flex flex-col gap-0 py-2 text-sm text-foreground/80">
      <RoundedRectangle>
        <nav className="flex justify-center gap-4">
          <Link className="hover:underline" href={ROUTES.privacyNotice}>{english.privacyPolicy}</Link>
          <Link className="hover:underline" href={ROUTES.termsOfUse}>{english.termsOfService}</Link>
        </nav>
        <p className="text-right text-foreground/40 text-xs">{english.copyright}</p>
      </RoundedRectangle>
    </footer>
  );
}
