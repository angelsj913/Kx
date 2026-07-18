"use client";

import { useEffect, useState } from "react";

/**
 * 데스크탑(Electron) 클라이언트에서 실행 중인지 판별한다.
 * Electron 셸이 로드 전에 `zeff_client=desktop` 쿠키를 심어 두므로, 웹에서는
 * 이 쿠키가 없다. 서버 렌더 시에는 알 수 없어 초깃값 false로 두고, 마운트 후 갱신한다
 * (하이드레이션 불일치 방지).
 */
export function useIsDesktopClient(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const hit = document.cookie
      .split(";")
      .some((c) => c.trim() === "zeff_client=desktop");
    setIsDesktop(hit);
  }, []);
  return isDesktop;
}
