import { redirect } from "next/navigation";
import { getUserDetails } from "@/lib/auth";
import Register from "@/components/Register";

export default async function RegisterPage() {
  const user = await getUserDetails();
  if (user) {
    redirect("/");
  }
  return <Register />;
}
