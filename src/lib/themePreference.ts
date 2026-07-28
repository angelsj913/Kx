"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

export type ThemePreference = "system" | "light" | "dark";

export const THEME_PREFERENCES: ThemePreference[] = ["system", "light", "dark"];

const emptySubscribe = () => () => {};

function normalizeTheme(theme: string | undefined): ThemePreference {
  if (theme === "system" || theme === "light" || theme === "dark") return theme;
  return "system";
}

/** next-themes `setTheme` wrapper — single source for system / light / dark. */
export function useThemePreference() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const preference = normalizeTheme(theme);

  return {
    mounted,
    preference,
    resolvedTheme,
    setThemePreference: (next: ThemePreference) => setTheme(next),
    toggleLightDark: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
  };
}
