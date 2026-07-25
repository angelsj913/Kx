import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireAdminApi();
  if (gate instanceof Response) return gate;

  const encoder = new TextEncoder();
  let lastLoginId: string | null = null;
  let lastAuditId: string | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const poll = async () => {
        try {
          const [logins, audits] = await Promise.all([
            prisma.loginEvent.findMany({
              orderBy: { createdAt: "desc" },
              take: 5,
              include: { user: { select: { email: true } } },
            }),
            prisma.adminAuditLog.findMany({
              orderBy: { createdAt: "desc" },
              take: 5,
            }),
          ]);

          const events = [
            ...logins.map((l) => ({
              type: "login" as const,
              at: l.createdAt.toISOString(),
              summary: `${l.user.email ?? l.userId} · ${l.provider ?? "?"}`,
              id: l.id,
            })),
            ...audits.map((a) => ({
              type: "audit" as const,
              at: a.createdAt.toISOString(),
              summary: `${a.action} · ${a.adminEmail ?? a.adminId ?? "?"}`,
              id: a.id,
            })),
          ].sort((a, b) => (a.at < b.at ? 1 : -1));

          if (events.length > 0) {
            const newestLogin = logins[0]?.id ?? null;
            const newestAudit = audits[0]?.id ?? null;
            if (newestLogin !== lastLoginId || newestAudit !== lastAuditId) {
              lastLoginId = newestLogin;
              lastAuditId = newestAudit;
              send(events.slice(0, 10));
            }
          }
        } catch {
          /* ignore poll errors */
        }
      };

      await poll();
      const interval = setInterval(poll, 5000);

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, 15000);

      const cleanup = () => {
        clearInterval(interval);
        clearInterval(heartbeat);
      };

      (controller as unknown as { _cleanup?: () => void })._cleanup = cleanup;
    },
    cancel() {
      const c = this as unknown as { _cleanup?: () => void };
      c._cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
