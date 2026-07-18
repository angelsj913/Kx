"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Trash2, Kanban, Loader2, User as UserIcon, Sparkles } from "lucide-react";
import { useWorkspace, wsFetch } from "@/lib/workspaceClient";
import { useT, type AppDictKey } from "@/lib/i18n";

type Status = "todo" | "doing" | "done";
type Priority = "low" | "normal" | "high";

interface Assignee {
  userId: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  dueAt: string | null;
  assigneeId: string | null;
  assignee: { id: string; name: string | null; email: string | null; image: string | null } | null;
}

interface Member {
  userId: string;
  name: string | null;
  email: string | null;
}

const COLUMNS: { id: Status; labelKey: AppDictKey; hintKey: AppDictKey }[] = [
  { id: "todo", labelKey: "workboard.column.todo", hintKey: "workboard.column.todoHint" },
  { id: "doing", labelKey: "workboard.column.doing", hintKey: "workboard.column.doingHint" },
  { id: "done", labelKey: "workboard.column.done", hintKey: "workboard.column.doneHint" },
];

const PRIORITY_DOT: Record<Priority, string> = {
  low: "bg-slate-400",
  normal: "bg-blue-500",
  high: "bg-red-500",
};

const PRIORITY_BORDER: Record<Priority, string> = {
  low: "border-l-slate-300 dark:border-l-slate-600",
  normal: "border-l-blue-400 dark:border-l-blue-500",
  high: "border-l-red-400 dark:border-l-red-500",
};

function memberLabel(m: Assignee | Member): string {
  return m.name?.trim() || m.email?.trim() || "?";
}

function isOverdue(dueAt: string | null, status: Status): boolean {
  if (!dueAt || status === "done") return false;
  return new Date(dueAt).getTime() < Date.now();
}

function formatDue(dueAt: string): string {
  const d = new Date(dueAt);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function WorkBoardView() {
  const t = useT();
  const { activeId } = useWorkspace();
  const { data: session } = useSession();
  const myId = session?.user?.id ?? null;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [dueAt, setDueAt] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [busy, setBusy] = useState(false);
  const [myTasksOnly, setMyTasksOnly] = useState(false);
  const [goal, setGoal] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");

  const hasTeam = !!activeId;

  const load = useCallback(async () => {
    try {
      const res = await wsFetch("/api/board");
      const data = await res.json();
      if (res.ok) setTasks(data.tasks ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, activeId]);

  useEffect(() => {
    if (!activeId) {
      setMembers([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await wsFetch(`/api/workspaces/${activeId}`);
      const data = await res.json();
      if (!cancelled && res.ok) {
        setMembers(
          (data.workspace?.members ?? []).map((m: Assignee) => ({
            userId: m.userId,
            name: m.name,
            email: m.email,
          })),
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  const visibleTasks = useMemo(
    () => (myTasksOnly ? tasks.filter((task) => task.assigneeId === myId) : tasks),
    [tasks, myTasksOnly, myId],
  );

  async function addTask() {
    const value = title.trim();
    if (!value || busy) return;
    setBusy(true);
    try {
      const res = await wsFetch("/api/board", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: value,
          priority,
          dueAt: dueAt || null,
          assigneeId: assigneeId || null,
        }),
      });
      if (res.ok) {
        setTitle("");
        setPriority("normal");
        setDueAt("");
        setAssigneeId("");
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  async function aiPlan() {
    const value = goal.trim();
    if (!value || aiBusy) return;
    setAiBusy(true);
    setAiError("");
    try {
      const res = await wsFetch("/api/board/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ goal: value }),
      });
      const data = await res.json();
      if (res.ok) {
        setGoal("");
        await load();
      } else {
        setAiError(data?.error ?? t("common.unknownError"));
      }
    } catch {
      setAiError(t("common.unknownError"));
    } finally {
      setAiBusy(false);
    }
  }

  async function move(id: string, status: Status) {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, status } : task)));
    await wsFetch("/api/board", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
  }

  async function reassign(id: string, newAssigneeId: string) {
    const member = members.find((m) => m.userId === newAssigneeId) ?? null;
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              assigneeId: newAssigneeId || null,
              assignee: member
                ? { id: member.userId, name: member.name, email: member.email, image: null }
                : null,
            }
          : task,
      ),
    );
    await wsFetch("/api/board", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, assigneeId: newAssigneeId || null }),
    });
  }

  async function remove(id: string) {
    setTasks((prev) => prev.filter((task) => task.id !== id));
    await wsFetch("/api/board", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  return (
    <div className="flex h-full flex-col overflow-hidden p-3 sm:p-6">
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-[var(--workspace-text)]">
              <Kanban className="h-5 w-5 text-blue-600" />
              {t("sidebar.workboard")}
            </h1>
            <p className="mt-1 text-sm text-[var(--workspace-text-secondary)]">
              {t("workboard.aiHint")}
            </p>
          </div>
          {hasTeam && (
            <button
              type="button"
              onClick={() => setMyTasksOnly((v) => !v)}
              className={`inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                myTasksOnly
                  ? "border-blue-500 bg-blue-600/10 text-blue-700 dark:text-blue-300"
                  : "border-[var(--workspace-border)] text-[var(--workspace-text-secondary)]"
              }`}
            >
              <UserIcon className="h-3.5 w-3.5" />
              {t("workboard.myTasksOnly")}
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder={t("workboard.newTaskPlaceholder")}
            className="min-w-0 flex-1 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-surface)] px-3 py-2 text-sm outline-none focus:border-blue-500 sm:w-56"
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            aria-label={t("workboard.priorityAria")}
            className="shrink-0 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-surface)] px-2 py-2 text-xs outline-none focus:border-blue-500"
          >
            <option value="low">{t("workboard.priority.low")}</option>
            <option value="normal">{t("workboard.priority.normal")}</option>
            <option value="high">{t("workboard.priority.high")}</option>
          </select>
          <input
            type="date"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            aria-label={t("workboard.dueDateAria")}
            className="shrink-0 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-surface)] px-2 py-2 text-xs outline-none focus:border-blue-500 [color-scheme:dark]"
          />
          {hasTeam && members.length > 0 && (
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              aria-label={t("workboard.assigneeAria")}
              className="shrink-0 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-surface)] px-2 py-2 text-xs outline-none focus:border-blue-500"
            >
              <option value="">{t("workboard.unassigned")}</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {memberLabel(m)}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => void addTask()}
            disabled={busy}
            className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-md"
          >
            <Plus className="h-4 w-4" /> {t("common.add")}
          </button>
        </div>

        {/* AI 프로젝트 어시스턴트: 목표를 입력하면 실행 작업으로 자동 분해 */}
        <div className="rounded-xl border border-blue-500/30 bg-blue-600/5 p-2.5 dark:bg-blue-500/10">
          <div className="flex flex-wrap gap-2">
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && aiPlan()}
              placeholder={t("workboard.aiGoalPlaceholder")}
              disabled={aiBusy}
              className="min-w-0 flex-1 rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-surface)] px-3 py-2 text-sm outline-none focus:border-blue-500 sm:w-72"
            />
            <button
              type="button"
              onClick={() => void aiPlan()}
              disabled={aiBusy || !goal.trim()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-60"
            >
              {aiBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {t("workboard.aiPlan")}
            </button>
          </div>
          {aiError && <p className="mt-1.5 text-xs text-red-500">{aiError}</p>}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 gap-3 overflow-x-auto pb-2 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const items = visibleTasks.filter((task) => task.status === col.id);
            return (
              <div
                key={col.id}
                className="flex min-h-[16rem] min-w-[240px] flex-col rounded-2xl border border-[var(--workspace-border)] bg-[var(--workspace-surface)]"
              >
                <div className="flex items-center justify-between border-b border-[var(--workspace-border)] px-3 py-2.5">
                  <span className="text-sm font-semibold text-[var(--workspace-text)]">
                    {t(col.labelKey)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500 dark:bg-slate-800">
                    {items.length}
                  </span>
                </div>
                <ul className="flex-1 space-y-2 overflow-y-auto p-2">
                  {items.map((task) => {
                    const overdue = isOverdue(task.dueAt, task.status);
                    return (
                      <li
                        key={task.id}
                        className={`rounded-xl border border-l-4 border-[var(--workspace-border)] bg-[var(--workspace-bg)] p-3 shadow-sm ${PRIORITY_BORDER[task.priority]}`}
                      >
                        <div className="flex items-start gap-1.5">
                          <span
                            className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT[task.priority]}`}
                          />
                          <p className="min-w-0 flex-1 text-sm font-medium text-[var(--workspace-text)]">
                            {task.title}
                          </p>
                        </div>
                        {task.description && (
                          <p className="mt-1 line-clamp-2 text-xs text-[var(--workspace-text-secondary)]">
                            {task.description}
                          </p>
                        )}
                        {(task.dueAt || task.assignee) && (
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            {task.dueAt && (
                              <span
                                className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                                  overdue
                                    ? "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400"
                                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                }`}
                              >
                                {formatDue(task.dueAt)}
                                {overdue ? ` · ${t("workboard.overdueBadge")}` : ""}
                              </span>
                            )}
                            {task.assignee && (
                              <span
                                title={memberLabel({ userId: task.assignee.id, name: task.assignee.name, email: task.assignee.email })}
                                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600/15 text-[10px] font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                              >
                                {memberLabel({ userId: task.assignee.id, name: task.assignee.name, email: task.assignee.email })
                                  .slice(0, 1)
                                  .toUpperCase()}
                              </span>
                            )}
                          </div>
                        )}
                        {hasTeam && members.length > 0 && (
                          <select
                            value={task.assigneeId ?? ""}
                            onChange={(e) => void reassign(task.id, e.target.value)}
                            aria-label={t("workboard.assigneeAria")}
                            className="mt-2 w-full rounded-md border border-slate-200 bg-transparent px-1.5 py-1 text-[10px] text-slate-500 dark:border-slate-700"
                          >
                            <option value="">{t("workboard.unassigned")}</option>
                            {members.map((m) => (
                              <option key={m.userId} value={m.userId}>
                                {memberLabel(m)}
                              </option>
                            ))}
                          </select>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-1">
                          {COLUMNS.filter((c) => c.id !== task.status).map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => void move(task.id, c.id)}
                              className="rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500 hover:border-blue-400 hover:text-blue-600 dark:border-slate-600"
                            >
                              → {t(c.labelKey)}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => void remove(task.id)}
                            className="ml-auto rounded-md p-1 text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                  {items.length === 0 && (
                    <li className="py-8 text-center text-xs text-slate-400">{t(col.hintKey)}</li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
