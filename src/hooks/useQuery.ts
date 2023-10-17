'use client';

import { DocumentData, SnapshotEmitter } from '@squidcloud/common';
import { from } from 'rxjs';
import { useObservable } from './useObservable';

export type QueryType<T> = {
  loading: boolean;
  data: Array<T>;
  error: any;
};

type GetReturnType<T> = T extends SnapshotEmitter<infer U> ? U : never;

/**
 * Hook to get a Squid query data, loading state, and error.
 *
 * @template T
 * @param query The query object.
 * @param subscribe If true, subscribe to query snapshots. Default is false.
 * @param initialValue The initial value of the data.
 * @param deps Array of dependencies for the hook. Default is [].
 * @returns The query data, loading state, and error.
 */
export function useQuery<T extends DocumentData>(
  query: T & SnapshotEmitter<any>,
  subscribe = false,
  initialValue?: Array<GetReturnType<T>>,
  deps: ReadonlyArray<unknown> = [],
): QueryType<GetReturnType<T>> {
  const peekInitialValue = () => {
    try {
      return query.peek();
    } catch {
      return [];
    }
  };
  const { loading, error, data } = useObservable<GetReturnType<T>[]>(
    () => (subscribe ? query.snapshots() : from(query.snapshot())),
    initialValue || peekInitialValue(),
    [JSON.stringify(query.serialize()), subscribe, JSON.stringify(deps)],
  );
  return { loading, error, data };
}
