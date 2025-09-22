// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var __PRISMA__: PrismaClient | undefined
}

// Verbose logs in dev, quieter in prod. We avoid using Prisma.LogLevel directly
// (some versions don’t export it) and instead rely on the options type.
type LogEntry = 'query' | 'info' | 'warn' | 'error'
const log: LogEntry[] =
  process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['warn', 'error']

function createClient() {
  return new PrismaClient({ log })
}

// Reuse the client across HMR reloads in development
export const prisma = globalThis.__PRISMA__ ?? createClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__PRISMA__ = prisma
}

export default prisma