import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** Google OAuth users must set a password before using /app. */
export async function requirePasswordComplete(
  existingSession?: Session | null,
) {
  const session = existingSession === undefined ? await auth() : existingSession;
  if (!session?.user?.id) return;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  if (user && !user.passwordHash) {
    redirect("/signup?from=google");
  }
}
