import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";
import * as fs from "fs";
import * as path from "path";

interface RawUser {
  email: string;
  username: string;
  password: string;
}

// Seeds dev/test accounts from a JSON fixture (plaintext passwords in the fixture, hashed here
// before insert) — not used to provision real/prod accounts.
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
      update: {
        username,
        password,
      },
      create: {
        email,
        username,
        password,
      },
    });
  }

  console.log("✅ Users successfully seeded.");
}
