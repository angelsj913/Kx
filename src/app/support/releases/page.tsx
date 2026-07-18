import { redirect } from "next/navigation";

// 구버전 릴리스 탭 제거(#3) — 기존 URL로 들어오면 지원 홈으로 보낸다.
export default function LegacyReleasesRedirect() {
  redirect("/support");
}
