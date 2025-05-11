import { PrismaClient } from '../generated/prisma';

// Avoid multiple instances during development
const globalForPrisma = global as unknown as { 
  prisma: PrismaClient | undefined 
};

// Create a singleton Prisma Client
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
};

// Use existing instance or create a new one
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

// Set global reference in non-production environments
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
