import { AiHookResponse, useAiHook } from './useAiAgent';
import { IntegrationId } from '@squidcloud/client';

export function useAiChatbot(integrationId: IntegrationId, profileId: string): AiHookResponse {
  return useAiHook([integrationId], false, profileId);
}
