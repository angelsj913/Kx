import { prisma } from "@/lib/prisma";
import InquiryReply from "@/components/admin/InquiryReply";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  등록: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  처리중: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  답변완료: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
};

export default async function AdminInquiriesPage() {
  const inquiries = await prisma.inquiry.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-xl font-bold">1:1 문의</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        접수된 문의를 확인하고 답변하면 문의자 이메일로 발송됩니다.
      </p>

      <div className="mt-6 space-y-3">
        {inquiries.length === 0 ? (
          <p className="rounded-xl border border-slate-200 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
            아직 접수된 문의가 없습니다.
          </p>
        ) : (
          inquiries.map((q) => (
            <div key={q.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[q.status] ?? STATUS_STYLE["등록"]}`}>
                      {q.status}
                    </span>
                    <span className="rounded-full bg-blue-600/10 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:text-blue-300">
                      {q.type}
                    </span>
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{q.subject}</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {q.email} · {new Date(q.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <p className="mt-3 whitespace-pre-line rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:bg-slate-950 dark:text-slate-200">
                {q.body}
              </p>

              {q.fileUrl && (
                <a
                  href={q.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-xs text-blue-600 hover:underline dark:text-blue-400"
                >
                  첨부파일: {q.fileName || "다운로드"}
                </a>
              )}

              <InquiryReply id={q.id} initialReply={q.reply ?? ""} initialStatus={q.status} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
