import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";
import * as fs from "fs";
import * as path from "path";

interface RawUser {
  email: string;
  username: string;
  password: string;
}

/** Dev/test accounts from data/users-collection.json (passwords hashed on insert). */
export async function seedUsers(prisma: PrismaClient) {
  const jsonPath = path.resolve(__dirname, "./data/users-collection.json");
  const raw = fs.readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(raw) as { users: RawUser[] };

  console.log(`👥 Seeding ${data.users.length} users...`);

  for (const user of data.users) {
    const email = user.email.toLowerCase();
    const username = user.username.toLowerCase();
    const password = await hash(user.password);

    await prisma.user.upsert({
      where: { email },
      // Left untouched when the account exists: the seed runs on every container start, and
      // re-applying the JSON password would undo any password change made in the app.
      update: {},
      create: {
        email,
        username,
        password,
      },
    });
  }

  console.log("✅ Users successfully seeded.");
}
