'use client';

import {AiAssistantChatOptions, generateId, IntegrationId} from '@squidcloud/common';
import {useEffect, useState} from 'react';
import {from, map, of} from 'rxjs';
import {useObservable} from './useObservable';
import {useSquid} from './useSquid';
import {assertTruthy} from 'assertic';

export type ChatMessage = {
  id: string;
  type: 'ai' | 'user';
  message: string;
};

interface AiHookResponse {
  chat: (prompt: string, options?: AiAssistantChatOptions) => void;
  history: ChatMessage[];
  data: string;
  loading: boolean;
  error: any;
  complete: boolean;
}

export function useAiQuery(integrationId: IntegrationId): AiHookResponse {
  return useAiHook(integrationId, true);
}

export function useAiAssistant(integrationId: IntegrationId, profileId: string): AiHookResponse {
  return useAiHook(integrationId, false, profileId);
}

function useAiHook(integrationId: string, aiQuery: boolean, profileId?: string): AiHookResponse {
  const squid = useSquid();
  assertTruthy(!aiQuery || squid.options.apiKey, 'apiKey must be defined for AI queries')
  const [question, setQuestion] = useState('');
  const [aiAssistantOptions, setAiAssistantOptions] = useState<AiAssistantChatOptions | undefined>(undefined);
  const [history, setHistory] = useState<Array<ChatMessage>>([]);

  const {data, error, loading, complete} = useObservable(
    () => {
      if (!question) return of('');
      if (aiQuery) {
        return from(squid.ai().executeAiQuery(integrationId, question)).pipe(map((response) => response.answer));
      } else {
        assertTruthy(profileId, 'profileId must be defined');
        return squid.ai().assistant(integrationId).profile(profileId).chat(question, aiAssistantOptions);
      }
    },
    '',
    [question],
  );

  useEffect(() => {
    const recentChat = history[history.length - 1];

    if (!recentChat || !data || loading) return;
    if (complete) setQuestion('');
    if (recentChat.type === 'user') {
      setHistory((prevMessages) => prevMessages.concat({id: generateId(), type: 'ai', message: data}));
    } else {
      setHistory((prevMessages) => {
        const newMessages = [...prevMessages];
        newMessages[newMessages.length - 1].message = data;
        return newMessages;
      });

    }
  }, [data, complete, loading]);

  const chat = (prompt: string, options?: AiAssistantChatOptions) => {
    setHistory((messages) => messages.concat({id: generateId(), type: 'user', message: prompt}));
    setAiAssistantOptions(options);
    setQuestion(prompt);
  };

  return {chat, history, data, loading, error, complete};
}
