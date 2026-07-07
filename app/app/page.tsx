import { getCurrentUser } from "@/lib/auth";

import Home from "@/components/Home";
import SignIn from "@/components/SignIn";

export default async function HomePage() {
  const user = await getCurrentUser();

  return <div>{user ? <Home /> : <SignIn />}</div>;
}
