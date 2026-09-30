import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import { seedCards } from './seeds/cards.seed'
import { seedUsers } from './seeds/users.seed'
import { seedDecks } from './seeds/decks.seed'

// `prisma db seed` (run at every container start): the card catalogue always, and the test
// accounts with their decks outside production only.

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
	console.log('🌱 Starting global database seed...')

	await seedCards(prisma)

	// start:prod runs this seed too: the test accounts have public, trivial passwords
	// (seeds/data/users-collection.json), so they and their decks must never exist on a
	// deployed instance.
	if (process.env.NODE_ENV === 'production') {
		console.log('⏭️  Skipping test users and decks in production')
	} else {
		await seedUsers(prisma)
		// Needs both cards and users to exist
		await seedDecks(prisma)
	}

	console.log('🏁 Database seeding completed successfully!')
}

main()
.then(async () => {
	await prisma.$disconnect();
	await pool.end();
})
.catch(async (e) => {
	console.error(e);
	await prisma.$disconnect();
	await pool.end();
	process.exit(1);
});
