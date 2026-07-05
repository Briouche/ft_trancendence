import { PrismaClient } from '@prisma/client'

const SEED_USERS = [
	{
		email: 'alex.vanguard@shadowrealm.com',
		name: 'Alex Vanguard',
		password: 'test1',
	},
	{
		email: 'elena.spellweaver@mythos.gg',
		name: 'Elena Spellweaver',
		password: 'test2',
	},
	{
		email: 'kai.cyberblade@neoncity.io',
		name: 'Kai Cyberblade',
		password: 'test3',
	},
]

export async function seedUsers(prisma: PrismaClient) {
	console.log('👥 Seeding 3 random test users...')

	for (const user of SEED_USERS) {
		await prisma.user.upsert({
			where: { email: user.email },
			update: {
				name: user.name,
				password: user.password,
			},
			create: { ...user, unopenedPacks: 5 },
		})
	}

	console.log('✅ Users successfully seeded.')
}
