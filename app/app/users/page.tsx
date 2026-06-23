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
    </main>
  );
}
