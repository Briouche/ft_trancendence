"use client";

import { logoutUser } from "@/lib/auth";

import FormButton from "./FormButton";

/** "Log out" button: posts the logoutUser server action, which clears the session cookie. */
export default function LogoutButton() {
  return (
    <form action={logoutUser}>
      <FormButton className="w-auto! px-4 py-1.5 text-sm">
        Log out
      </FormButton>
    </form>
  );
}
