import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/requireAdmin";
import { SecurityPageShell } from "@/components/admin/SecurityPageShell";

export const dynamic = "force-dynamic";

export default async function SecurityAiLearningPage() {
  await requireAdminPage();
  const [memories, qaPairs, chunks] = await Promise.all([
    prisma.userMemory.findMany({
      orderBy: { updatedAt: "desc" },
      take: 30,
      include: { user: { select: { email: true } } },
    }),
    prisma.learnedQaPair.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { user: { select: { email: true } } },
    }),
    prisma.documentChunk.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, idx: true, content: true, libraryItemId: true, userId: true },
    }),
  ]);

  return (
    <SecurityPageShell title="학습 데이터" description="Memory · Q&A · RAG chunks (관리자 열람)">
      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold">UserMemory ({memories.length})</h2>
        <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-xs">
          {memories.map((m) => (
            <li key={m.id} className="rounded-lg bg-slate-50 p-2 dark:bg-slate-950">
              <p className="text-[10px] text-slate-500">{m.user.email} · {m.category}</p>
              <p className="mt-1 line-clamp-2">{m.content}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold">LearnedQaPair ({qaPairs.length})</h2>
        <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-xs">
          {qaPairs.map((q) => (
            <li key={q.id} className="rounded-lg bg-slate-50 p-2 dark:bg-slate-950">
              <p className="text-[10px] text-slate-500">{q.user.email} · {q.source}</p>
              <p className="mt-1 font-medium line-clamp-1">{q.question}</p>
              <p className="line-clamp-2 text-slate-600 dark:text-slate-400">{q.answer}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold">DocumentChunk ({chunks.length})</h2>
        <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-xs">
          {chunks.map((c) => (
            <li key={c.id} className="rounded-lg bg-slate-50 p-2 dark:bg-slate-950">
              <p className="text-[10px] text-slate-500">#{c.idx} · lib {c.libraryItemId.slice(0, 8)}</p>
              <p className="line-clamp-2">{c.content}</p>
            </li>
          ))}
        </ul>
      </section>
    </SecurityPageShell>
  );
}
