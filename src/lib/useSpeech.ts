"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// 음성 대화 모드 — 브라우저 Web Speech API 기반 STT(받아쓰기) + TTS(읽어주기).
// 외부 API 키가 필요 없고, Chromium 계열(웹/Electron)에서 동작한다.
// 지원하지 않는 브라우저에서는 supported 플래그로 우아하게 비활성화한다.

// ── Web Speech API 최소 타입 선언 (lib.dom에 없거나 접두사 차이가 있어 직접 정의) ──
interface SpeechRecognitionAlternative {
  transcript: string;
}
interface SpeechRecognitionResult {
  0: SpeechRecognitionAlternative;
  isFinal: boolean;
}
interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export interface UseSpeechOptions {
  lang?: string;
  /** 최종 인식 결과(문장)가 확정되면 호출된다. */
  onFinal?: (text: string) => void;
}

export function useSpeech({ lang = "ko-KR", onFinal }: UseSpeechOptions = {}) {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [interim, setInterim] = useState("");

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onFinalRef = useRef(onFinal);
  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  const sttSupported = typeof window !== "undefined" && getRecognitionCtor() !== null;
  const ttsSupported =
    typeof window !== "undefined" && typeof window.speechSynthesis !== "undefined";

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const startListening = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    // 재생 중이면 겹치지 않도록 정지
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (e) => {
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const text = res[0]?.transcript ?? "";
        if (res.isFinal) {
          const finalText = text.trim();
          setInterim("");
          if (finalText) onFinalRef.current?.(finalText);
        } else {
          interimText += text;
        }
      }
      if (interimText) setInterim(interimText);
    };
    recognition.onerror = () => {
      setListening(false);
      setInterim("");
    };
    recognition.onend = () => {
      setListening(false);
      setInterim("");
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, [lang]);

  const speak = useCallback(
    (text: string) => {
      if (!ttsSupported || !text.trim()) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang;
      const match = synth.getVoices().find((v) => v.lang?.startsWith(lang.slice(0, 2)));
      if (match) utter.voice = match;
      utter.onstart = () => setSpeaking(true);
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);
      synth.speak(utter);
    },
    [lang, ttsSupported],
  );

  const stopSpeaking = useCallback(() => {
    if (ttsSupported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [ttsSupported]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  return {
    listening,
    speaking,
    interim,
    sttSupported,
    ttsSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
