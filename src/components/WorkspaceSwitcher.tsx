"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Users, Check, Plus, ChevronDown, Settings, User as UserIcon } from "lucide-react";
import { useWorkspace } from "@/lib/workspaceClient";
import WorkspaceModal from "./WorkspaceModal";

export default function WorkspaceSwitcher() {
  const { activeId, active, workspaces, setActiveId, refresh } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [manageId, setManageId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function createWorkspace() {
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (res.ok && data.workspace) {
        await refresh();
        setActiveId(data.workspace.id);
        setName("");
        setCreating(false);
        setOpen(false);
      }
    } finally {
      setBusy(false);
    }
  }

  const label = active ? active.name : "개인 워크스페이스";

  return (
    <div ref={ref} className="relative border-b border-slate-800/60 px-2 py-2 sm:px-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition-colors hover:bg-slate-800/60"
      >
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
            active ? "bg-violet-600/25 text-violet-300" : "bg-slate-700/50 text-slate-300"
          }`}
        >
          {active ? <Users className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
        </span>
        <span className="hidden min-w-0 flex-1 sm:block">
          <span className="block truncate text-xs font-semibold text-slate-100">{label}</span>
          <span className="block truncate text-[10px] text-slate-500">
            {active ? `멤버 ${active.memberCount}명 · ${roleLabel(active.role)}` : "나만의 공간"}
          </span>
        </span>
        <ChevronDown className="hidden h-4 w-4 shrink-0 text-slate-500 sm:block" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-2 right-2 top-full z-30 mt-1 overflow-hidden rounded-xl border border-slate-700/70 bg-slate-900/95 shadow-xl shadow-black/40 backdrop-blur-md sm:left-3 sm:right-3"
          >
            <ul className="max-h-64 overflow-y-auto p-1">
              <ScopeRow
                icon={<UserIcon className="h-4 w-4" />}
                title="개인 워크스페이스"
                subtitle="나만의 공간"
                selected={!activeId}
                onSelect={() => {
                  setActiveId(null);
                  setOpen(false);
                }}
              />
              {workspaces.map((w) => (
                <ScopeRow
                  key={w.id}
                  icon={<Users className="h-4 w-4" />}
                  title={w.name}
                  subtitle={`멤버 ${w.memberCount}명 · ${roleLabel(w.role)}`}
                  selected={activeId === w.id}
                  onSelect={() => {
                    setActiveId(w.id);
                    setOpen(false);
                  }}
                  onManage={() => {
                    setManageId(w.id);
                    setOpen(false);
                  }}
                />
              ))}
            </ul>

            <div className="border-t border-slate-800/70 p-1">
              {creating ? (
                <div className="flex items-center gap-1.5 p-1.5">
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && createWorkspace()}
                    placeholder="워크스페이스 이름"
                    maxLength={60}
                    className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-violet-500"
                  />
                  <button
                    type="button"
                    onClick={createWorkspace}
                    disabled={busy || !name.trim()}
                    className="shrink-0 rounded-lg bg-violet-600 px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    생성
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-violet-300 transition-colors hover:bg-slate-800/60"
                >
                  <Plus className="h-4 w-4" />새 워크스페이스 만들기
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {manageId && (
        <WorkspaceModal
          workspaceId={manageId}
          onClose={() => setManageId(null)}
          onChanged={refresh}
        />
      )}
    </div>
  );
}

function ScopeRow({
  icon,
  title,
  subtitle,
  selected,
  onSelect,
  onManage,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  selected: boolean;
  onSelect: () => void;
  onManage?: () => void;
}) {
  return (
    <li className="group flex items-center gap-1">
      <button
        type="button"
        onClick={onSelect}
        className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors ${
          selected ? "bg-violet-600/15" : "hover:bg-slate-800/60"
        }`}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-700/50 text-slate-300">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium text-slate-100">{title}</span>
          <span className="block truncate text-[10px] text-slate-500">{subtitle}</span>
        </span>
        {selected && <Check className="h-4 w-4 shrink-0 text-violet-400" />}
      </button>
      {onManage && (
        <button
          type="button"
          onClick={onManage}
          aria-label="워크스페이스 관리"
          className="shrink-0 rounded-lg p-1.5 text-slate-500 opacity-0 transition-opacity hover:text-slate-200 group-hover:opacity-100"
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      )}
    </li>
  );
}

function roleLabel(role: string): string {
  return role === "owner" ? "소유자" : role === "admin" ? "관리자" : "멤버";
}
