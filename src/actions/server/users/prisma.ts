import "server-only";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function resolveDatabaseUrl() {
  return process.env.DATABASE_URL ?? process.env.TURSO_DATABASE_URL ?? "file:./dev.db";
}

function createPrismaClient() {
  const databaseUrl = resolveDatabaseUrl();

  if (process.env.NODE_ENV === "production" && databaseUrl.startsWith("file:")) {
    throw new Error(
      "Prisma runtime is using a local SQLite file URL in production. Set DATABASE_URL to a remote LibSQL/Turso URL and DATABASE_AUTH_TOKEN in Vercel."
    );
  }

  if (process.env.TURSO_DATABASE_URL?.startsWith("file:")) {
    return new PrismaClient({
      adapter: new PrismaLibSql({
        url: process.env.TURSO_DATABASE_URL,
      }),
    });
  }

  const [baseUrl, queryString = ""] = databaseUrl.split("?");
  const authTokenFromUrl = new URLSearchParams(queryString).get("authToken") ?? undefined;
  const authToken = process.env.DATABASE_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN ?? authTokenFromUrl;
  const adapter = new PrismaLibSql({
    url: baseUrl,
    authToken,
  });

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
