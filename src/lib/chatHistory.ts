import { useCallback, useEffect, useState } from "react";

export interface ChatHistoryItem {
  id: string;
  provider: string;
  model: string;
  message: string;
  reply: string;
  createdAt: string;
}

async function fetchChatHistory(): Promise<ChatHistoryItem[]> {
  const res = await fetch("/api/chat");
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "히스토리를 불러오지 못했습니다.");
  return data.items ?? [];
}

/** AI 채팅 히스토리(ChatHistory 테이블) 상태. AppWorkspace에서 한 번 만들어
 * AiChat(전송 시 prepend)과 HistoryView(목록·삭제)가 함께 구독한다. */
export function useChatHistory() {
  const [items, setItems] = useState<ChatHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const result = await fetchChatHistory();
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
      setItems(await fetchChatHistory());
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  /** 새로 주고받은 대화를 서버 재조회 없이 목록 맨 앞에 즉시 반영한다. */
  const prepend = useCallback((item: ChatHistoryItem) => {
    setItems((prev) => [item, ...prev]);
  }, []);

  const removeItem = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/chat?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  }, []);

  const clearAll = useCallback(async () => {
    setItems([]);
    await fetch("/api/chat", { method: "DELETE" });
  }, []);

  return { items, loading, error, refetch, prepend, removeItem, clearAll };
}
