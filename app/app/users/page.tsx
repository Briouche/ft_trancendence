import prisma from "../../lib/prisma";
import { createUser } from "../actions";

// This forces Next.js to fetch live data rather than caching a static page
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  // 1. Fetch all users directly from PostgreSQL using Prisma on the server
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="max-w-[600px] mx-auto my-10 px-5 font-serif text-parchment-100">
      <h2 className="font-display text-2xl font-bold text-parchment-100 mb-6">Manage Users</h2>

      {/* --- Create User Form --- */}
      <section className="mb-10 p-5 border border-leather-700 rounded-lg bg-ink-900">
        <h3 className="font-display text-lg text-parchment-100 mt-0 mb-3">Add New User</h3>
        <form action={createUser} className="flex flex-col gap-3">
          <div>
            <label className="block mb-1 text-sm text-parchment-300/70">Name</label>
            <input
              type="text"
              name="name"
              className="w-full box-border rounded-md border border-leather-700 bg-ink-950 px-3 py-2 text-parchment-100"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm text-parchment-300/70">Email *</label>
            <input
              type="email"
              name="email"
              required
              className="w-full box-border rounded-md border border-leather-700 bg-ink-950 px-3 py-2 text-parchment-100"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm text-parchment-300/70">Password *</label>
            <input
              type="password"
              name="password"
              required
              className="w-full box-border rounded-md border border-leather-700 bg-ink-950 px-3 py-2 text-parchment-100"
            />
          </div>

          <button
            type="submit"
            className="mt-2 rounded-md border border-gold-500/50 bg-leather-800 px-4 py-2.5 font-display font-bold text-gold-300 cursor-pointer hover:bg-leather-700 transition-colors"
          >
            Create User
          </button>
        </form>
      </section>

      {/* --- Display Users List --- */}
      <section>
        <h3 className="font-display text-lg text-parchment-100 mb-2">Existing Users ({users.length})</h3>
        {users.length === 0 ? (
          <p className="text-parchment-300/50">No users found in the database.</p>
        ) : (
          <ul className="list-none p-0">
            {users.map((user) => (
              <li
                key={user.id}
                className="flex items-center justify-between py-3 border-b border-leather-800"
              >
                <div>
                  <strong className="text-parchment-100">{user.name || "Anonymous"}</strong>
                  <span className="ml-2 text-parchment-300/50">({user.email})</span>
                </div>
                <small className="text-parchment-300/40">
                  ID: {user.id} — {new Date(user.createdAt).toLocaleDateString()}
                </small>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
