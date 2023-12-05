'use client';

import { DocumentData, SnapshotEmitter } from '@squidcloud/common';
import { from } from 'rxjs';
import { useObservable } from './useObservable';

/**
 * Type representing the state of a Squid query operation.
 *
 * @template T - The type of the data items that the query will return.
 */
export type QueryType<T> = {
  /** Indicates whether the query is currently being resolved. */
  loading: boolean;
  /** The data items returned by the query. */
  data: Array<T>;
  /** Any error that may have occurred during the query execution. */
  error: any;
};

type GetReturnType<T> = T extends SnapshotEmitter<infer U> ? U : never;

export type QueryOptions<T> = {
  /**
   * Determines whether the query runs automatically. Defaults to `true`. When set to `false`, executing the query will
   * be delayed until `enabled` is set to `true`.
   */
  enabled?: boolean;

  /**
   * Determines whether to continuously subscribe to query updates. If `false`, a single snapshot will be fetched.
   * Defaults to `true`
   */
  subscribe?: boolean;

  /**
   * An optional array of initial data items to be used before the query resolves for the first time. If a parent query
   * is active, this defaults to data currently available the client. Otherwise, the default is an empty array.
   */
  initialData?: Array<GetReturnType<T>>;
};

const DefaultQueryOptions: Required<QueryOptions<null>> = {
  enabled: true,
  subscribe: true,
  initialData: [],
};

/**
 * Hook that provides state management for Squid queries, giving access to the data items,
 * the loading status, and any errors encountered during the query execution. It can subscribe to
 * continuous data updates or fetch a single snapshot depending on the subscription parameter.
 *
 * @template T - The expected type of the individual data items returned by the query.
 * @param query - The Squid query.
 * @param options - Options to control the behavior of the query.
 * @param deps - An array of dependencies that, when changed, will cause the hook to resubscribe to the query updates.
 * @returns An object containing the current state of the query operation: the loading status, the array of data items, and any error.
 */
export function useQuery<T extends DocumentData>(
  query: T & SnapshotEmitter<any>,
  options: QueryOptions<T> = {},
  deps: ReadonlyArray<unknown> = [],
): QueryType<GetReturnType<T>> {
  const mergedOptions = { ...DefaultQueryOptions, ...options };

  const peekInitialValue = () => {
    try {
      return query.peek();
    } catch {
      return [];
    }
  };

  const { enabled, subscribe, initialData } = mergedOptions;

  const { loading, error, data } = useObservable<GetReturnType<T>[]>(
    () => (subscribe ? query.snapshots() : from(query.snapshot())),
    { enabled, initialData: initialData || peekInitialValue() },
    [JSON.stringify(query.serialize()), subscribe, JSON.stringify(deps)],
  );
  return { loading, error, data };
}
