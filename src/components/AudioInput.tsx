"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Upload, Trash2, AudioLines } from "lucide-react";
import { useT } from "@/lib/i18n";

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function AudioInput({
  file,
  onChange,
  disabled,
}: {
  file: File | null;
  onChange: (f: File | null) => void;
  disabled?: boolean;
}) {
  const t = useT();
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function startRecording() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const ext = (recorder.mimeType || "audio/webm").includes("mp4")
          ? "mp4"
          : "webm";
        const recorded = new File([blob], `recording-${Date.now()}.${ext}`, {
          type: blob.type,
        });
        onChange(recorded);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } catch {
      setError(t("audio.micError"));
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      setError("");
      onChange(f);
    }
  }

  return (
    <div className="flex flex-1 flex-col rounded-xl border border-slate-300 bg-white p-5 dark:border-slate-700 dark:bg-slate-900/60">
      {file ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 shadow-lg shadow-blue-600/30">
            <AudioLines className="h-7 w-7 text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
              {file.name}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB {t("audio.readySuffix")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-500 transition-colors hover:border-red-500/40 hover:text-red-500 disabled:opacity-50 dark:border-slate-700 dark:text-slate-400 dark:hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t("audio.reselect")}
          </button>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full border transition-colors ${
              recording
                ? "animate-pulse border-red-500/50 bg-red-500/20"
                : "border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60"
            }`}
          >
            <Mic
              className={`h-8 w-8 ${recording ? "text-red-400" : "text-blue-600 dark:text-blue-400"}`}
            />
          </div>

          {recording ? (
            <>
              <p className="text-sm font-medium tabular-nums text-red-300">
                {t("audio.recordingPrefix")}{formatTime(elapsed)}
              </p>
              <button
                type="button"
                onClick={stopRecording}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500"
              >
                <Square className="h-4 w-4" />
                {t("audio.stopRecording")}
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("audio.hint")}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={disabled}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  <Mic className="h-4 w-4" />
                  {t("audio.startRecording")}
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-blue-500/50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200"
                >
                  <Upload className="h-4 w-4" />
                  {t("audio.uploadFile")}
                </button>
              </div>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFilePick}
            className="hidden"
          />
        </div>
      )}

      {error && <p className="mt-3 text-center text-xs text-red-400">{error}</p>}
    </div>
  );
}
