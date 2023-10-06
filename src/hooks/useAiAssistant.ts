'use client';

import {AiAssistantChatOptions, generateId, IntegrationId} from '@squidcloud/common';
import {useEffect, useState} from 'react';
import {of} from 'rxjs';
import {useObservable} from './useObservable';
import {useSquid} from './useSquid';

export type ChatMessage = {
  id: string;
  type: 'ai' | 'user';
  message: string;
};

export function useAiAssistant(integrationId: IntegrationId, profileId: string) {
  const squid = useSquid();
  const [question, setQuestion] = useState('');
  const [aiAssistantOptions, setAiAssistantOptions] = useState<AiAssistantChatOptions | undefined>(undefined);
  const [history, setHistory] = useState<Array<ChatMessage>>([]);

  const {data, error, loading, complete} = useObservable(
    () => {
      if (!question) return of('');
      return squid.ai().assistant(integrationId).profile(profileId).chat(question, aiAssistantOptions);
    },
    '',
    [question],
  );

  useEffect(() => {
    const recentChat = history[history.length - 1];

    if (!recentChat || !data || loading) return;

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
