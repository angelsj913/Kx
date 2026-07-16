"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Kanban, Loader2 } from "lucide-react";
import { wsFetch } from "@/lib/workspaceClient";
import { useT, type AppDictKey } from "@/lib/i18n";

type Status = "todo" | "doing" | "done";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: string;
  dueAt: string | null;
}

const COLUMNS: { id: Status; labelKey: AppDictKey; hintKey: AppDictKey }[] = [
  { id: "todo", labelKey: "workboard.column.todo", hintKey: "workboard.column.todoHint" },
  { id: "doing", labelKey: "workboard.column.doing", hintKey: "workboard.column.doingHint" },
  { id: "done", labelKey: "workboard.column.done", hintKey: "workboard.column.doneHint" },
];

export default function WorkBoardView() {
  const t = useT();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

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
  }, [load]);

  async function addTask() {
    const t = title.trim();
    if (!t || busy) return;
    setBusy(true);
    try {
      const res = await wsFetch("/api/board", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: t }),
      });
      if (res.ok) {
        setTitle("");
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  async function move(id: string, status: Status) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    await wsFetch("/api/board", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
  }

  async function remove(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await wsFetch("/api/board", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  return (
    <div className="flex h-full flex-col overflow-hidden p-3 sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-[var(--workspace-text)]">
            <Kanban className="h-5 w-5 text-blue-600" />
            {t("sidebar.workboard")}
          </h1>
          <p className="mt-1 text-sm text-[var(--workspace-text-secondary)]">
            {t("workboard.subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder={t("workboard.newTaskPlaceholder")}
            className="min-w-0 flex-1 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-surface)] px-3 py-2 text-sm outline-none focus:border-blue-500 sm:w-56"
          />
          <button
            type="button"
            onClick={() => void addTask()}
            disabled={busy}
            className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-md"
          >
            <Plus className="h-4 w-4" /> {t("common.add")}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 gap-3 overflow-x-auto pb-2 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const items = tasks.filter((task) => task.status === col.id);
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
                  {items.map((task) => (
                    <li
                      key={task.id}
                      className="rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-bg)] p-3 shadow-sm"
                    >
                      <p className="text-sm font-medium text-[var(--workspace-text)]">
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-[var(--workspace-text-secondary)]">
                          {task.description}
                        </p>
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
                  ))}
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
