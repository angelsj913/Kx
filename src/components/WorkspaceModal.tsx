"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { X, Users, Trash2, Mail, Copy, Check, LogOut, Loader2 } from "lucide-react";
import { useWorkspace } from "@/lib/workspaceClient";

interface Member {
  userId: string;
  role: string;
  name: string | null;
  email: string | null;
  image: string | null;
}
interface PendingInvite {
  id: string;
  email: string;
  role: string;
  token: string;
}
interface Detail {
  id: string;
  name: string;
  imageUrl?: string | null;
  inviteCode?: string | null;
  ownerId: string;
  myRole: "owner" | "admin" | "member";
  sessionCount: number;
  libraryCount: number;
  members: Member[];
}

export default function WorkspaceModal({
  workspaceId,
  onClose,
  onChanged,
}: {
  workspaceId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { setActiveId, activeId } = useWorkspace();
  const { data: sessionData } = useSession();
  const myId = sessionData?.user?.id ?? "";
  const [detail, setDetail] = useState<Detail | null>(null);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "admin">("member");
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [editName, setEditName] = useState("");
  const [editImage, setEditImage] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState("");
  const [tab, setTab] = useState<"members" | "settings" | "danger">("members");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "불러오지 못했습니다.");
        return;
      }
      setDetail(data.workspace);
      setEditName(data.workspace.name ?? "");
      setEditImage(data.workspace.imageUrl ?? "");
      if (data.workspace.myRole !== "member") {
        const ir = await fetch(`/api/workspaces/${workspaceId}/invites`);
        const idata = await ir.json();
        if (ir.ok) setInvites(idata.invites ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const canManage = detail && detail.myRole !== "member";

  async function sendInvite() {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || inviting) return;
    setInviting(true);
    setError("");
    setInviteLink("");
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invites`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "초대에 실패했습니다.");
        return;
      }
      setInviteLink(data.invite.inviteUrl);
      setInviteEmail("");
      load();
    } finally {
      setInviting(false);
    }
  }

  async function removeMember(userId: string) {
    if (!confirm("이 멤버를 워크스페이스에서 제거할까요?")) return;
    const res = await fetch(`/api/workspaces/${workspaceId}/members/${userId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      load();
      onChanged();
    } else {
      const data = await res.json();
      setError(data?.error ?? "제거에 실패했습니다.");
    }
  }

  async function leaveWorkspace() {
    if (!detail || !myId) return;
    if (!confirm("이 워크스페이스에서 나갈까요?")) return;
    const res = await fetch(`/api/workspaces/${workspaceId}/members/${myId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      if (activeId === workspaceId) setActiveId(null);
      onChanged();
      onClose();
    } else {
      const data = await res.json();
      setError(data?.error ?? "나가기에 실패했습니다.");
    }
  }

  async function saveSettings() {
    setError("");
    const res = await fetch(`/api/workspaces/${workspaceId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: editName,
        imageUrl: editImage || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error ?? "저장 실패");
      return;
    }
    load();
    onChanged();
  }

  async function regenerateCode() {
    const res = await fetch(`/api/workspaces/${workspaceId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ regenerateInviteCode: true }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error ?? "코드 재발급 실패");
      return;
    }
    load();
  }

  async function transferTo(userId: string) {
    if (!confirm("대표 권한을 이 멤버에게 양도할까요? 본인은 일반 멤버가 됩니다.")) return;
    const res = await fetch(`/api/workspaces/${workspaceId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ transferToUserId: userId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error ?? "양도 실패");
      return;
    }
    load();
    onChanged();
  }

  async function deleteWorkspace() {
    setError("");
    const res = await fetch(`/api/workspaces/${workspaceId}`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(otpSent ? { otp } : {}),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error ?? "삭제에 실패했습니다.");
      return;
    }
    if (data.otpSent) {
      setOtpSent(true);
      setDevOtp(data.devCode ?? "");
      return;
    }
    if (data.deleted) {
      if (activeId === workspaceId) setActiveId(null);
      onChanged();
      onClose();
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 클립보드 미지원 시 무시 */
    }
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700/70 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">
                {detail?.name ?? "워크스페이스"}
              </h2>
              {detail && (
                <p className="text-xs text-slate-500">
                  공유 대화 {detail.sessionCount} · 공유 서재 {detail.libraryCount}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <p className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-10 text-slate-400 dark:text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : detail ? (
          <>
            <div className="mt-4 flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              {(
                [
                  ["members", "멤버"],
                  ["settings", "설정"],
                  ...(detail.myRole === "owner" ? [["danger", "삭제"] as const] : []),
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id as typeof tab)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                    tab === id
                      ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-50"
                      : "text-slate-500"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === "settings" && (detail.myRole === "owner" || detail.myRole === "admin") && (
              <section className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-500">이름</label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">이미지 URL</label>
                  <input
                    value={editImage}
                    onChange={(e) => setEditImage(e.target.value)}
                    placeholder="https://..."
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                {detail.inviteCode && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 dark:border-blue-500/30 dark:bg-blue-950/30">
                    <p className="text-xs font-medium text-slate-500">초대 코드</p>
                    <p className="mt-1 font-mono text-lg font-bold tracking-widest text-blue-700 dark:text-blue-300">
                      {detail.inviteCode}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(detail.inviteCode!)}
                        className="rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white"
                      >
                        복사
                      </button>
                      {detail.myRole === "owner" && (
                        <button
                          type="button"
                          onClick={() => void regenerateCode()}
                          className="rounded-lg border border-slate-300 px-2.5 py-1 text-[11px] dark:border-slate-600"
                        >
                          재발급
                        </button>
                      )}
                    </div>
                  </div>
                )}
                <p className="text-xs text-slate-500">
                  채팅 기록 {detail.sessionCount} · 서재 파일 {detail.libraryCount}
                </p>
                <button
                  type="button"
                  onClick={() => void saveSettings()}
                  className="w-full rounded-xl bg-blue-600 py-2 text-sm font-semibold text-white"
                >
                  설정 저장
                </button>
              </section>
            )}

            {tab === "danger" && detail.myRole === "owner" && (
              <section className="mt-4 space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  대표자 이메일 OTP 인증 후 워크스페이스를 삭제합니다.
                </p>
                {otpSent && (
                  <div>
                    <label className="text-xs text-slate-500">이메일 인증번호</label>
                    <input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="6자리"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                    />
                    {devOtp && (
                      <p className="mt-1 text-[11px] text-amber-600">개발용 코드: {devOtp}</p>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => void deleteWorkspace()}
                  className="w-full rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white"
                >
                  {otpSent ? "인증 후 삭제" : "삭제 OTP 발송"}
                </button>
              </section>
            )}

            {tab === "members" && (
              <>
                <section className="mt-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    멤버 {detail.members.length}명
                  </h3>
                  <ul className="space-y-1">
                    {detail.members.map((m) => (
                      <li
                        key={m.userId}
                        className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800/70 dark:bg-slate-800/30"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[11px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                          {(m.name ?? m.email ?? "?").slice(0, 1).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-slate-800 dark:text-slate-100">
                            {m.name ?? m.email}
                          </span>
                          <span className="block truncate text-xs text-slate-500">{m.email}</span>
                        </span>
                        <span className="shrink-0 rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">
                          {roleLabel(m.role)}
                        </span>
                        {detail.myRole === "owner" && m.role !== "owner" && (
                          <button
                            type="button"
                            onClick={() => void transferTo(m.userId)}
                            className="shrink-0 rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500 hover:border-blue-400 hover:text-blue-600 dark:border-slate-600"
                          >
                            대표 양도
                          </button>
                        )}
                        {detail.myRole === "owner" && m.role !== "owner" && m.userId !== myId && (
                          <button
                            type="button"
                            onClick={() => removeMember(m.userId)}
                            aria-label="멤버 제거"
                            className="shrink-0 rounded-lg p-1 text-slate-400 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>

                {canManage && (
                  <section className="mt-4">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      멤버 초대 (이메일)
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-white px-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                        <Mail className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
                        <input
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && sendInvite()}
                          placeholder="초대할 이메일"
                          className="min-w-0 flex-1 bg-transparent py-2 text-sm text-slate-900 outline-none dark:text-slate-100"
                        />
                      </div>
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as "member" | "admin")}
                        className="shrink-0 rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200"
                      >
                        <option value="member">멤버</option>
                        <option value="admin">관리자</option>
                      </select>
                      <button
                        type="button"
                        onClick={sendInvite}
                        disabled={inviting || !inviteEmail.trim()}
                        className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        초대
                      </button>
                    </div>

                    {inviteLink && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 dark:border-blue-500/30 dark:bg-blue-950/30">
                        <span className="min-w-0 flex-1 truncate text-xs text-blue-700 dark:text-blue-200">
                          {inviteLink}
                        </span>
                        <button
                          type="button"
                          onClick={copyLink}
                          className="flex shrink-0 items-center gap-1 rounded-md bg-blue-600/15 px-2 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-600/25 dark:bg-blue-600/40 dark:text-blue-100 dark:hover:bg-blue-600/60"
                        >
                          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          {copied ? "복사됨" : "링크 복사"}
                        </button>
                      </div>
                    )}

                    {invites.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {invites.map((inv) => (
                          <li
                            key={inv.id}
                            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-500 dark:text-slate-400"
                          >
                            <Mail className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600" />
                            <span className="min-w-0 flex-1 truncate">{inv.email}</span>
                            <span className="shrink-0 text-slate-400 dark:text-slate-600">
                              대기 중 · {roleLabel(inv.role)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                )}

                {detail.myRole !== "owner" && (
                  <section className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800/70">
                    <button
                      type="button"
                      onClick={leaveWorkspace}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <LogOut className="h-4 w-4" />
                      워크스페이스 나가기
                    </button>
                  </section>
                )}
              </>
            )}
          </>
        ) : null}
      </motion.div>
    </div>,
    document.body,
  );
}

function roleLabel(role: string): string {
  return role === "owner" ? "소유자" : role === "admin" ? "관리자" : "멤버";
}
