"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import DirectionSync from "./DirectionSync";

/** defaultTheme="system" — 신규 방문자는 OS 설정을 따른다. zeff-theme 로 저장. 클래스 전략(<html class="dark">)으로 테마 적용. */
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      storageKey="zeff-theme"
    >
      <DirectionSync />
      {children}
    </NextThemesProvider>
  );
}
