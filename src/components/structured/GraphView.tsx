"use client";

import { useEffect, useRef } from "react";
import { LineChart, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import katex from "katex";
import * as Plotly from "plotly.js-dist-min";
import type { MathGraph } from "@/lib/structured";

type PlotlyDiv = Plotly.PlotlyHTMLElement & { layout?: Partial<Plotly.Layout> };

const DEFAULT_CAMERA: Partial<Plotly.Camera> = { eye: { x: 1.4, y: 1.4, z: 1.1 } };
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

function scaleRange(range: [number, number], factor: number): [number, number] {
  const mid = (range[0] + range[1]) / 2;
  const half = ((range[1] - range[0]) / 2) * factor;
  return [mid - half, mid + half];
}

/** relayout은 "scene.camera.eye" 같은 점 표기 경로 키도 받지만 Layout 타입엔 없어 캐스트가 필요하다. */
function relayoutPatch(el: HTMLElement, patch: Record<string, unknown>) {
  void Plotly.relayout(el, patch as Partial<Plotly.Layout>);
}

/** 그래프는 AI가 계산한 결과를 보여주기만 하는 읽기 전용 뷰라 autosave가 필요 없다. */
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
          camera: DEFAULT_CAMERA,
          xaxis: { title: { text: "x" }, ...axisStyle },
          yaxis: { title: { text: "y" }, ...axisStyle },
          zaxis: { title: { text: "z" }, ...axisStyle },
        },
      };
      void Plotly.newPlot(el, [trace], layout, { displayModeBar: false, responsive: true });
    } else {
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
        xaxis: { range: initial.xRange, ...axisStyle },
        yaxis: { range: initial.yRange, ...axisStyle },
      };
      void Plotly.newPlot(el, traces, layout, { displayModeBar: false, responsive: true });
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

  function zoom(factor: number) {
    const el = containerRef.current as PlotlyDiv | null;
    if (!el) return;
    if (initial.mode === "3d") {
      const eye = el.layout?.scene?.camera?.eye;
      const ex = eye?.x ?? 1.4;
      const ey = eye?.y ?? 1.4;
      const ez = eye?.z ?? 1.1;
      relayoutPatch(el, {
        "scene.camera.eye": { x: ex * factor, y: ey * factor, z: ez * factor },
      });
    } else {
      const xr = (el.layout?.xaxis?.range as [number, number] | undefined) ?? initial.xRange;
      const yr = (el.layout?.yaxis?.range as [number, number] | undefined) ?? initial.yRange;
      relayoutPatch(el, {
        "xaxis.range": scaleRange(xr, factor),
        "yaxis.range": scaleRange(yr, factor),
      });
    }
  }

  function reset() {
    const el = containerRef.current;
    if (!el) return;
    if (initial.mode === "3d") {
      relayoutPatch(el, { "scene.camera": DEFAULT_CAMERA });
    } else {
      relayoutPatch(el, {
        "xaxis.range": initial.xRange,
        "yaxis.range": initial.yRange,
      });
    }
  }

  const titleHtml = renderTitleHtml(initial.title);

  return (
    <div
      id={`graph-${id}`}
      className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-2xl dark:shadow-black/40 dark:backdrop-blur-md"
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:px-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          <LineChart className="h-4 w-4 shrink-0 text-[var(--mode-accent)]" />
          {titleHtml ? (
            <span dangerouslySetInnerHTML={{ __html: titleHtml }} />
          ) : (
            <span>{initial.title || "수학 그래프"}</span>
          )}
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => zoom(0.8)}
            aria-label="확대"
            title="확대"
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-[var(--mode-accent)] dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => zoom(1.25)}
            aria-label="축소"
            title="축소"
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-[var(--mode-accent)] dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={reset}
            aria-label="보기 초기화"
            title="보기 초기화"
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-[var(--mode-accent)] dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div ref={containerRef} className="h-80 min-h-0 flex-1 sm:h-96" />
    </div>
  );
}
