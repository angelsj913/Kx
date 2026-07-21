/**
 * 강제 도구 모드 — 클라이언트가 quickToolId=agent 로 호출할 때 사용.
 * 실제 루프는 toolOrchestration 과 공유한다. (+) 메뉴에는 더 이상 노출하지 않는다.
 */
export {
  runToolOrchestration as runAgentRoute,
  type OrchestrationResult as AgentRouteResult,
} from "@/lib/toolOrchestration";
