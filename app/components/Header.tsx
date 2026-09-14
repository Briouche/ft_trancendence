import Link from "next/link"

import { english } from "@/config/english";
import { ROUTES } from "@/config/routes";
import { getSession } from "@/lib/session";

import LogoutButton from "./elements/LogoutButton";

export default async function Header() {
  const session = await getSession();

  return (
    <header className="py-2 text-center">
      {/* 3-column grid with an empty left cell balancing the logout button's column on the
          right, so the title (justify-self-center) stays visually centered on the page instead
          of drifting toward whichever side has content. */}
      <div className="grid grid-cols-3 items-center gap-4 p-4">
        <div />

        {/* clamp() (not a fixed text-8xl): plain text, scales continuously with the window
            instead of overflowing on narrow viewports. */}
        <h1
          className="font-pixel text-white hover:underline justify-self-center -translate-y-2"
          style={{ fontSize: "clamp(2rem, 6vw, 6rem)" }}
        >
          <Link href={ROUTES.home}>
            {english.appName}
          </Link>
        </h1>

        <div className="justify-self-end px-4">
          {session ? (
            <LogoutButton />
          ) : (
            <></>
          )}
        </div>
      </div>
    </header>
  );
}
