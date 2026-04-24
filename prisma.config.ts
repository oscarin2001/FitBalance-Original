import "dotenv/config";
import { defineConfig } from "prisma/config";

function resolveDatabaseUrl() {
  return process.env.DATABASE_URL ?? process.env.TURSO_DATABASE_URL ?? "file:./dev.db";
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: resolveDatabaseUrl(),
  },
});
