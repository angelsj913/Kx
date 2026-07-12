"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// 팀 워크스페이스 클라이언트 계층 — 활성 워크스페이스를 localStorage에 보관하고,
// 모든 데이터 요청에 X-Workspace-Id 헤더를 실어 보낸다(개인 스코프면 헤더 없음).

export interface WorkspaceSummary {
  id: string;
  name: string;
  role: "owner" | "admin" | "member";
  memberCount: number;
}

const WS_KEY = "kx.activeWorkspace";

export function getActiveWorkspaceId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(WS_KEY) || null;
}

/** 활성 워크스페이스 헤더를 자동으로 붙이는 fetch 래퍼. */
export function wsFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const id = getActiveWorkspaceId();
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
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [activeId, setActiveIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/workspaces");
      const data = await res.json();
      if (res.ok) {
        const list: WorkspaceSummary[] = data.workspaces ?? [];
        setWorkspaces(list);
        // localStorage의 활성 워크스페이스를 검증해 반영한다.
        // 더 이상 멤버가 아니면 개인 스코프로 되돌린다.
        const stored = getActiveWorkspaceId();
        if (stored && !list.some((w) => w.id === stored)) {
          window.localStorage.removeItem(WS_KEY);
          setActiveIdState(null);
        } else {
          setActiveIdState(stored);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setActiveId = useCallback((id: string | null) => {
    if (typeof window !== "undefined") {
      if (id) window.localStorage.setItem(WS_KEY, id);
      else window.localStorage.removeItem(WS_KEY);
    }
    setActiveIdState(id);
  }, []);

  const active = useMemo(
    () => workspaces.find((w) => w.id === activeId) ?? null,
    [workspaces, activeId],
  );

  const value = useMemo(
    () => ({ activeId, active, workspaces, loading, setActiveId, refresh }),
    [activeId, active, workspaces, loading, setActiveId, refresh],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
