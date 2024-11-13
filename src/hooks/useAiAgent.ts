'use client';

import {
  AiAgentId,
  AiChatbotChatOptions,
  AskWithVoiceResponse,
  generateId,
  IntegrationId,
  TranscribeAndAskWithVoiceResponse,
  TranscribeAndChatResponse,
} from '@squidcloud/client';
import { assertTruthy } from 'assertic';
import { useEffect, useState } from 'react';
import { from, map, mergeMap, of, tap } from 'rxjs';
import { useObservable } from './useObservable';
import { useSquid } from './useSquid';

export type ChatMessage = {
  id: string;
  type: 'ai' | 'user';
  message: string;
  voiceFile?: File;
};

/**
 * Custom hook for handling prompts to an AI agent.
 * @param agentId
 */
export function useAiAgent(agentId: AiAgentId): AiHookResponse {
  return useAiHook(['ai_agents'], false, agentId);
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
 * Custom hook for making AI queries with a given API integration ID.
 * @param integrationId - The unique identifier for the API integration instance.
 * @param allowedApiEndpoints - Optional list of allowed endpoints the AI can use. If undefined, all endpoints can be used.
 * @param provideExplanationApiWithAi - Set to true to get an explanation of what the AI did. This will increase the AI takes to respond.
 */
export function useAiOnApi(
  integrationId: IntegrationId,
  allowedApiEndpoints?: string[],
  provideExplanationApiWithAi?: boolean,
): AiHookResponse {
  return useAiHook([integrationId], true, undefined, true, allowedApiEndpoints, provideExplanationApiWithAi);
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

export interface AiHookResponse {
  /**
   * Method to initiate a chat with the AI.
   * @param {string} prompt - The input prompt to send to the AI.
   * @param {AiChatbotChatOptions} [options] - Optional configurations for the chat.
   */
  chat: (prompt: string, options?: AiChatbotChatOptions) => void;

  /**
   * Method to transcribe an audio file and then chat with the AI.
   * @param {File} fileToTranscribe - The audio file to transcribe.
   * @param {AiChatbotChatOptions} [options] - Optional configurations for the chat.
   */
  transcribeAndChat: (fileToTranscribe: File, options?: AiChatbotChatOptions) => void;

  /**
   * Method to initiate a chat with the AI and receive a voice response.
   * @param {string} prompt - The input prompt to send to the AI.
   * @param {Omit<AiChatbotChatOptions, 'smoothTyping'>} [options] - Optional configurations for the chat.
   */
  chatWithVoiceResponse: (prompt: string, options?: Omit<AiChatbotChatOptions, 'smoothTyping'>) => void;

  /**
   * Method to transcribe an audio file, chat with the AI, and receive a voice response.
   * @param {File} fileToTranscribe - The audio file to transcribe.
   * @param {Omit<AiChatbotChatOptions, 'smoothTyping'>} [options] - Optional configurations for the chat.
   */
  transcribeAndChatWithVoiceResponse: (
    fileToTranscribe: File,
    options?: Omit<AiChatbotChatOptions, 'smoothTyping'>,
  ) => void;

  /**
   * History of chat messages.
   */
  history: ChatMessage[];

  /**
   * Data received from the AI response.
   */
  data: string;

  /**
   * Loading state indicating whether an operation is in progress.
   */
  loading: boolean;

  /**
   * Error encountered during an operation, if any.
   */
  error: any;

  /**
   * Indicates whether the current operation is complete.
   */
  complete: boolean;
}

/**
 *
 * @param integrationIds - List of integration ids to use in the hook
 * @param aiQuery - True if this is an AI query
 * @param profileId - Required if both aiQuery and apiIntegration params are false. ID of the profile.
 * @param apiIntegration - True if the integration passed in is an API integration (aiQuery is true)
 * @param allowedApiEndpoints - For an API integration, optional list of allowed endpoints (if not provided, then all endpoints can be used)
 * @param provideExplanationApiWithAi - For an API integration, set to true for an explanation of the steps the AI took
 */
export function useAiHook(
  integrationIds: Array<IntegrationId>,
  aiQuery: boolean,
  profileId?: string,
  apiIntegration = false,
  allowedApiEndpoints?: string[],
  provideExplanationApiWithAi?: boolean,
): AiHookResponse {
  const squid = useSquid();
  assertTruthy(!aiQuery || squid.options.apiKey, 'apiKey must be defined for AI queries');
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [options, setOptions] = useState<AiChatbotChatOptions | undefined>(undefined);
  const [history, setHistory] = useState<Array<ChatMessage>>([]);

  const { data, error, loading, complete } = useObservable(
    () => {
      if (apiIntegration) {
        assertTruthy(integrationIds.length === 1, 'Must provide exactly one api integration.');
        return from(
          squid.ai().executeAiApiCall(integrationIds[0], prompt, allowedApiEndpoints, provideExplanationApiWithAi),
        ).pipe(
          map((response) => {
            let result = `### Result\n\n${response.answer}`;
            if (response.explanation) {
              result += `\n\n### Walkthrough\n\n${response.explanation}`;
            }
            setHistory((prev) => [...prev, { id: generateId(), type: 'ai', message: result }]);
            return result;
          }),
        );
      }
      if (aiQuery) {
        if (!prompt) return of('');
        return from(squid.ai().executeAiQueryMulti(integrationIds, prompt)).pipe(
          map((response) => {
            let result = `### Result\n\n${response.answer}`;
            const numOfExecutesQueries = response.executedQueries.length;
            if (numOfExecutesQueries) {
              for (let i = 0; i < response.executedQueries.length; i++) {
                const executedQuery = response.executedQueries[i];
                if (numOfExecutesQueries > 1 && i === 0) {
                  result += `\n\n### Executed Queries\n\n`;
                }
                const prefix = numOfExecutesQueries > 1 ? `#### Query ${i + 1}` : '### Executed Query';
                result += `\n\n${prefix}\n\n\`\`\`${executedQuery.markdownType || 'sql'}\n${
                  executedQuery.query
                }\n\`\`\``;
              }
            }
            if (response.explanation) {
              result += `\n\n### Walkthrough\n\n${response.explanation}`;
            }

            setHistory((prev) => [...prev, { id: generateId(), type: 'ai', message: result }]);
            return result;
          }),
        );
      }

      assertTruthy(profileId, 'profileId must be defined');
      const integrationId = integrationIds[0];
      if (file) {
        if (options?.voiceOptions) {
          return from(
            squid.ai().chatbot(integrationId).profile(profileId).transcribeAndAskWithVoiceResponse(file, options),
          ).pipe(
            map((response: TranscribeAndAskWithVoiceResponse) => {
              setHistory((prev) => [
                ...prev,
                { id: generateId(), type: 'user', message: response.transcribedPrompt, voiceFile: file },
                {
                  id: generateId(),
                  type: 'ai',
                  message: response.responseString,
                  voiceFile: response.voiceResponseFile,
                },
              ]);
              return response.responseString;
            }),
          );
        } else {
          const userMessageId = generateId();
          const aiMessageId = generateId();

          return from(squid.ai().chatbot(integrationId).profile(profileId).transcribeAndChat(file, options)).pipe(
            mergeMap((response: TranscribeAndChatResponse) => {
              setHistory((prev) => {
                const prevCopy = [...prev];
                const prevIndex = prevCopy.findIndex((item) => item.id === userMessageId);
                if (prevIndex >= 0) {
                  return prevCopy;
                }
                prevCopy.push({ id: userMessageId, type: 'user', message: response.transcribedPrompt });
                return prevCopy;
              });

              return response.responseStream;
            }),
            tap((response) => {
              setHistory((prev) => {
                const prevCopy = [...prev];
                const prevIndex = prevCopy.findIndex((item) => item.id === aiMessageId);
                if (prevIndex >= 0) {
                  prevCopy[prevIndex] = { id: aiMessageId, type: 'ai', message: response };
                  return prevCopy;
                }
                prevCopy.push({ id: aiMessageId, type: 'ai', message: response });
                return prevCopy;
              });
              return response;
            }),
          );
        }
      } else if (prompt) {
        if (options?.voiceOptions) {
          return from(squid.ai().chatbot(integrationId).profile(profileId).askWithVoiceResponse(prompt, options)).pipe(
            map((response: AskWithVoiceResponse) => {
              setHistory((prev) => [
                ...prev,
                { id: generateId(), type: 'user', message: prompt },
                {
                  id: generateId(),
                  type: 'ai',
                  message: response.responseString,
                  voiceFile: response.voiceResponseFile,
                },
              ]);
              return response.responseString;
            }),
          );
        } else {
          const id = generateId();
          return squid
            .ai()
            .chatbot(integrationId)
            .profile(profileId)
            .chat(prompt, options)
            .pipe(
              tap((response) => {
                setHistory((prev) => {
                  const prevCopy = [...prev];
                  // Update the prev with the same id if exists else create a new one
                  const prevIndex = prevCopy.findIndex((item) => item.id === id);
                  if (prevIndex >= 0) {
                    prevCopy[prevIndex] = { id, type: 'ai', message: response };
                    return prevCopy;
                  }
                  prevCopy.push({ id, type: 'ai', message: response });
                  return prevCopy;
                });
              }),
            );
        }
      }
      return of('');
    },
    { initialData: '' },
    [file, prompt],
  );

  useEffect(() => {
    if (complete) {
      setFile(null);
      setPrompt('');
    }
  }, [complete]);

  const chat = (newPrompt: string, chatOptions?: AiChatbotChatOptions) => {
    setPrompt(newPrompt);
    setOptions(chatOptions);
    setHistory((prev) => [...prev, { id: generateId(), type: 'user', message: newPrompt }]);
  };

  const transcribeAndChat = (fileToTranscribe: File, transcribeOptions?: AiChatbotChatOptions) => {
    setFile(fileToTranscribe);
    setOptions(transcribeOptions);
  };

  const chatWithVoiceResponse = (newPrompt: string, options?: Omit<AiChatbotChatOptions, 'smoothTyping'>) => {
    setPrompt(newPrompt);
    setOptions(options);
    setHistory((prev) => [...prev, { id: generateId(), type: 'user', message: newPrompt }]);
  };

  const transcribeAndChatWithVoiceResponse = (
    fileToTranscribe: File,
    options?: Omit<AiChatbotChatOptions, 'smoothTyping'>,
  ) => {
    setFile(fileToTranscribe);
    setOptions(options);
  };

  return {
    chat,
    transcribeAndChat,
    chatWithVoiceResponse,
    transcribeAndChatWithVoiceResponse,
    history,
    data,
    loading,
    error,
    complete,
  };
}
