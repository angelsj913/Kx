"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Users, Loader2, Check } from "lucide-react";

interface InvitePreview {
  email: string;
  role: string;
  workspaceName: string;
  invitedBy: string;
}

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";
  const router = useRouter();

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`/api/workspaces/invites/${token}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error ?? "유효하지 않은 초대입니다.");
          return;
        }
        setPreview(data.invite);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  async function accept() {
    setAccepting(true);
    setError("");
    try {
      const res = await fetch(`/api/workspaces/invites/${token}`, { method: "POST" });
      if (res.status === 401) {
        // 로그인 후 이 페이지로 되돌아오게 한다.
        router.push(`/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "초대 수락에 실패했습니다.");
        return;
      }
      // 수락한 워크스페이스를 활성 상태로 설정한 뒤 앱으로 이동.
      if (data.workspaceId) {
        window.localStorage.setItem("kx.activeWorkspace", data.workspaceId);
        window.localStorage.setItem("__kx.activeWorkspace.current", data.workspaceId);
      }
      router.push("/app");
    } finally {
      setAccepting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-6 text-slate-900 transition-colors duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] dark:bg-slate-950 dark:text-slate-100">
      <div className="pointer-events-none absolute -top-48 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[140px]" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-2xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
          <Users className="h-7 w-7" />
        </span>

        {loading ? (
          <div className="flex items-center justify-center py-6 text-slate-400 dark:text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : error ? (
          <>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">초대를 열 수 없어요</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{error}</p>
            <button
              type="button"
              onClick={() => router.push("/app")}
              className="mt-6 rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              앱으로 이동
            </button>
          </>
        ) : preview ? (
          <>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              <span className="text-blue-600 dark:text-blue-300">{preview.workspaceName}</span> 워크스페이스
              초대
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {preview.invitedBy}님이 회원님을 {roleLabel(preview.role)}(으)로 초대했어요.
              <br />
              수락하면 팀의 공유 대화와 서재를 함께 사용할 수 있어요.
            </p>
            <button
              type="button"
              onClick={accept}
              disabled={accepting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 disabled:opacity-60"
            >
              {accepting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              초대 수락하기
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function roleLabel(role: string): string {
  return role === "admin" ? "관리자" : "멤버";
}
