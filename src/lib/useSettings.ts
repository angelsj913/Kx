"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { setAppLanguage, type AppLanguage } from "./i18n";
import { getLanguage, hasStoredLanguage } from "./languageStore";
import { LANGUAGE_ORDER } from "./languages";

export interface UserSettings {
  plan: "free" | "pro" | "professional";
  language: AppLanguage;
  enabledQuickTools: string[];
  aiDisabled?: boolean;
}

function normalizeLanguage(raw: unknown): AppLanguage {
  if (typeof raw === "string" && (LANGUAGE_ORDER as string[]).includes(raw)) {
    return raw as AppLanguage;
  }
  return "ko";
}

async function fetchSettings(): Promise<UserSettings> {
  const res = await fetch("/api/settings");
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "설정을 불러오지 못했습니다.");
  const s = data.settings;
  return {
    ...s,
    language: normalizeLanguage(s?.language),
  } as UserSettings;
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
  const [loading, setLoading] = useState(() => !!resolvedUserId);

  const patch = useCallback(async (body: Partial<UserSettings>) => {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? "설정을 저장하지 못했습니다.");
    const next = {
      ...data.settings,
      language: normalizeLanguage(data.settings?.language),
    } as UserSettings;
    setSettings(next);
    return next;
  }, []);

  useEffect(() => {
    let ignore = false;

    if (!resolvedUserId) {
      // 동기 setState 회피: 마이크로태스크로 미룸
      void Promise.resolve().then(() => {
        if (ignore) return;
        setSettings(null);
        setLoading(false);
      });
      return () => {
        ignore = true;
      };
    }

    void (async () => {
      try {
        const s = await fetchSettings();
        if (!ignore) {
          setSettings(s);
          // 언어 우선순위(#11): 사용자가 직접 고른 로컬 선택이 항상 이긴다.
          // - 로컬에 명시적 선택이 없으면(신규 기기/최초 로그인) 서버 값을 적용.
          // - 로컬 선택이 서버와 다르면 로컬을 유지하고 서버를 로컬에 맞춘다(재발 방지).
          if (!hasStoredLanguage()) {
            setAppLanguage(s.language);
          } else if (getLanguage() !== s.language) {
            void patch({ language: getLanguage() }).catch(() => {});
          }
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [resolvedUserId, patch]);

  const updateLanguage = useCallback(
    async (lang: AppLanguage) => {
      const updated = await patch({ language: lang });
      setAppLanguage(updated.language);
    },
    [patch],
  );

  const updatePlan = useCallback(
    (plan: UserSettings["plan"]) => patch({ plan }),
    [patch],
  );

  const updateQuickTools = useCallback(
    (enabledQuickTools: string[]) => patch({ enabledQuickTools }),
    [patch],
  );

  return { settings, loading, updateLanguage, updatePlan, updateQuickTools };
}
