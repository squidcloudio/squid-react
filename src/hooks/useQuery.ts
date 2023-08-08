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

export function useQuery<T extends DocumentData>(
  query: T & SnapshotEmitter<any>,
  subscribe = false,
  initialValue?: Array<GetReturnType<T>>,
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
    [JSON.stringify(query.serialize()), subscribe],
  );
  return { loading, error, data };
}
