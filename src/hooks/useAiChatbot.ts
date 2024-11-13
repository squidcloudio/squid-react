import { IntegrationId } from '@squidcloud/client';
import { AiHookResponse, useAiHook } from './useAiAgent';

export function useAiChatbot(integrationId: IntegrationId, profileId: string): AiHookResponse {
  return useAiHook([integrationId], false, profileId);
}

/**
 * Custom hook for making AI queries with a given database integration ID.
 * @deprecated - Please import from `useAiAgent`
 * @param integrationId - The unique identifier for the database integration instance.
 * @returns An object containing methods and state for AI chat interactions.
 */
export function useAiQuery(integrationId: IntegrationId): AiHookResponse {
  return useAiHook([integrationId], true);
}

/**
 * Custom hook for making AI queries with multiple database integration IDs.
 * @deprecated - Please import from `useAiAgent`
 * @param integrationIds - The unique identifiers for the database integrations.
 * @returns An object containing methods and state for AI chat interactions.
 */
export function useAiQueryMulti(integrationIds: Array<IntegrationId>): AiHookResponse {
  return useAiHook(integrationIds, true);
}
