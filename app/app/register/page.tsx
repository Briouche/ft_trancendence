import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Register from "@/components/Register";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");
  return <Register />;
}
