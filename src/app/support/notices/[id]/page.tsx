import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import BackButton from "@/components/ui/BackButton";
import ThemeToggle from "@/components/ThemeToggle";
import { NOTICES, getNotice } from "@/lib/notices";

export function generateStaticParams() {
  return NOTICES.map((n) => ({ id: n.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const notice = getNotice(id);
  return { title: notice ? `${notice.title} · ZEFF AI` : "공지 · ZEFF AI" };
}

export default async function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const notice = getNotice(id);
  if (!notice) notFound();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-slate-50/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3.5">
          <BackButton fallbackHref="/support/notices" />
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo-zeff.png" alt="ZEFF AI" width={24} height={24} className="rounded-md" />
            <span className="text-sm font-bold tracking-tight">ZEFF AI</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 py-10">
        {/* 최상단: 주제(타이틀)를 가장 크고 명확하게 */}
        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{notice.period}</p>
        <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{notice.title}</h1>

        {/* 하단: 상세 패치 내용 */}
        <div className="mt-8 space-y-5 border-t border-slate-200 pt-8 dark:border-slate-800">
          {notice.body.map((para, i) => (
            <p key={i} className="text-base leading-relaxed text-slate-700 dark:text-slate-300">
              {para}
            </p>
          ))}
        </div>
      </article>
    </div>
  );
}
