#!/usr/bin/env node
/**
 * Build a Supabase DATABASE_URL with a URL-encoded password.
 *
 * Usage:
 *   node scripts/encode-supabase-url.mjs "my pass@word#1" ghxqylmopbtazxwyimyg
 *   node scripts/encode-supabase-url.mjs   # prompts for password
 */
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const DEFAULT_REF = "ghxqylmopbtazxwyimyg";
const DEFAULT_REGION = process.env.SUPABASE_REGION?.trim() || "ap-southeast-2";

async function readPasswordFromPrompt() {
  const rl = createInterface({ input, output });
  try {
    return await rl.question("Supabase database password: ");
  } finally {
    rl.close();
  }
}

async function main() {
  const password = process.argv[2] ?? (await readPasswordFromPrompt());
  const ref = process.argv[3]?.trim() || DEFAULT_REF;
  const encoded = encodeURIComponent(password);

  const direct = `postgresql://postgres:${encoded}@db.${ref}.supabase.co:5432/postgres`;
  const sessionPooler = `postgresql://postgres.${ref}:${encoded}@aws-0-${DEFAULT_REGION}.pooler.supabase.com:5432/postgres?sslmode=require`;

  console.log("\nEncoded password:", encoded);
  console.log("\nDirect (recommended for Vercel DATABASE_URL — build rewrites to pooler):");
  console.log(direct);
  console.log("\nSession pooler (alternative):");
  console.log(sessionPooler);
  console.log("\nPaste one of the above into Vercel → Settings → Environment Variables → DATABASE_URL");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
