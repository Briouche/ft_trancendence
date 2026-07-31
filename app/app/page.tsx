import { verifyUserCookie } from "@/lib/auth";

import Home from "@/components/Home";
import SignIn from "@/components/SignIn";

export default async function HomePage() {
  //const user = await verifyUserCookie();

  //return <div>{user ? <Home /> : <SignIn />}</div>;
  return <div> <Home /> </div>;
}
