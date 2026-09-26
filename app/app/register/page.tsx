import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import RegisterForm from "@/components/RegisterForm";
import { getSession } from "@/lib/session";
import { ROUTES } from "@/config/routes";

export const metadata: Metadata = { title: "Create an account" };

/** /register — account creation (signed-in users go back to the hub). */
export default async function RegisterPage() {
  if (await getSession()) redirect(ROUTES.home);

  return (
    <>
      <Header />
      <RegisterForm />
    </>
  );
}
