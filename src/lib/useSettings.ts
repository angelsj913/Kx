import { useCallback, useEffect, useState } from "react";
import { setLanguage as setLocalLanguage, type Language } from "@/lib/i18n";

export interface UserSettingsState {
  plan: "free" | "pro" | "professional";
  language: Language;
  enabledQuickTools: Record<string, boolean> | null;
}

const DEFAULT_STATE: UserSettingsState = { plan: "free", language: "ko", enabledQuickTools: null };

/** UserSettings(요금제/언어/퀵툴 on-off)를 불러오고 갱신하는 훅.
 * 언어는 로컬(i18n 스토어)에 즉시 반영 + 서버에도 저장해 다음 로그인에도 유지된다. */
export function useSettings() {
  const [settings, setSettings] = useState<UserSettingsState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (!ignore && res.ok) {
          setSettings({
            plan: data.plan ?? "free",
            language: data.language === "en" ? "en" : "ko",
            enabledQuickTools: data.enabledQuickTools ?? null,
          });
          if (data.language === "en" || data.language === "ko") setLocalLanguage(data.language);
        }
      } catch {
        /* 설정 로딩 실패는 기본값으로 조용히 무시 */
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const updateLanguage = useCallback(async (lang: Language) => {
    setLocalLanguage(lang);
    setSettings((prev) => ({ ...prev, language: lang }));
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: lang }),
    });
  }, []);

  const updateQuickTools = useCallback(async (map: Record<string, boolean>) => {
    setSettings((prev) => ({ ...prev, enabledQuickTools: map }));
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabledQuickTools: map }),
    });
  }, []);

  return { ...settings, loading, updateLanguage, updateQuickTools };
}
