"use client";

import { logoutUser } from "@/lib/auth/formActions";

import FormButton from "./FormButton";

export default function LogoutButton() {
  return (
    <form action={logoutUser}>
      <FormButton className="w-auto! px-4 py-1.5 text-sm">
        Log out
      </FormButton>
    </form>
  );
}
