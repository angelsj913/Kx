import { signIn } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return signIn("google", { redirectTo: "/app?settings=security" });
}
