import { redirect } from "next/navigation";
import { getUserDetails } from "@/lib/auth";
import Profile from "@/components/Profile";

export default async function ProfilePage() {
  const user = await getUserDetails();
  if (!user) {
    redirect("/");
  }
  return <Profile user={user} />;
}
