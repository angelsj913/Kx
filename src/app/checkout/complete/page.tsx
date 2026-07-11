import Link from "next/link";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata = { title: "결제 완료 · ZEFF AI" };

export default function CheckoutCompletePage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-200/80 px-6 py-3.5 dark:border-slate-800/80">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo-zeff.png" alt="ZEFF AI" width={24} height={24} className="rounded-md" />
          <span className="text-sm font-bold tracking-tight">ZEFF AI</span>
        </Link>
        <ThemeToggle />
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900">
          <CheckCircle2 className="mx-auto h-12 w-12 text-blue-600 dark:text-blue-400" />
          <h1 className="mt-4 text-xl font-bold">결제가 완료되었습니다</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            요금제가 적용되었습니다. 이제 워크스페이스에서 모든 기능을 이용하실 수 있어요.
          </p>
          <Link
            href="/app"
            className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-colors hover:bg-blue-500"
          >
            워크스페이스로 이동
          </Link>
        </div>
      </div>
    </div>
  );
}
