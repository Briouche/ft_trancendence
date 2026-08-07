import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";
import * as fs from "fs";
import * as path from "path";

interface RawUser {
  email: string;
  username: string;
  password: string;
}

export async function seedUsers(prisma: PrismaClient) {
  const jsonPath = path.resolve(__dirname, "./data/users-collection.json");
  const raw = fs.readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(raw) as { users: RawUser[] };

  console.log(`👥 Seeding ${data.users.length} users...`);

  for (const user of data.users) {
    const email = user.email.toLowerCase();
    const username = user.username.toLowerCase();
    const password = await argon2.hash(user.password, {
      type: argon2.argon2id,
    });

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
