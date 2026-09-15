import Link from "next/link"

import { english } from "@/config/english";
import { ROUTES } from "@/config/routes";
import { getSession } from "@/lib/session";

import LogoutButton from "./elements/LogoutButton";

// Site title centered in a 3-column grid, logout button on the right when signed in.
export default async function Header() {
  const session = await getSession();

  return (
    <header className="py-2 text-center">
      <div className="grid grid-cols-3 items-center gap-4 p-4">
        <div />

        <h1
          className="font-pixel text-white hover:underline justify-self-center -translate-y-2"
          style={{ fontSize: "clamp(2rem, 6vw, 6rem)" }}
        >
          <Link href={ROUTES.home}>
            {english.appName}
          </Link>
        </h1>

        <div className="justify-self-end px-4">
          {session && <LogoutButton />}
        </div>
      </div>
    </header>
  );
}
