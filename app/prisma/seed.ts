import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import { seedCards } from './seeds/cards.seed'
import { seedUsers } from './seeds/users.seed'

// 1. Set up the native pg Pool pointing to your database URL
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 2. Initialize the Prisma PostgreSQL adapter
const adapter = new PrismaPg(pool);

// 3. Pass the adapter options into the Prisma Client constructor
const prisma = new PrismaClient({ adapter });

async function main() {
	console.log('🌱 Starting global database seed...')
	
	// Run sub-seeds in order
	await seedCards(prisma)
	await seedUsers(prisma)

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
