import Link from "next/link"

import { english } from "@/config/english";
import { ROUTES } from "@/config/routes";

<<<<<<< HEAD:app/components/Header.tsx
import LogoutButton from "./elements/LogoutButton";

/** Site title centered in a 3-column grid, logout button on the right when signed in. */
=======
// Site title centered in a 3-column grid.
>>>>>>> origin/merge/readme-review-dev:app/components/auth-forms/Header.tsx
export default async function Header() {
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

        </div>
      </div>
    </header>
  );
}
