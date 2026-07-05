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
    <main style={{ maxWidth: "600px", margin: "40px auto", padding: "0 20px", fontFamily: "sans-serif" }}>
      <h2>Manage Users</h2>

      {/* --- Create User Form --- */}
      <section style={{ marginBottom: "40px", padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
        <h3 style={{ marginTop: 0 }}>Add New User</h3>
        <form action={createUser} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "4px" }}>Name</label>
            <input type="text" name="name" style={{ width: "100%", padding: "8px", boxSizing: "border-box" }} />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "4px" }}>Email *</label>
            <input
              type="email"
              name="email"
              required
              style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "4px" }}>Password *</label>
            <input
              type="password"
              name="password"
              required
              style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: "10px",
              backgroundColor: "#0070f3",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginTop: "8px",
            }}
          >
            Create User
          </button>
        </form>
      </section>

      {/* --- Display Users List --- */}
      <section>
        <h3>Existing Users ({users.length})</h3>
        {users.length === 0 ? (
          <p style={{ color: "#666" }}>No users found in the database.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {users.map((user) => (
              <li
                key={user.id}
                style={{
                  padding: "12px",
                  borderBottom: "1px solid #eee",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong>{user.name || "Anonymous"}</strong>
                  <span style={{ color: "#666", marginLeft: "8px" }}>({user.email})</span>
                </div>
                <small style={{ color: "#999" }}>
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
