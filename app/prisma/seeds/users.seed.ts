import { PrismaClient, FriendshipStatus } from "@prisma/client";
import { hash } from "@node-rs/argon2";
import * as fs from "fs";
import * as path from "path";

interface RawUser {
  email: string;
  username: string;
  password: string;
  unlockAllCards?: boolean;
}

interface RawFriendship {
  requester: string;
  addressee: string;
  status: FriendshipStatus;
}

// Seeds dev/test accounts and their friendships from a JSON fixture (plaintext passwords in the
// fixture, hashed here before insert) — not used to provision real/prod accounts.
export async function seedUsers(prisma: PrismaClient) {
  const jsonPath = path.resolve(__dirname, "./data/users-collection.json");
  const raw = fs.readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(raw) as { users: RawUser[]; friendships?: RawFriendship[] };

  console.log(`👥 Seeding ${data.users.length} users...`);

  const userIdByUsername = new Map<string, number>();

  for (const user of data.users) {
    const email = user.email.toLowerCase();
    const username = user.username.toLowerCase();
    const password = await hash(user.password);

    const created = await prisma.user.upsert({
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

    userIdByUsername.set(username, created.id);
  }

  console.log("✅ Users successfully seeded.");

  // Same as the unlock-all route (app/api/collection/unlock-all): every card at its max qty.
  // Relies on seedCards() having run first so the Card table is populated.
  const unlockAllUsers = data.users.filter((u) => u.unlockAllCards);
  if (unlockAllUsers.length > 0) {
    const cards = await prisma.card.findMany({ select: { id: true, qty: true } });

    for (const user of unlockAllUsers) {
      const userId = userIdByUsername.get(user.username.toLowerCase())!;

      await prisma.$transaction(
        cards.map((card) =>
          prisma.userCard.upsert({
            where: { userId_cardId: { userId, cardId: card.id } },
            create: { userId, cardId: card.id, qty: card.qty },
            update: { qty: card.qty },
          })
        )
      );
      console.log(`🃏 Unlocked all ${cards.length} cards for ${user.username}.`);
    }
  }

  const friendships = data.friendships ?? [];
  console.log(`🤝 Seeding ${friendships.length} friendships...`);

  for (const friendship of friendships) {
    const requesterId = userIdByUsername.get(friendship.requester.toLowerCase());
    const addresseeId = userIdByUsername.get(friendship.addressee.toLowerCase());

    if (!requesterId || !addresseeId) {
      throw new Error(
        `Unknown user in friendship fixture: ${friendship.requester} -> ${friendship.addressee}`
      );
    }

    await prisma.friendship.upsert({
      where: { requesterId_addresseeId: { requesterId, addresseeId } },
      update: { status: friendship.status },
      create: { requesterId, addresseeId, status: friendship.status },
    });
  }

  console.log("✅ Friendships successfully seeded.");
}
