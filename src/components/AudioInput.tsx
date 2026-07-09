"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Upload, Trash2, AudioLines } from "lucide-react";

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
      setError("마이크에 접근할 수 없습니다. 권한을 확인하거나 파일을 업로드해 주세요.");
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
    <div className="flex flex-1 flex-col rounded-xl border border-slate-700/60 bg-slate-900/60 p-5">
      {file ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg shadow-violet-900/40">
            <AudioLines className="h-7 w-7 text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-100">
              {file.name}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB · 준비 완료
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:border-red-500/40 hover:text-red-400 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            다시 선택
          </button>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full border transition-colors ${
              recording
                ? "animate-pulse border-red-500/50 bg-red-500/20"
                : "border-slate-700/60 bg-slate-800/60"
            }`}
          >
            <Mic
              className={`h-8 w-8 ${recording ? "text-red-400" : "text-violet-400"}`}
            />
          </div>

          {recording ? (
            <>
              <p className="text-sm font-medium tabular-nums text-red-300">
                녹음 중 · {formatTime(elapsed)}
              </p>
              <button
                type="button"
                onClick={stopRecording}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500"
              >
                <Square className="h-4 w-4" />
                녹음 중지
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-400">
                수업을 바로 녹음하거나, 저장된 오디오 파일을 올려주세요.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={disabled}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  <Mic className="h-4 w-4" />
                  녹음 시작
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/50 px-5 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-violet-500/50 disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  파일 업로드
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
