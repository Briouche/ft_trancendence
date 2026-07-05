"use server";

import prisma from "../lib/prisma";
import { revalidatePath } from "next/cache";

export async function createUser(formData: FormData) {
  const email = formData.get("email") as string;
  const name = formData.get("name") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  try {
    await prisma.user.create({
      data: {
        email,
        name: name || null,
        password, // In a real production app, ensure you hash this using a library like bcrypt or argon2!
        unopenedPacks: 5,
      },
    });

    // Tells Next.js to clear the cache for the users page and fetch the fresh data
    revalidatePath("/users");
  } catch (error) {
    console.error("Failed to create user:", error);
    throw new Error("Could not create user. Email might already exist.");
  }
}
