// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Use hardcoded URL to ensure connection to Neon
const NEON_DATABASE_URL = "postgresql://neondb_owner:npg_LDrOg5Yjl3RJ@ep-proud-feather-a5cnqhw4-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require";

export const prisma =
  globalForPrisma.prisma || 
  new PrismaClient({
    datasources: {
      db: {
        url: NEON_DATABASE_URL,
      }
    }
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;