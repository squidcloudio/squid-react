import { IntegrationId } from '@squidcloud/client';
import { AiHookResponse, useAiHook } from './useAiAgent';

export function useAiChatbot(integrationId: IntegrationId, profileId: string): AiHookResponse {
  return useAiHook([integrationId], false, profileId);
}
