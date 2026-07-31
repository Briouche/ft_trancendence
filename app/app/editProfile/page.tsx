import { redirect } from "next/navigation";
import { getUserDetails } from "@/lib/auth";
import EditProfile from "@/components/EditProfile";

export default async function editProfilePage() {
  const user = await getUserDetails();
  if (!user) {
    redirect("/");
  }
  return <EditProfile user={user} />;
}
