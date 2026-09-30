import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/cookieSession";
import { ROUTES } from "@/config/routes";
import ManualBook from "./ManualBook";

export default async function ManualPage() {
  const session = await getSession();
  if (!session) redirect(ROUTES.home);

  return <ManualBook />;
}
