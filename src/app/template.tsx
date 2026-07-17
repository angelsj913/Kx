/**
 * 라우트 전환마다 리마운트되며 page-enter 페이드를 재생한다 — 홈 ↔ 로그인 ↔
 * 워크스페이스 이동이 뚝 끊기는 대신 짧은 페이드로 이어진다. 순수 CSS라
 * 번들 비용이 없고, prefers-reduced-motion 사용자에게는 재생되지 않는다.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-transition">{children}</div>;
}
