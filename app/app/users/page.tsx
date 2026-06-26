<<<<<<< HEAD
//
//  page.ts
//  
//
//  Created by François on 12/06/2026.
//

"use client";

import { useState } from "react";

export default function Users() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Add User</h1>
        <p className="text-sm text-gray-500 mb-6">Enter the user's details below.</p>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="firstName"
              className="text-sm font-medium text-gray-700"
            >
              First name
            </label>
            <input
              id="firstName"
              type="text"
              placeholder="e.g. Marie"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="lastName"
              className="text-sm font-medium text-gray-700"
            >
              Last name
            </label>
            <input
              id="lastName"
              type="text"
              placeholder="e.g. Dupont"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
            />
          </div>
        </div>

        <button
          onClick={() => alert(`Adding user: ${firstName} ${lastName}`)}
          disabled={!firstName || !lastName}
          className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Add user
        </button>
      </div>
=======
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
        <form action={createUser} style={{ display: "flex", flexDirection: "col", gap: "12px" }}>
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
>>>>>>> yet_another_one
    </main>
  );
}
