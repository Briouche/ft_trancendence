//
//  seed.ts
//  
//
//  Created by François on 11/06/2026.
//

import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  await prisma.user.create({
	data: {
	  email: 'test@test.com',
	  name: 'test',
	  password: 'test',
	},
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
