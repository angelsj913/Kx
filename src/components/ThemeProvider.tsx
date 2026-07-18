"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import DirectionSync from "./DirectionSync";

/** 초기 진입은 라이트. 클래스 전략(<html class="dark">)으로 랜딩/공개 페이지에만 다크가 적용된다. */
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange={false}
      storageKey="zeff-theme"
    >
      <DirectionSync />
      {children}
    </NextThemesProvider>
  );
}
