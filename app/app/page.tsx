import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div>
      {user ? (
        <p>Welcome back, {user.username}!</p>
      ) : (
        <p>You are not logged in.</p>
      )}
    </div>
  );
}
