'use client';

import { generateId, IntegrationId } from '@squidcloud/common';
import { useEffect, useState } from 'react';
import { of } from 'rxjs';
import { useObservable } from './useObservable';
import { useSquid } from './useSquid';

export type ChatMessage = {
  id: string;
  type: 'ai' | 'user';
  message: string;
};

export function useAiAssistant(integrationId: IntegrationId, profileId: string) {
  const squid = useSquid();
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState<Array<ChatMessage>>([]);

  const { data, error, loading, complete } = useObservable(
    () => {
      if (!question) return of('');
      return squid.ai().assistant(integrationId).profile(profileId).chat(question);
    },
    '',
    [question],
  );

  useEffect(() => {
    const recentChat = history[history.length - 1];

    if (!recentChat || !data) return;

    if (recentChat.type === 'user') {
      setHistory((prevMessages) => prevMessages.concat({ id: generateId(), type: 'ai', message: data }));
    } else {
      setHistory((prevMessages) => {
        const newMessages = [...prevMessages];
        newMessages[newMessages.length - 1].message = data;
        return newMessages;
      });
    }
  }, [data, complete]);

  const chat = (prompt: string) => {
    setQuestion(prompt);
    setHistory((messages) => messages.concat({ id: generateId(), type: 'user', message: prompt }));
  };

  return { chat, history, data, loading, error, complete };
}
