"use client";

import { useState } from "react";
import Sidebar, { type View } from "@/components/Sidebar";
import Dashboard from "@/components/Dashboard";
import GeneratorView from "@/components/GeneratorView";
import HistoryView from "@/components/HistoryView";
import { useHistory } from "@/lib/history";

export default function Home() {
  const [view, setView] = useState<View>("dashboard");
  const history = useHistory();

  return (
    <div className="relative flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* ambient background glow */}
      <div className="pointer-events-none absolute -top-40 left-1/3 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[24rem] w-[24rem] rounded-full bg-indigo-600/10 blur-[120px]" />

      <Sidebar view={view} onNavigate={setView} />

      <main className="relative z-10 min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {view === "dashboard" && (
          <Dashboard onNavigate={setView} historyCount={history.length} />
        )}
        {view === "business" && <GeneratorView mode="business" />}
        {view === "interview" && <GeneratorView mode="interview" />}
        {view === "history" && <HistoryView items={history} />}
      </main>
    </div>
  );
}
