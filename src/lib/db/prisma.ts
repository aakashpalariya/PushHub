import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { ensureDatabaseReady } from "./init";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const tursoUrl =
    process.env.TURSO_DATABASE_URL ||
    (process.env.DATABASE_URL?.startsWith("libsql://")
      ? process.env.DATABASE_URL
      : undefined);

  if (!tursoUrl) {
    throw new Error(
      "[PushHub] No Turso database URL configured. " +
      "Set TURSO_DATABASE_URL (or DATABASE_URL=libsql://...) in your .env file."
    );
  }

  const adapter = new PrismaLibSql({
    url: tursoUrl,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function initDb(): Promise<void> {
  return ensureDatabaseReady(prisma);
}

export { ensureDatabaseReady };
