import { handlers } from "@/auth";

// Prisma + bcrypt require Node.js — without this, credentials/OAuth callbacks fail
// with Auth.js "Configuration" (Edge cannot run @prisma/adapter-pg).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const { GET, POST } = handlers;
