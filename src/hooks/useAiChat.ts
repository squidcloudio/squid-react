import { AiHookResponse, useAiHook } from './useAiAgent';

export function useAiChat(agentId: string): AiHookResponse {
  return useAiHook(['ai_agents'], false, agentId);
}
