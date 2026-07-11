import { useCallback, useEffect, useState } from "react";
import type { OutputType } from "../tools";

export interface HistoryItem {
  id: string;
  toolId: string;
  toolLabel: string;
  outputType: OutputType;
  prompt: string;
  /** 마크다운 결과 또는 pptx/xlsx용 원본 JSON 문자열 */
  result: string;
  fileUrl?: string | null;
  fileName?: string | null;
  createdAt: string;
}

async function fetchHistoryItems(): Promise<HistoryItem[]> {
  const res = await fetch("/api/history");
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "히스토리를 불러오지 못했습니다.");
  return data.items ?? [];
}

export function useHistory() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const result = await fetchHistoryItems();
        if (!ignore) setItems(result);
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await fetchHistoryItems());
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  const removeItem = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/history/${id}`, { method: "DELETE" });
  }, []);

  const clearAll = useCallback(async () => {
    setItems([]);
    await fetch("/api/history", { method: "DELETE" });
  }, []);

  return { items, loading, error, refetch, removeItem, clearAll };
}
