"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { MindMap, MindMapNode } from "@/lib/structured";

// 최상위 가지마다 다른 색을 배정 — 마인드맵 특유의 색 구분.
const BRANCH = [
  { bg: "bg-blue-50 dark:bg-blue-500/10", br: "border-blue-300 dark:border-blue-500/40", tx: "text-blue-900 dark:text-blue-100", line: "#60a5fa" },
  { bg: "bg-emerald-50 dark:bg-emerald-500/10", br: "border-emerald-300 dark:border-emerald-500/40", tx: "text-emerald-900 dark:text-emerald-100", line: "#34d399" },
  { bg: "bg-amber-50 dark:bg-amber-500/10", br: "border-amber-300 dark:border-amber-500/40", tx: "text-amber-900 dark:text-amber-100", line: "#fbbf24" },
  { bg: "bg-violet-50 dark:bg-violet-500/10", br: "border-violet-300 dark:border-violet-500/40", tx: "text-violet-900 dark:text-violet-100", line: "#a78bfa" },
  { bg: "bg-rose-50 dark:bg-rose-500/10", br: "border-rose-300 dark:border-rose-500/40", tx: "text-rose-900 dark:text-rose-100", line: "#fb7185" },
  { bg: "bg-cyan-50 dark:bg-cyan-500/10", br: "border-cyan-300 dark:border-cyan-500/40", tx: "text-cyan-900 dark:text-cyan-100", line: "#22d3ee" },
] as const;

type Palette = (typeof BRANCH)[number];

function NodeView({
  node,
  depth,
  palette,
}: {
  node: MindMapNode;
  depth: number;
  palette: Palette;
}) {
  // 3단계 이상은 기본 접힘 — 처음엔 큰 그림이 보이게.
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = node.children.length > 0;
  const isRoot = depth === 0;

  return (
    <div className="flex items-center">
      <div className="flex shrink-0 items-center">
        <div
          className={`whitespace-nowrap rounded-xl border px-3 py-2 text-sm shadow-sm ${
            isRoot
              ? "border-blue-600 bg-blue-600 text-base font-bold text-white"
              : `${palette.bg} ${palette.br} ${palette.tx} ${depth === 1 ? "font-semibold" : ""}`
          }`}
        >
          {node.label}
        </div>
        {hasChildren && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            title={open ? "접기" : "펼치기"}
            className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500 transition-colors hover:text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white"
          >
            {open ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          </button>
        )}
      </div>

      {hasChildren && open && (
        <div
          className="ml-6 flex flex-col gap-2.5 border-l-2 pl-6"
          style={{ borderColor: palette.line }}
        >
          {node.children.map((child, i) => (
            <NodeView
              key={i}
              node={child}
              depth={depth + 1}
              // 최상위 가지에서 색을 새로 배정하고, 그 아래로는 상속.
              palette={isRoot ? BRANCH[i % BRANCH.length] : palette}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MindMapView({ initial }: { id: string; initial: MindMap }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      {initial.title && (
        <h3 className="mb-4 text-base font-bold text-slate-900 dark:text-slate-50">
          {initial.title}
        </h3>
      )}
      {/* 가로 마인드맵 — 좁은 화면에선 스크롤 */}
      <div className="overflow-x-auto pb-2">
        <NodeView node={initial.root} depth={0} palette={BRANCH[0]} />
      </div>
    </div>
  );
}
