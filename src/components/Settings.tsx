"use client";

import { useState } from "react";
import { KeyRound, Check, ExternalLink, Eye, EyeOff } from "lucide-react";
import { useApiKeys, setApiKeys } from "@/lib/apiKeys";

export default function Settings() {
  const saved = useApiKeys();
  const [gemini, setGemini] = useState(saved.gemini);
  const [openrouter, setOpenrouter] = useState(saved.openrouter);
  const [showGemini, setShowGemini] = useState(false);
  const [showOr, setShowOr] = useState(false);
  const [done, setDone] = useState(false);

  function save() {
    setApiKeys({ gemini: gemini.trim(), openrouter: openrouter.trim() });
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 shadow-2xl shadow-black/40 backdrop-blur-md sm:p-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg shadow-violet-900/40">
            <KeyRound className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-50">API 키 설정</h1>
            <p className="text-sm text-slate-400">
              무료 키만 넣으면 됩니다. 키는 이 기기에만 저장돼요.
            </p>
          </div>
        </div>

        {/* Gemini */}
        <div className="mt-6">
          <label className="flex items-center justify-between text-sm font-medium text-slate-200">
            <span>Google Gemini 키</span>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener"
              className="flex items-center gap-1 text-xs font-normal text-violet-400 hover:text-violet-300"
            >
              무료 발급 <ExternalLink className="h-3 w-3" />
            </a>
          </label>
          <div className="relative mt-2">
            <input
              type={showGemini ? "text" : "password"}
              value={gemini}
              onChange={(e) => setGemini(e.target.value)}
              placeholder="AIza..."
              className="w-full rounded-xl border border-slate-700/60 bg-slate-900/60 py-3 pl-4 pr-11 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-600 focus:border-violet-500/70 focus:ring-2 focus:ring-violet-500/20"
            />
            <button
              type="button"
              onClick={() => setShowGemini((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              aria-label="키 보기 전환"
            >
              {showGemini ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            카드 없이 발급되고 무료 등급이 있습니다. 기본 AI · 영상/음성 기능에 사용됩니다.
          </p>
        </div>

        {/* OpenRouter */}
        <div className="mt-6">
          <label className="flex items-center justify-between text-sm font-medium text-slate-200">
            <span>OpenRouter 키 (선택)</span>
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener"
              className="flex items-center gap-1 text-xs font-normal text-violet-400 hover:text-violet-300"
            >
              무료 발급 <ExternalLink className="h-3 w-3" />
            </a>
          </label>
          <div className="relative mt-2">
            <input
              type={showOr ? "text" : "password"}
              value={openrouter}
              onChange={(e) => setOpenrouter(e.target.value)}
              placeholder="sk-or-..."
              className="w-full rounded-xl border border-slate-700/60 bg-slate-900/60 py-3 pl-4 pr-11 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-600 focus:border-violet-500/70 focus:ring-2 focus:ring-violet-500/20"
            />
            <button
              type="button"
              onClick={() => setShowOr((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              aria-label="키 보기 전환"
            >
              {showOr ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            GPT·Llama·DeepSeek 등 여러 AI를 무료 모델로 쓸 수 있습니다. 없으면 Gemini만 사용됩니다.
          </p>
        </div>

        <button
          type="button"
          onClick={save}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          {done ? (
            <>
              <Check className="h-4 w-4" /> 저장됨
            </>
          ) : (
            "저장하기"
          )}
        </button>

        <p className="mt-4 text-center text-xs text-slate-600">
          키는 서버에 저장되지 않고 이 브라우저(앱)에만 보관됩니다.
        </p>
      </div>
    </div>
  );
}
