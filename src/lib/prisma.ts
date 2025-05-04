// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// Use a shared PrismaClient instance to avoid too many connections in development
// See: https://www.prisma.io/docs/guides/performance-and-optimization/connection-management

// Add prisma to the global type
declare global {
  var prisma: PrismaClient | undefined;
}

// Ensure the DATABASE_URL is available for Vercel deployment
const databaseUrl = process.env.DATABASE_URL || 
  "postgresql://neondb_owner:npg_LDrOg5Yjl3RJ@ep-proud-feather-a5cnqhw4-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require";

export const prisma =
  global.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}