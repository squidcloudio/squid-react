'use client';

import {
  AI_STATUS_MESSAGE_PARENT_MESSAGE_ID_TAG,
  AI_STATUS_MESSAGE_RESULT_TAG,
  AiAgentId,
  AiAskOptionsWithVoice,
  AiChatOptions,
  AiChatOptionsWithoutVoice,
  AiStatusMessage,
  AskWithVoiceResponse,
  AiQueryOptions,
  generateUUID,
  IntegrationId,
  JobId,
  TranscribeAndAskWithVoiceResponse,
  TranscribeAndChatResponse,
  AiAgentClientOptions,
} from '@squidcloud/client';
import { assertTruthy } from 'assertic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { from, map, mergeMap, of, tap } from 'rxjs';
import { useObservable } from './useObservable';
import { useSquid } from './useSquid';

type ChatMessageType = 'ai' | 'user';

interface BaseChatMessage {
  id: string;
  type: ChatMessageType;
  message: string;
  jobId: JobId | undefined;
}

/**
 * Generates a unique ID for chat messages and jobs.
 * Uses crypto.randomUUID() if available, otherwise falls back to a simple random string.
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export interface AiChatMessage extends BaseChatMessage {
  type: 'ai';
  voiceFile?: File;
}

export interface UserChatMessage extends BaseChatMessage {
  type: 'user';
}

export type ChatMessage = AiChatMessage | UserChatMessage;

/**
 * Custom API options for the AI agent.
 */
export interface CustomApiOptions {
  /**
   * A custom API endpoint that expects:
   *   `POST { prompt: string, jobId?: JobId }`
   * and returns:
   *   `{ response?: string }` or `{ error: string }`
   */
  customApiUrl?: string;

  /**
   * An optional record of custom headers to send with the request.
   */
  customApiHeaders?: Record<string, string>;

  /**
   * An optional agent ID to use for this request.
   */
  agentId?: AiAgentId;
}

// noinspection JSUnusedGlobalSymbols
/**
 * Custom hook for handling prompts to an AI agent.
 * @param agentId
 * @param options - default options for all interactions with the agent in the current session.
 */
export function useAiAgent(agentId: AiAgentId, options?: AiChatOptions, chatOptions?: AiAgentClientOptions): AiHookResponse {
  return useAiHook('ai_agents', false, agentId, false, undefined, false, undefined, undefined, options, chatOptions);
}

// noinspection JSUnusedGlobalSymbols
/**
 * Custom hook for making AI queries with a given database integration ID.
 * @param integrationId - The unique identifier for the database integration instance.
 * @param options - Optional configurations for the AI query.
 * @returns An object containing methods and state for AI chat interactions.
 */
export function useAiQuery(integrationId: IntegrationId, options?: AiQueryOptions): AiHookResponse {
  return useAiHook(integrationId, true, undefined, undefined, undefined, undefined, options);
}

// noinspection JSUnusedGlobalSymbols
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
  return useAiHook(integrationId, true, undefined, true, allowedApiEndpoints, provideExplanationApiWithAi);
}

export interface AiHookResponse {
  /**
   * Method to initiate a chat with the AI.
   * @param prompt - The input prompt to send to the AI.
   * @param options - Optional configurations for the chat.
   */
  chat: (prompt: string, options?: AiChatOptions, jobId?: JobId) => void;

  /**
   * Method to transcribe an audio file and then chat with the AI.
   * @param fileToTranscribe - The audio file to transcribe.
   * @param options - Optional configurations for the chat.
   */
  transcribeAndChat: (fileToTranscribe: File, options?: AiChatOptions, jobId?: JobId) => void;

  /**
   * Method to initiate a chat with the AI and receive a voice response.
   * @param prompt - The input prompt to send to the AI.
   * @param options - Optional configurations for the chat.
   */
  chatWithVoiceResponse: (prompt: string, options?: Omit<AiChatOptions, 'smoothTyping'>, jobId?: JobId) => void;

  /**
   * Method to transcribe an audio file, chat with the AI, and receive a voice response.
   * @param fileToTranscribe - The audio file to transcribe.
   * @param options - Optional configurations for the chat.
   */
  transcribeAndChatWithVoiceResponse: (
    fileToTranscribe: File,
    options?: Omit<AiChatOptions, 'smoothTyping'>,
    jobId?: JobId,
  ) => void;

  /**
   * History of chat messages.
   */
  history: ChatMessage[];

  /** A map of job IDs with their status updates. */
  statusUpdates: Record<JobId, Array<AiStatusMessage>>;

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
 * 4. Chat transcription or chat with a local agent (default path).
 *
 * @param integrationId - An integration IDs to use in the hook.
 * @param aiQuery - True if this is an AI query.
 * @param agentId - Required if both aiQuery and apiIntegration are false.
 * @param apiIntegration - True if the integration passed in is an API integration.
 * @param allowedApiEndpoints - For an API integration, optional list of allowed endpoints.
 * @param provideExplanationApiWithAi - For an API integration, set to true for an explanation.
 * @param aiQueryOptions - Options for the AI query (may include `customApiUrl`, `customApiKey`).
 * @param customApiOptions - Optional custom API options for the AI agent, such as `customApiUrl`, `customApiJobId`, and `customApiHeaders`.
 * @param aiAgentChatOptions - Optional chat options for the AI agent. Used by default for all chat() calls.
 * @param agentClientOptions - Optional agent client options including apiKey.
 */
export function useAiHook(
  integrationId: IntegrationId | undefined,
  aiQuery: boolean,
  agentId?: string,
  apiIntegration = false,
  allowedApiEndpoints?: string[],
  provideExplanationApiWithAi?: boolean,
  aiQueryOptions?: AiQueryOptions,
  customApiOptions?: CustomApiOptions,
  aiAgentChatOptions?: AiChatOptions,
  agentClientOptions?: AiAgentClientOptions,
): AiHookResponse {
  const squid = useSquid();
  // If it's an AI query or API integration, we rely on the Squid API key.
  assertTruthy(!aiQuery || squid.options.apiKey, 'apiKey must be defined for AI queries (via Squid)');

  const [file, setFile] = useState<File | null>(null);
  const [requestCount, setRequestCount] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [jobId, setJobId] = useState<JobId | undefined>(undefined);
  const [options, setOptions] = useState<AiChatOptions | undefined>(aiAgentChatOptions);
  const [history, setHistory] = useState<Array<ChatMessage>>([]);
  const [statusUpdates, setStatusUpdates] = useState<Record<JobId, Array<AiStatusMessage>>>({});

  // Memoizes memoryId to prevent unnecessary useEffect triggers when the 'options' object reference changes.
  const memoryId = useMemo(() => options?.memoryOptions?.memoryId, [options?.memoryOptions?.memoryId]);

  /**
   * Loads chat history from Squid when memoryId is present.
   * History is completely replaced when memoryId changes between chat calls.
   * Only triggers when squid, agentId, or memoryId values actually change.
   */
  useEffect(() => {
    if (memoryId) {
      squid
        .ai()
        .agent(agentId)
        .getChatHistory(memoryId)
        .then(chatHistory => {
          const history = chatHistory.map(item => {
            return {
              id: item.id,
              type: item.source,
              message: item.message,
              jobId: undefined,
            };
          });
          setHistory(history);
        });
    }
  }, [squid, agentId, memoryId]);

  const statusUpdateObsFun = () => {
    return squid
      .ai()
      .agent(agentId, agentClientOptions)
      .observeStatusUpdates()
      .pipe(
        map((statusUpdate) => {
          setStatusUpdates((prev) => {
            if (!prev[statusUpdate.jobId]) {
              return prev;
            }
            const prevCopy = { ...prev };
            const prevStatusUpdates = prevCopy[statusUpdate.jobId];

            const aiResponse = statusUpdate.tags?.[AI_STATUS_MESSAGE_RESULT_TAG];
            if (aiResponse) {
              const parentMessageId = statusUpdate.tags?.[AI_STATUS_MESSAGE_PARENT_MESSAGE_ID_TAG];
              const parentStatus = parentMessageId
                ? prevStatusUpdates.find((s) => s.messageId === parentMessageId)
                : undefined;
              if (parentStatus) {
                parentStatus.tags = { ...(parentStatus.tags || {}), result: aiResponse };
                return prevCopy;
              }
            }

            prevStatusUpdates.push(statusUpdate);
            return prevCopy;
          });
        }),
      );
  };

  useObservable<void>(statusUpdateObsFun, undefined, []);

  const setJobIdAndInitialStatusUpdate = (jobId: JobId | undefined) => {
    setJobId(jobId);
    if (!jobId) {
      return;
    }
    setStatusUpdates((prev) => {
      const prevCopy = { ...prev };
      prevCopy[jobId] = [];
      return prevCopy;
    });
  };

  const { data, error, loading, complete } = useObservable<string>(
    () => {
      /**
       * 1) Check if we have a customApiUrl in aiQueryOptions. If so, do a manual fetch.
       */
      if (customApiOptions?.customApiUrl) {
        if (!prompt) return of('');
        return from(
          fetch(customApiOptions.customApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-squid-clientid': squid.connectionDetails().clientId,
              ...(customApiOptions.customApiHeaders || {}),
            },
            body: JSON.stringify({ prompt, jobId }),
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
              return res.text();
            })
            .then(async (aiResponse) => {
              let answer: string | undefined;
              if (!aiResponse) {
                assertTruthy(jobId, 'jobId must be defined when using customApiUrl');
                answer = await squid.job().awaitJob<string>(jobId);
              } else {
                // The API is expected to return { response: string } or { error: string }
                const json = JSON.parse(aiResponse);
                answer = json?.response;
              }
              const finalAnswer = answer ?? '';
              setHistory((prev) => [...prev, { id: generateUUID(), type: 'ai', message: finalAnswer, jobId }]);
              return finalAnswer;
            }),
        );
      }

      /**
       * 2) If it's an API integration, run that path.
       */
      if (apiIntegration) {
        if (!prompt) return of('');
        assertTruthy(integrationId, 'Must provide an API integration ID.');
        return from(
          squid.ai().executeAiApiCall(integrationId, prompt, allowedApiEndpoints, provideExplanationApiWithAi),
        ).pipe(
          map((response) => {
            let result = `### Result\n\n${response.answer}`;
            if (response.explanation) {
              result += `\n\n### Walkthrough\n\n${response.explanation}`;
            }
            setHistory((prev) => [...prev, { id: generateUUID(), type: 'ai', message: result, jobId }]);
            return result;
          }),
        );
      }

      /**
       * 3) AI Query path.
       */
      if (aiQuery) {
        if (!prompt) return of('');
        assertTruthy(integrationId, 'Must provide a Database integration ID.');
        return from(squid.ai().executeAiQuery(integrationId, prompt, aiQueryOptions)).pipe(
          map((response) => {
            assertTruthy(response.success, response.answer);
            let result = `### Result\n\n${response.answer}`;
            if (response.executedQuery) {
              const prefix = '### Executed Query';
              result += `\n\n${prefix}\n\n\`\`\`${response.queryMarkdownType || 'sql'}\n${
                response.executedQuery
              }\n\`\`\``;
              if (response.rawResultsUrl) {
                result += `\n[View Raw Results](${response.rawResultsUrl})\n\n`;
              }
            }
            if (response.explanation) {
              result += `\n\n### Walkthrough\n\n${response.explanation}`;
            }
            setHistory((prev) => [...prev, { id: generateUUID(), type: 'ai', message: result, jobId }]);
            return result;
          }),
        );
      }

      /**
       * 4) Default path: local chat usage with an agent.
       */
      assertTruthy(agentId, 'agentId must be defined for chat usage');

      // (a) Transcribe + Voice Response
      if (file) {
        if (options?.voiceOptions) {
          return from(
            squid
              .ai()
              .agent(agentId, agentClientOptions)
              .transcribeAndAskWithVoiceResponse(file, options as AiAskOptionsWithVoice<any>, jobId),
          ).pipe(
            map((response: TranscribeAndAskWithVoiceResponse) => {
              setHistory((prev) => [
                ...prev,
                { id: generateUUID(), type: 'user', message: response.transcribedPrompt, voiceFile: file, jobId },
                {
                  id: generateUUID(),
                  type: 'ai',
                  message: response.responseString,
                  voiceFile: response.voiceResponseFile,
                  jobId,
                },
              ]);
              return response.responseString;
            }),
          );
        } else {
          // (b) Transcribe plus Chat streaming.
          const userMessageId = generateUUID();
          const aiMessageId = generateUUID();
          return from(
            squid
              .ai()
              .agent(agentId, agentClientOptions)
              .transcribeAndChat(file, options as AiChatOptionsWithoutVoice, jobId),
          ).pipe(
            mergeMap((response: TranscribeAndChatResponse) => {
              setHistory((prev) => {
                const prevCopy = [...prev];
                const prevIndex = prevCopy.findIndex((item) => item.id === userMessageId);
                if (prevIndex >= 0) {
                  return prevCopy;
                }
                prevCopy.push({ id: userMessageId, type: 'user', message: response.transcribedPrompt, jobId });
                return prevCopy;
              });
              return response.responseStream;
            }),
            tap((response) => {
              setHistory((prev) => {
                const prevCopy = [...prev];
                const prevIndex = prevCopy.findIndex((item) => item.id === aiMessageId);
                if (prevIndex >= 0) {
                  prevCopy[prevIndex] = { id: aiMessageId, type: 'ai', message: response, jobId };
                  return prevCopy;
                }
                prevCopy.push({ id: aiMessageId, type: 'ai', message: response, jobId });
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
          return from(
            squid
              .ai()
              .agent(agentId, agentClientOptions)
              .askWithVoiceResponse(prompt, options as AiAskOptionsWithVoice<any>, jobId),
          ).pipe(
            map((response: AskWithVoiceResponse) => {
              setHistory((prev) => [
                ...prev,
                { id: generateUUID(), type: 'user', message: prompt, jobId },
                {
                  id: generateUUID(),
                  type: 'ai',
                  message: response.responseString,
                  voiceFile: response.voiceResponseFile,
                  jobId,
                },
              ]);
              return response.responseString;
            }),
          );
        } else {
          // (d) Plain text chat streaming
          const id = generateUUID();
          return squid
            .ai()
            .agent(agentId, agentClientOptions)
            .chat(prompt, options as AiChatOptionsWithoutVoice, jobId)
            .pipe(
              tap((response) => {
                setHistory((prev) => {
                  const prevCopy = [...prev];
                  const prevIndex = prevCopy.findIndex((item) => item.id === id);
                  if (prevIndex >= 0) {
                    prevCopy[prevIndex] = { id, type: 'ai', message: response, jobId };
                    return prevCopy;
                  }
                  prevCopy.push({ id, type: 'ai', message: response, jobId });
                  return prevCopy;
                });
              }),
            );
        }
      }
      return of('');
    },
    { initialData: '' },
    [file, prompt, requestCount],
  );

  // Clean up local states after completion
  useEffect(() => {
    if (complete) {
      setFile(null);
      setPrompt('');
      setJobIdAndInitialStatusUpdate(undefined);
    }
  }, [complete]);

  /**
   * Merges chat options safely without causing unnecessary re-renders.
   * Combines default aiAgentChatOptions with new options, where new options take precedence.
   * Returns the same reference when inputs haven't changed to prevent useEffect dependencies from triggering.
   */
  const mergeOptions = useCallback((newOptions?: AiChatOptions) => {
    if (!newOptions) return aiAgentChatOptions;
    if (!aiAgentChatOptions) return newOptions;
    return { ...aiAgentChatOptions, ...newOptions };
  }, [aiAgentChatOptions]);

  /**
   * Methods exposed to the user of the hook.
   */
  const chat = (newPrompt: string, chatOptions?: AiChatOptions, jobId?: JobId) => {
    jobId = jobId || generateUUID();
    setJobIdAndInitialStatusUpdate(jobId);
    setPrompt(newPrompt);
    setOptions(mergeOptions(chatOptions));
    setHistory((prev) => [...prev, { id: generateUUID(), type: 'user', message: newPrompt, jobId }]);
    setRequestCount((count) => count + 1);
  };

  const transcribeAndChat = (fileToTranscribe: File, transcribeOptions?: AiChatOptions, jobId?: JobId) => {
    jobId = jobId || generateUUID();
    setJobIdAndInitialStatusUpdate(jobId);
    setFile(fileToTranscribe);
    setOptions(mergeOptions(transcribeOptions));
    setRequestCount((count) => count + 1);
  };

  const chatWithVoiceResponse = (
    newPrompt: string,
    voiceOptions?: Omit<AiChatOptions, 'smoothTyping'>,
    jobId?: JobId,
  ) => {
    jobId = jobId || generateUUID();
    setJobIdAndInitialStatusUpdate(jobId);
    setPrompt(newPrompt);
    setOptions(mergeOptions(voiceOptions));
    setHistory((prev) => [...prev, { id: generateUUID(), type: 'user', message: newPrompt, jobId }]);
    setRequestCount((count) => count + 1);
  };

  const transcribeAndChatWithVoiceResponse = (
    fileToTranscribe: File,
    voiceOptions?: Omit<AiChatOptions, 'smoothTyping'>,
    jobId?: JobId,
  ) => {
    jobId = jobId || generateUUID();
    setJobIdAndInitialStatusUpdate(jobId);
    setFile(fileToTranscribe);
    setOptions(mergeOptions(voiceOptions));
    setRequestCount((count) => count + 1);
  };

  return {
    chat,
    transcribeAndChat,
    chatWithVoiceResponse,
    transcribeAndChatWithVoiceResponse,
    history,
    statusUpdates,
    data,
    loading,
    error,
    complete,
  };
}

// noinspection JSUnusedGlobalSymbols
/**
 * A convenient hook for simply passing a prompt to a custom API endpoint
 * that expects a JSON body `{ prompt: string }` and can return `{ response: string }`
 * or an error in `{ error: string }`.
 *
 * You can optionally provide an `apiKey` if needed by your endpoint.
 *
 * @param options - The custom API options.
 * @returns {AiHookResponse}
 */
export function useAskWithApi(options: CustomApiOptions): AiHookResponse {
  return useAiHook(
    undefined, // No integration IDs needed for a custom API
    false, // Not an AI query on databases
    options.agentId,
    false, // Not a Squid-based API integration
    undefined, // No allowed endpoints needed
    undefined, // No explanation needed
    undefined, // No AI query options needed
    options,
  );
}
