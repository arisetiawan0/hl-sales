import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL + '&connection_limit=15&pool_timeout=60&connect_timeout=15',
      },
    },
  })
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: unknown) {
      const isConnectionError =
        error instanceof Error &&
        (error.message.includes("Can't reach database") ||
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('ETIMEOUT') ||
          error.message.includes('Connection lost') ||
          error.message.includes('Timed out fetching a new connection'))

      if (isConnectionError && attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay * attempt))
        continue
      }
      throw error
    }
  }
  throw new Error('Max retries exceeded')
}
