import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import { seedCards } from './seeds/cards.seed'
import { seedUsers } from './seeds/users.seed'

// Seeds cards then dev users (run by `prisma db seed`).

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
	console.log('🌱 Starting global database seed...')

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
