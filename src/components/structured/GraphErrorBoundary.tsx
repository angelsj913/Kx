"use client";

import { Component, type ReactNode } from "react";

/**
 * Plotly(WebGL) 렌더링 중 예외가 나면 이 카드만 대체 문구를 보여주고,
 * 채팅 전체가 크래시(전역 에러 페이지)로 넘어가지 않도록 막는다.
 */
export default class GraphErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[GraphView] rendering crashed", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-80 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400 sm:h-96">
          그래프를 표시하는 중 문제가 발생했어요. 새로고침하거나 다시 요청해 주세요.
        </div>
      );
    }
    return this.props.children;
  }
}
