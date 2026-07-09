"use client";

import { useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "error";

/** 데이터가 바뀔 때마다 debounce 후 히스토리 항목을 PATCH로 저장한다. 첫 마운트(생성 직후 초기값)는 저장하지 않는다. */
export function useAutosave<T>(id: string, data: T, delay = 800): SaveStatus {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skippedFirst = useRef(false);
  const serialized = JSON.stringify(data);

  useEffect(() => {
    if (!skippedFirst.current) {
      skippedFirst.current = true;
      return;
    }

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      (async () => {
        setStatus("saving");
        try {
          const res = await fetch(`/api/history/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ result: serialized }),
          });
          setStatus(res.ok ? "idle" : "error");
        } catch {
          setStatus("error");
        }
      })();
    }, delay);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [serialized, id, delay]);

  return status;
}
