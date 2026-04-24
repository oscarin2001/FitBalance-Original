import "dotenv/config";
import { defineConfig } from "prisma/config";

function resolveDatabaseUrl() {
  const localDatabaseUrl = process.env.TURSO_DATABASE_URL;
  if (localDatabaseUrl?.startsWith("file:")) {
    return localDatabaseUrl;
  }

  const primaryDatabaseUrl = process.env.DATABASE_URL;
  if (primaryDatabaseUrl?.startsWith("file:")) {
    return primaryDatabaseUrl;
  }

  return "file:./dev.db";
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: resolveDatabaseUrl(),
  },
});