import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "prisma/config";
import { resolveMigrateDatabaseUrl } from "./src/lib/databaseUrl";

const root = process.cwd();
const envPath = resolve(root, ".env");
const envLocalPath = resolve(root, ".env.local");
if (existsSync(envPath)) config({ path: envPath });
if (existsSync(envLocalPath)) config({ path: envLocalPath, override: true });

const migrateUrl = resolveMigrateDatabaseUrl(process.env.DATABASE_URL);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: migrateUrl,
  },
});
