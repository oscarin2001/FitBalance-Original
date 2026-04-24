import "server-only";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const localDatabaseUrl = process.env.TURSO_DATABASE_URL;
  if (localDatabaseUrl?.startsWith("file:")) {
    return new PrismaClient({
      adapter: new PrismaLibSql({
        url: localDatabaseUrl,
      }),
    });
  }

  const rawDatabaseUrl = process.env.DATABASE_URL ?? process.env.TURSO_DATABASE_URL ?? "file:./dev.db";
  const [databaseUrl, queryString = ""] = rawDatabaseUrl.split("?");
  const authTokenFromUrl = new URLSearchParams(queryString).get("authToken") ?? undefined;
  const authToken = process.env.DATABASE_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN ?? authTokenFromUrl;
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
