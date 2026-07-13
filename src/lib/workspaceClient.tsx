"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSession } from "next-auth/react";

// 팀 워크스페이스 클라이언트 계층 — 활성 워크스페이스를 사용자별로 localStorage에 보관하고,
// 모든 데이터 요청에 X-Workspace-Id 헤더를 실어 보낸다(개인 스코프면 헤더 없음).

export interface WorkspaceSummary {
  id: string;
  name: string;
  role: "owner" | "admin" | "member";
  memberCount: number;
}

const WS_KEY_PREFIX = "kx.activeWorkspace";
/** 레거시(전역) 키 — 사용자별 키로 이전 후 제거 */
const WS_KEY_LEGACY = "kx.activeWorkspace";

/** wsFetch 가 동기적으로 읽을 현재 활성 워크스페이스 (Provider 가 갱신) */
let currentActiveWorkspaceId: string | null = null;

function storageKey(userId: string | null | undefined): string | null {
  if (!userId) return null;
  return `${WS_KEY_PREFIX}.${userId}`;
}

export function getActiveWorkspaceId(): string | null {
  return currentActiveWorkspaceId;
}

/** 활성 워크스페이스 헤더를 자동으로 붙이는 fetch 래퍼. */
export function wsFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const id = currentActiveWorkspaceId;
  const headers = new Headers(init.headers);
  if (id) headers.set("X-Workspace-Id", id);
  return fetch(input, { ...init, headers });
}

interface WorkspaceContextValue {
  activeId: string | null;
  active: WorkspaceSummary | null;
  workspaces: WorkspaceSummary[];
  loading: boolean;
  setActiveId: (id: string | null) => void;
  refresh: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;

  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [activeId, setActiveIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 모듈 포인터 동기화 — 언마운트 시 초기화해 계정 전환 잔존 방지
  useEffect(() => {
    currentActiveWorkspaceId = activeId;
    return () => {
      currentActiveWorkspaceId = null;
    };
  }, [activeId]);

  const refresh = useCallback(async () => {
    if (!userId) {
      setWorkspaces([]);
      setActiveIdState(null);
      currentActiveWorkspaceId = null;
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/workspaces");
      const data = await res.json();
      if (res.ok) {
        const list: WorkspaceSummary[] = data.workspaces ?? [];
        setWorkspaces(list);

        const key = storageKey(userId);
        let stored = key ? window.localStorage.getItem(key) : null;

        // 레거시 전역 키 → 이 사용자 키로 이전
        if (!stored) {
          const legacy = window.localStorage.getItem(WS_KEY_LEGACY);
          if (legacy && list.some((w) => w.id === legacy)) {
            stored = legacy;
            if (key) window.localStorage.setItem(key, legacy);
          }
          window.localStorage.removeItem(WS_KEY_LEGACY);
        }

        if (stored && !list.some((w) => w.id === stored)) {
          if (key) window.localStorage.removeItem(key);
          setActiveIdState(null);
          currentActiveWorkspaceId = null;
        } else {
          setActiveIdState(stored);
          currentActiveWorkspaceId = stored;
        }
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // 로그인 사용자가 바뀌면 목록·활성 워크스페이스를 다시 불러온다.
  useEffect(() => {
    setLoading(true);
    setWorkspaces([]);
    setActiveIdState(null);
    currentActiveWorkspaceId = null;
    refresh();
  }, [refresh, userId]);

  const setActiveId = useCallback(
    (id: string | null) => {
      if (typeof window !== "undefined") {
        const key = storageKey(userId);
        if (key) {
          if (id) window.localStorage.setItem(key, id);
          else window.localStorage.removeItem(key);
        }
        window.localStorage.removeItem(WS_KEY_LEGACY);
      }
      currentActiveWorkspaceId = id;
      setActiveIdState(id);
    },
    [userId],
  );

  const active = useMemo(
    () => workspaces.find((w) => w.id === activeId) ?? null,
    [workspaces, activeId],
  );

  const value = useMemo(
    () => ({ activeId, active, workspaces, loading, setActiveId, refresh }),
    [activeId, active, workspaces, loading, setActiveId, refresh],
  );

  return (
    <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
