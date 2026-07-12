"use client";

import { useCallback, useEffect, useState } from "react";
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

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "불러오지 못했습니다.");
        return;
      }
      setDetail(data.workspace);
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

  async function deleteWorkspace() {
    if (!confirm("워크스페이스를 삭제하면 공유 세팅이 해제됩니다. 계속할까요?")) return;
    const res = await fetch(`/api/workspaces/${workspaceId}`, { method: "DELETE" });
    if (res.ok) {
      if (activeId === workspaceId) setActiveId(null);
      onChanged();
      onClose();
    } else {
      const data = await res.json();
      setError(data?.error ?? "삭제에 실패했습니다.");
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15 }}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700/70 bg-slate-900 p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/20 text-violet-300">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-50">
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
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <p className="mt-3 rounded-lg border border-red-500/30 bg-red-950/40 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-10 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : detail ? (
          <>
            {/* 멤버 목록 */}
            <section className="mt-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                멤버 {detail.members.length}명
              </h3>
              <ul className="space-y-1">
                {detail.members.map((m) => (
                  <li
                    key={m.userId}
                    className="flex items-center gap-2.5 rounded-xl border border-slate-800/70 bg-slate-800/30 px-3 py-2"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[11px] font-semibold text-slate-200">
                      {(m.name ?? m.email ?? "?").slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-slate-100">
                        {m.name ?? m.email}
                      </span>
                      <span className="block truncate text-xs text-slate-500">{m.email}</span>
                    </span>
                    <span className="shrink-0 rounded-md bg-slate-700/60 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                      {roleLabel(m.role)}
                    </span>
                    {canManage && m.role !== "owner" && m.userId !== myId && (
                      <button
                        type="button"
                        onClick={() => removeMember(m.userId)}
                        aria-label="멤버 제거"
                        className="shrink-0 rounded-lg p-1 text-slate-600 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            {/* 초대 */}
            {canManage && (
              <section className="mt-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  멤버 초대
                </h3>
                <div className="flex items-center gap-1.5">
                  <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5">
                    <Mail className="h-4 w-4 shrink-0 text-slate-500" />
                    <input
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendInvite()}
                      placeholder="초대할 이메일"
                      className="min-w-0 flex-1 bg-transparent py-2 text-sm text-slate-100 outline-none"
                    />
                  </div>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as "member" | "admin")}
                    className="shrink-0 rounded-lg border border-slate-700 bg-slate-800/80 px-2 py-2 text-xs text-slate-200 outline-none"
                  >
                    <option value="member">멤버</option>
                    <option value="admin">관리자</option>
                  </select>
                  <button
                    type="button"
                    onClick={sendInvite}
                    disabled={inviting || !inviteEmail.trim()}
                    className="shrink-0 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    초대
                  </button>
                </div>

                {inviteLink && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-violet-500/30 bg-violet-950/30 px-3 py-2">
                    <span className="min-w-0 flex-1 truncate text-xs text-violet-200">
                      {inviteLink}
                    </span>
                    <button
                      type="button"
                      onClick={copyLink}
                      className="flex shrink-0 items-center gap-1 rounded-md bg-violet-600/40 px-2 py-1 text-[11px] font-medium text-violet-100 hover:bg-violet-600/60"
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
                        className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-400"
                      >
                        <Mail className="h-3.5 w-3.5 text-slate-600" />
                        <span className="min-w-0 flex-1 truncate">{inv.email}</span>
                        <span className="shrink-0 text-slate-600">대기 중 · {roleLabel(inv.role)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {/* 위험 구역 */}
            <section className="mt-5 border-t border-slate-800/70 pt-4">
              {detail.myRole === "owner" ? (
                <button
                  type="button"
                  onClick={deleteWorkspace}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-950/40"
                >
                  <Trash2 className="h-4 w-4" />
                  워크스페이스 삭제
                </button>
              ) : (
                <button
                  type="button"
                  onClick={leaveWorkspace}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
                >
                  <LogOut className="h-4 w-4" />
                  워크스페이스 나가기
                </button>
              )}
            </section>
          </>
        ) : null}
      </motion.div>
    </div>
  );
}

function roleLabel(role: string): string {
  return role === "owner" ? "소유자" : role === "admin" ? "관리자" : "멤버";
}
