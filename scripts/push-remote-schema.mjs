import "dotenv/config";
import { createClient } from "@libsql/client";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

function getRemoteDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to sync the remote Turso database.");
  }

  if (databaseUrl.startsWith("file:")) {
    throw new Error("DATABASE_URL must point to the remote Turso/libsql database, not a local file URL.");
  }

  return databaseUrl;
}

function getAuthToken(databaseUrl) {
  const tokenFromUrl = new URL(databaseUrl).searchParams.get("authToken") ?? undefined;
  return process.env.DATABASE_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN ?? tokenFromUrl;
}

function generateSchemaSql() {
  const schemaPath = resolve("prisma/schema.prisma");
  return execSync(`npx prisma migrate diff --from-empty --to-schema "${schemaPath}" --script`, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
}

async function main() {
  const databaseUrl = getRemoteDatabaseUrl();
  const authToken = getAuthToken(databaseUrl);
  const sql = generateSchemaSql().trim();

  if (!sql) {
    console.log("No SQL was generated from the Prisma schema.");
    return;
  }

  const client = createClient({
    url: databaseUrl,
    authToken,
  });

  await client.executeMultiple(sql);
  console.log("Remote schema synced to Turso.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});