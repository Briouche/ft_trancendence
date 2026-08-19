import Link from "next/link"

import { english } from "@/config/english";
import { ROUTES } from "@/config/routes";
import { getSession } from "@/lib/session";

import RoundedRectangle from "./elements/RoundedRectangle";
import LogoutButton from "./elements/LogoutButton";

export default async function Header() {
  const session = await getSession();

  return (

    <header className="py-2 text-center">
      <RoundedRectangle className="p-4" variant="parchment-roll-panel">
        <div className="grid grid-cols-3 items-center gap-4">
          <div />

          <h1 className="font-pixel text-5xl hover:underline justify-self-center -translate-y-2">
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
      </RoundedRectangle>
    </header>
  );
}
