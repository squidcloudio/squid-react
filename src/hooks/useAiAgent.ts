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
import { ExecuteAiQueryOptions } from '@squidcloud/client/dist/typescript-client/src/ai.types';
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
 * Extend the original ExecuteAiQueryOptions to include customApiUrl and customApiKey
 * for the useAskWithApi scenario.
 */
export interface ExtendedExecuteAiQueryOptions extends ExecuteAiQueryOptions {
  /**
   * A custom API endpoint that expects:
   *   POST { prompt: string }
   * and returns:
   *   { response: string } or { error: string }
   */
  customApiUrl?: string;

  /**
   * An optional apiKey you would like to send in the request header.
   */
  customApiKey?: string;
}

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
 * @param options - Optional configurations for the AI query.
 * @returns An object containing methods and state for AI chat interactions.
 */
export function useAiQuery(integrationId: IntegrationId, options?: ExecuteAiQueryOptions): AiHookResponse {
  return useAiHook([integrationId], true, undefined, undefined, undefined, undefined, options);
}

/**
 * Custom hook for making AI queries with a given API integration ID.
 * @param integrationId - The unique identifier for the API integration instance.
 * @param allowedApiEndpoints - Optional list of allowed endpoints the AI can use. If undefined, all endpoints can be used.
 * @param provideExplanationApiWithAi - Set to true to get an explanation of what the AI did. This will increase the response time.
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
 * @param options - Optional configurations for the AI query.
 * @returns An object containing methods and state for AI chat interactions.
 */
export function useAiQueryMulti(integrationIds: Array<IntegrationId>, options?: ExecuteAiQueryOptions): AiHookResponse {
  return useAiHook(integrationIds, true, undefined, undefined, undefined, undefined, options);
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
 * The core hook that handles different AI interaction paths:
 *
 * 1. Custom API (using customApiUrl/customApiKey).
 * 2. API Integration (when `apiIntegration` is true).
 * 3. AI Query (when `aiQuery` is true).
 * 4. Chatbot transcription or chat with a local agent (default path).
 *
 * @param integrationIds - List of integration IDs to use in the hook.
 * @param aiQuery - True if this is an AI query.
 * @param profileId - Required if both aiQuery and apiIntegration are false.
 * @param apiIntegration - True if the integration passed in is an API integration.
 * @param allowedApiEndpoints - For an API integration, optional list of allowed endpoints.
 * @param provideExplanationApiWithAi - For an API integration, set to true for an explanation.
 * @param aiQueryOptions - Options for the AI query (may include `customApiUrl`, `customApiKey`).
 */
export function useAiHook(
  integrationIds: Array<IntegrationId>,
  aiQuery: boolean,
  profileId?: string,
  apiIntegration = false,
  allowedApiEndpoints?: string[],
  provideExplanationApiWithAi?: boolean,
  aiQueryOptions?: ExtendedExecuteAiQueryOptions,
): AiHookResponse {
  const squid = useSquid();
  // If it's an AI query or API integration, we rely on the Squid API key.
  assertTruthy(!aiQuery || squid.options.apiKey, 'apiKey must be defined for AI queries (via Squid)');

  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [options, setOptions] = useState<AiChatbotChatOptions | undefined>(undefined);
  const [history, setHistory] = useState<Array<ChatMessage>>([]);

  const { data, error, loading, complete } = useObservable(
    () => {
      /**
       * 1) Check if we have a customApiUrl in aiQueryOptions. If so, do a manual fetch.
       */
      if (aiQueryOptions?.customApiUrl) {
        if (!prompt) return of('');
        return from(
          fetch(aiQueryOptions.customApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(aiQueryOptions.customApiKey
                ? { Authorization: `Bearer ${aiQueryOptions.customApiKey}` }
                : {}),
            },
            body: JSON.stringify({ prompt }),
          })
            .then(async (res) => {
              // Handle non-200 responses
              if (!res.ok) {
                let errorMessage = `${res.status} - ${res.statusText}`;
                try {
                  const errorJson = await res.json();
                  if (errorJson?.error) {
                    errorMessage = errorJson.error;
                  }
                } catch (err) {
                  // If we cannot parse JSON, ignore
                }
                throw new Error(errorMessage);
              }
              return res.json();
            })
            .then((json) => {
              // The API is expected to return { response: string } or { error: string }
              const answer = json?.response ?? '';
              setHistory((prev) => [...prev, { id: generateId(), type: 'ai', message: answer }]);
              return answer;
            }),
        );
      }

      /**
       * 2) If it's an API integration, run that path.
       */
      if (apiIntegration) {
        if (!prompt) return of('');
        assertTruthy(integrationIds.length === 1, 'Must provide exactly one API integration.');
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

      /**
       * 3) AI Query path.
       */
      if (aiQuery) {
        if (!prompt) return of('');
        return from(squid.ai().executeAiQueryMulti(integrationIds, prompt, aiQueryOptions)).pipe(
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
                result += `\n\n${prefix}\n\n\`\`\`${executedQuery.markdownType || 'sql'}\n${executedQuery.query}\n\`\`\``;
                if (executedQuery.rawResultsUrl) {
                  result += `\n[View Raw Results](${executedQuery.rawResultsUrl})\n\n`;
                }
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

      /**
       * 4) Default path: local Chatbot usage with a profile.
       */
      assertTruthy(profileId, 'profileId must be defined for chatbot usage');
      const integrationId = integrationIds[0];

      // (a) Transcribe + Voice Response
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
          // (b) Transcribe + Chat streaming
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
      }
      // (c) Text + Voice Response
      else if (prompt) {
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
          // (d) Plain text chat streaming
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

  // Clean up local states after completion
  useEffect(() => {
    if (complete) {
      setFile(null);
      setPrompt('');
    }
  }, [complete]);

  /**
   * Methods exposed to the user of the hook.
   */
  const chat = (newPrompt: string, chatOptions?: AiChatbotChatOptions) => {
    setPrompt(newPrompt);
    setOptions(chatOptions);
    setHistory((prev) => [...prev, { id: generateId(), type: 'user', message: newPrompt }]);
  };

  const transcribeAndChat = (fileToTranscribe: File, transcribeOptions?: AiChatbotChatOptions) => {
    setFile(fileToTranscribe);
    setOptions(transcribeOptions);
  };

  const chatWithVoiceResponse = (newPrompt: string, voiceOptions?: Omit<AiChatbotChatOptions, 'smoothTyping'>) => {
    setPrompt(newPrompt);
    setOptions(voiceOptions);
    setHistory((prev) => [...prev, { id: generateId(), type: 'user', message: newPrompt }]);
  };

  const transcribeAndChatWithVoiceResponse = (
    fileToTranscribe: File,
    voiceOptions?: Omit<AiChatbotChatOptions, 'smoothTyping'>,
  ) => {
    setFile(fileToTranscribe);
    setOptions(voiceOptions);
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

/**
 * Optional parameters for `useAskWithApi`.
 */
interface UseAskWithApiOptions {
  /**
   * If your custom API requires an auth token, you can pass it here.
   */
  apiKey?: string;
}

/**
 * A convenient hook for simply passing a prompt to a custom API endpoint
 * that expects a JSON body `{ prompt: string }` and can return `{ response: string }`
 * or an error in `{ error: string }`.
 *
 * You can optionally provide an `apiKey` if needed by your endpoint.
 *
 * @param apiUrl - The endpoint to which the POST request will be sent.
 * @param options - Additional options (e.g. an apiKey).
 * @returns {AiHookResponse}
 */
export function useAskWithApi(apiUrl: string, options?: UseAskWithApiOptions): AiHookResponse {
  return useAiHook(
    [], // No integration IDs needed for a custom API
    false, // Not an AI query on databases
    undefined, // No profile ID needed
    false, // Not a Squid-based API integration
    undefined, // No allowed endpoints needed
    undefined, // No explanation needed
    {
      customApiUrl: apiUrl,
      customApiKey: options?.apiKey, // Pass along the apiKey if provided
    },
  );
}
