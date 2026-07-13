"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { setAppLanguage, type AppLanguage } from "./i18n";

export interface UserSettings {
  plan: "free" | "pro" | "professional";
  language: AppLanguage;
  enabledQuickTools: string[];
}

async function fetchSettings(): Promise<UserSettings> {
  const res = await fetch("/api/settings");
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "설정을 불러오지 못했습니다.");
  return data.settings;
}

/**
 * 사용자별 설정. `userId` 가 바뀌면(다른 계정 로그인) 다시 불러온다.
 * 인자 생략 시 현재 세션의 user.id 를 쓴다.
 */
export function useSettings(userId?: string | null) {
  const { data: session } = useSession();
  const resolvedUserId =
    userId !== undefined ? userId : (session?.user?.id ?? null);

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    if (!resolvedUserId) {
      setSettings(null);
      setLoading(false);
      return () => {
        ignore = true;
      };
    }

    setLoading(true);
    setSettings(null); // 이전 사용자 설정이 잠깐이라도 보이지 않게
    (async () => {
      try {
        const s = await fetchSettings();
        if (!ignore) {
          setSettings(s);
          setAppLanguage(s.language); // 서버 값이 진실 소스 — 로컬 캐시를 덮어씀
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [resolvedUserId]);

  const patch = useCallback(async (body: Partial<UserSettings>) => {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? "설정을 저장하지 못했습니다.");
    setSettings(data.settings);
    return data.settings as UserSettings;
  }, []);

  /** 언어 탭의 [변경] 버튼에서만 호출 — 서버 반영 성공 후에만 전역 언어가 실제로 바뀐다. */
  const updateLanguage = useCallback(
    async (lang: AppLanguage) => {
      const updated = await patch({ language: lang });
      setAppLanguage(updated.language);
    },
    [patch]
  );

  const updatePlan = useCallback(
    (plan: UserSettings["plan"]) => patch({ plan }),
    [patch]
  );

  const updateQuickTools = useCallback(
    (enabledQuickTools: string[]) => patch({ enabledQuickTools }),
    [patch]
  );

  return { settings, loading, updateLanguage, updatePlan, updateQuickTools };
}
