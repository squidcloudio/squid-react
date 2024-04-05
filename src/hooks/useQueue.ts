'use client';

import { QueueManager } from '@squidcloud/client';
import { useCallback } from 'react';
import { useObservable } from './useObservable';

/**
 * Type representing the state of a Squid queue.
 *
 * @template T - The type of the data that the queue will return.
 */
export type QueueType<T> = {
  /** The most recent message consumed by the queue. */
  data: T | null;
  /** Any error that may have occurred during while consuming messages. */
  error: any;
  /** A wrapper around queue.produce. */
  produce: (messages: Array<T>) => Promise<void>;
};

export type QueueOptions = {
  /**
   * Determines whether the queue beings consuming automatically. Defaults to `true`. When set to `false`, consuming
   * messages will be paused until `enabled` is set to `true`.
   */
  enabled?: boolean;
};

const DEFAULT_QUEUE_OPTIONS: Required<QueueOptions> = {
  enabled: true,
};

export function useQueue<T>(
  queue: QueueManager<T>,
  options: QueueOptions = {},
  deps: ReadonlyArray<unknown> = [],
): QueueType<T> {
  const mergedOptions = { ...DEFAULT_QUEUE_OPTIONS, ...options };

  const produce = useCallback(
    async (messages: any[]): Promise<void> => {
      await queue.produce(messages);
    },
    [JSON.stringify(deps)],
  );

  const { enabled } = mergedOptions;

  const { error, data } = useObservable<T>(() => queue.consume(), { enabled }, [JSON.stringify(deps)]);

  return { error, data, produce };
}

export default useQueue;
