"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { X } from "lucide-react";

/** /?admin=denied 로 돌아왔을 때 안내 (예전 silent redirect 대비) */
export default function AdminDeniedBanner() {
  const search = useSearchParams();
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (search.get("admin") === "denied") setShow(true);
  }, [search]);

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 top-16 z-[60] flex justify-center px-4">
      <div className="flex max-w-lg items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-lg dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
        <p className="flex-1 leading-relaxed">
          관리자 패널에 들어갈 수 없습니다.{" "}
          <strong>zeff@zeffai.com</strong> 으로 로그인했는지 확인한 뒤, 주소창에{" "}
          <code className="rounded bg-black/5 px-1 dark:bg-white/10">/admin</code> 을
          직접 입력해 보세요.
        </p>
        <button
          type="button"
          aria-label="닫기"
          onClick={() => {
            setShow(false);
            router.replace("/", { scroll: false });
          }}
          className="shrink-0 rounded p-0.5 hover:bg-black/5 dark:hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
