import fs from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'

// Fall back to the local SQLite file that Docker Compose also expects.
const defaultDatabaseUrl = 'file:./data/dev.db'
const databaseUrl = process.env.DATABASE_URL ?? defaultDatabaseUrl

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = databaseUrl
}

const sqliteMatch = databaseUrl.match(/^file:(.+)$/)
if (sqliteMatch) {
  const filePath = sqliteMatch[1]
  const sanitizedPath = filePath.split('?')[0]
  const directory = path.dirname(path.resolve(process.cwd(), sanitizedPath))
  // Ensure the parent directory exists before SQLite tries to create the file.
  fs.mkdirSync(directory, { recursive: true })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
