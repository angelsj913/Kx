"use client";

import { useEffect, useRef } from "react";
import { LineChart } from "lucide-react";
import katex from "katex";
import * as Plotly from "plotly.js-dist-min";
import type { MathGraph } from "@/lib/structured";

const PALETTE = ["#2563eb", "#7c3aed", "#0891b2", "#db2777", "#16a34a"];

function renderTitleHtml(title: string): string {
  if (!title.trim()) return "";
  try {
    return katex.renderToString(title, { throwOnError: false, displayMode: false });
  } catch {
    return "";
  }
}

function isDarkMode(): boolean {
  return typeof document !== "undefined" && document.documentElement.classList.contains("dark");
}

/**
 * 그래프는 AI가 계산한 결과를 그대로 보여주기만 하는 뷰다 — autosave도, 확대/축소/이동
 * 조작도 없다(2D는 완전히 정적, 3D는 마우스 드래그로 회전만 가능한 Plotly 기본 동작).
 */
export default function GraphView({ id, initial }: { id: string; initial: MathGraph }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const dark = isDarkMode();
    const axisColor = dark ? "#94a3b8" : "#475569";
    const gridColor = dark ? "#1e293b" : "#e2e8f0";
    const axisStyle = { color: axisColor, gridcolor: gridColor, zerolinecolor: gridColor };

    if (initial.mode === "3d" && initial.surface) {
      const trace: Partial<Plotly.PlotData> = {
        type: "surface",
        x: initial.surface.x,
        y: initial.surface.y,
        z: initial.surface.z,
        colorscale: "Viridis",
        showscale: false,
      };
      const layout: Partial<Plotly.Layout> = {
        autosize: true,
        margin: { l: 0, r: 0, t: 10, b: 0 },
        paper_bgcolor: "transparent",
        scene: {
          // 마우스 드래그로 회전만 가능하도록 — 확대/이동 등 다른 조작은 노출하지 않는다.
          dragmode: "orbit",
          camera: { eye: { x: 1.4, y: 1.4, z: 1.1 } },
          xaxis: { title: { text: "x" }, ...axisStyle },
          yaxis: { title: { text: "y" }, ...axisStyle },
          zaxis: { title: { text: "z" }, ...axisStyle },
        },
      };
      void Plotly.newPlot(el, [trace], layout, { displayModeBar: false, responsive: true });
    } else {
      // y 범위는 AI가 제안한 값이 아니라 실제 샘플링된 값의 최소/최대에서 계산돼(structured.ts)
      // 항상 그래프 전체 모양(꼭짓점·근 등)이 한 화면에 들어온다.
      const traces: Partial<Plotly.PlotData>[] = initial.functions.map((f, i) => ({
        type: "scatter",
        mode: "lines",
        x: f.x,
        y: f.y,
        name: f.label || f.expr,
        connectgaps: false,
        line: { color: PALETTE[i % PALETTE.length], width: 2.5 },
      }));
      const layout: Partial<Plotly.Layout> = {
        autosize: true,
        margin: { l: 45, r: 20, t: 10, b: 35 },
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        showlegend: initial.functions.length > 1,
        legend: { font: { color: axisColor } },
        xaxis: { range: initial.xRange, fixedrange: true, ...axisStyle },
        yaxis: { range: initial.yRange, fixedrange: true, ...axisStyle },
      };
      // 2D는 완전히 정적 — 확대/축소/이동/편집 없이 그래프만 보여준다.
      void Plotly.newPlot(el, traces, layout, {
        displayModeBar: false,
        staticPlot: true,
        responsive: true,
      });
    }

    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) void Plotly.Plots.resize(containerRef.current);
    });
    resizeObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
      Plotly.purge(el);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const titleHtml = renderTitleHtml(initial.title);

  return (
    <div
      id={`graph-${id}`}
      className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-2xl dark:shadow-black/40 dark:backdrop-blur-md"
    >
      <div className="flex items-center border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:px-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          <LineChart className="h-4 w-4 shrink-0 text-[var(--mode-accent)]" />
          {titleHtml ? (
            <span dangerouslySetInnerHTML={{ __html: titleHtml }} />
          ) : (
            <span>{initial.title || "수학 그래프"}</span>
          )}
        </h2>
      </div>
      <div ref={containerRef} className="h-80 w-full sm:h-96" />
    </div>
  );
}
