import type { Provider, ModelDef } from "@/lib/models";
import { compatAgentTurn, type OAIToolMessage, type AgentTurnResult } from "@/lib/openaiCompat";
import { filterCandidatesByAvailableKeys, type AttemptInfo } from "@/lib/ai";
import { markProviderHealthy, noteProviderFailure } from "@/lib/providerHealth";

/** agentRoute.ts / security/agentRoute.ts가 공유하는 "후보 모델 순회하며 툴 턴 1회 성공시키기". */
export async function agentTurnWithFallback(opts: {
  messages: OAIToolMessage[];
  tools: Parameters<typeof compatAgentTurn>[0]["tools"];
  candidates: ModelDef[];
  signal?: AbortSignal;
  onAttempt?: (info: AttemptInfo) => void;
  noKeyErrorMessage: string;
  allFailedErrorMessage: string;
}): Promise<AgentTurnResult & { attempts: number }> {
  const candidates = filterCandidatesByAvailableKeys(opts.candidates);
  if (candidates.length === 0) {
    throw new Error(opts.noKeyErrorMessage);
  }
  let attempt = 0;
  let lastErr: unknown = null;
  for (const m of candidates) {
    if (opts.signal?.aborted) break;
    attempt++;
    opts.onAttempt?.({ provider: m.provider, model: m.model, attemptNumber: attempt });
    try {
      const result = await compatAgentTurn({
        provider: m.provider as Exclude<Provider, "gemini">,
        model: m.model,
        messages: opts.messages,
        tools: opts.tools,
        signal: opts.signal,
      });
      markProviderHealthy(m.provider as Provider);
      return { ...result, attempts: attempt };
    } catch (err) {
      lastErr = err;
      noteProviderFailure(m.provider as Provider, err);
    }
  }
  throw lastErr ?? new Error(opts.allFailedErrorMessage);
}
