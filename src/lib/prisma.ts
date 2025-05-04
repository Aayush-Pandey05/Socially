// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// Prevent multiple instances during development
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Hardcode the URL directly in the file as a fallback
const dbUrl = "postgresql://neondb_owner:npg_LDrOg5Yjl3RJ@ep-proud-feather-a5cnqhw4-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require";

// Create a new Prisma Client instance
export const prisma = 
  globalForPrisma.prisma || 
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

// Check if we're in development mode
// Use simple string comparison instead of process.env
if (typeof window === "undefined" && !globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}