import { PrismaClient } from '@prisma/client'

const db = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL } },
})

beforeAll(async () => {
  await db.$connect()
})

afterAll(async () => {
  await db.$disconnect()
})

export { db }
