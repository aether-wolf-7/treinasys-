import { PrismaClient } from '@prisma/client'
import { env } from '../config/env'
import { logger } from './logger'

export const prisma = new PrismaClient({
  log:
    env.NODE_ENV === 'development'
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'stdout', level: 'warn' },
          { emit: 'stdout', level: 'error' },
        ]
      : [
          { emit: 'stdout', level: 'warn' },
          { emit: 'stdout', level: 'error' },
        ],
})

if (env.NODE_ENV === 'development') {
  prisma.$on('query', (e: { query: string; duration: number }) => {
    logger.debug({ duration: e.duration }, e.query)
  })
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect()
}
