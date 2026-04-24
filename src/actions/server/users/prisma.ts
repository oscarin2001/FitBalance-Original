import "server-only";

import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function resolveDatabaseUrl() {
  // 🔥 PRODUCCIÓN: SOLO DATABASE_URL (obligatorio)
  if (process.env.NODE_ENV === "production") {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "❌ DATABASE_URL no está definida en producción (Vercel Environment Variables)"
      );
    }
    return process.env.DATABASE_URL;
  }

  // 🧪 LOCAL: usa SQLite
  return process.env.TURSO_DATABASE_URL ?? "file:./dev.db";
}

function createPrismaClient() {
  const databaseUrl = resolveDatabaseUrl();

  // 🚨 Protección extra: nunca permitir SQLite en producción
  if (
    process.env.NODE_ENV === "production" &&
    databaseUrl.startsWith("file:")
  ) {
    throw new Error(
      "❌ Prisma está usando SQLite en producción. Configura DATABASE_URL correctamente."
    );
  }

  // 🧪 LOCAL (SQLite)
  if (databaseUrl.startsWith("file:")) {
    return new PrismaClient({
      adapter: new PrismaLibSql({
        url: databaseUrl,
      }),
    });
  }

  // 🌍 PRODUCCIÓN (Turso / LibSQL)
  const authToken =
    process.env.DATABASE_AUTH_TOKEN ??
    process.env.TURSO_AUTH_TOKEN ??
    undefined;

  if (process.env.NODE_ENV === "production" && !authToken) {
    throw new Error(
      "❌ DATABASE_AUTH_TOKEN no está definido en producción"
    );
  }

  const adapter = new PrismaLibSql({
    url: databaseUrl,
    authToken,
  });

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}