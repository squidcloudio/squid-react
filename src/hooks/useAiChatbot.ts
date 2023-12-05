'use client';

import { AiChatbotChatOptions, generateId, IntegrationId } from '@squidcloud/common';
import { assertTruthy } from 'assertic';
import { useEffect, useState } from 'react';
import { from, map, of } from 'rxjs';
import { useObservable } from './useObservable';
import { useSquid } from './useSquid';

/**
 * Represents a chat message with a unique identifier, the author type, and the message content.
 */
export type ChatMessage = {
  /** A unique identifier for the message. */
  id: string;
  /** The type of the message, indicating whether it's from the AI or the user. */
  type: 'ai' | 'user';
  /** The actual message content. */
  message: string;
};

/**
 * Interface for the response object from AI hooks that manage the state and lifecycle of AI chats.
 */
interface AiHookResponse {
  /** Function to send a new message to the chat. */
  chat: (prompt: string, options?: AiChatbotChatOptions) => void;
  /** Array containing the history of chat messages. */
  history: ChatMessage[];
  /** The latest AI response or data received. */
  data: string;
  /** Indicates whether the AI response is currently being fetched. */
  loading: boolean;
  /** Contains an error if one occurred during the last AI operation. */
  error: any;
  /** Indicates whether the AI has completed its response. */
  complete: boolean;
}

/**
 * Custom hook for making AI queries with a given database integration ID.
 * @param integrationId - The unique identifier for the database integration instance.
 * @returns An object containing methods and state for AI chat interactions.
 */
export function useAiQuery(integrationId: IntegrationId): AiHookResponse {
  return useAiHook(integrationId, true);
}

/**
 * Custom hook for interacting with an AI chatbot, scoped to a specific AI integration and profile within the integration.
 * @param integrationId - The unique identifier for the AI integration.
 * @param profileId - The identifier for the profile within the AI integration.
 * @returns An object containing methods and state for AI chat interactions.
 */
export function useAiChatbot(integrationId: IntegrationId, profileId: string): AiHookResponse {
  return useAiHook(integrationId, false, profileId);
}

function useAiHook(integrationId: string, aiQuery: boolean, profileId?: string): AiHookResponse {
  const squid = useSquid();
  assertTruthy(!aiQuery || squid.options.apiKey, 'apiKey must be defined for AI queries');
  const [question, setQuestion] = useState('');
  const [aiChatbotOptions, setAiChatbotOptions] = useState<AiChatbotChatOptions | undefined>(undefined);
  const [history, setHistory] = useState<Array<ChatMessage>>([]);

  const { data, error, loading, complete } = useObservable(
    () => {
      if (!question) return of('');
      if (aiQuery) {
        return from(squid.ai().executeAiQuery(integrationId, question)).pipe(
          map((response) => {
            return response.answer + (response.explanation ? `\n\n${response.explanation}` : '');
          }),
        );
      } else {
        assertTruthy(profileId, 'profileId must be defined');
        return squid.ai().chatbot(integrationId).profile(profileId).chat(question, aiChatbotOptions);
      }
    },
    { initialData: '' },
    [question],
  );

  useEffect(() => {
    const recentChat = history[history.length - 1];

    if (!recentChat || !data || loading) return;
    if (complete) setQuestion('');
    if (recentChat.type === 'user') {
      setHistory((prevMessages) => prevMessages.concat({ id: generateId(), type: 'ai', message: data }));
    } else {
      setHistory((prevMessages) => {
        const newMessages = [...prevMessages];
        newMessages[newMessages.length - 1].message = data;
        return newMessages;
      });
    }
  }, [data, complete, loading]);

  const chat = (prompt: string, options?: AiChatbotChatOptions) => {
    setHistory((messages) => messages.concat({ id: generateId(), type: 'user', message: prompt }));
    setAiChatbotOptions(options);
    setQuestion(prompt);
  };

  return { chat, history, data, loading, error, complete };
}
