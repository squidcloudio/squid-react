'use client';

import { DocumentReference, QueryBuilder } from '@squidcloud/client';
import { DocumentData } from '@squidcloud/common';
import { from } from 'rxjs';
import { useObservable } from './useObservable';

export type QueryType<T extends DocumentData> = {
  loading: boolean;
  docs: Array<DocumentReference<T>>;
  data: Array<T>;
  error: any;
};

export function useQuery<T extends DocumentData>(query: QueryBuilder<T>, subscribe = false): QueryType<T> {
  const { loading, error, data } = useObservable<DocumentReference<T>[]>(
    () => (subscribe ? query.snapshots() : from(query.snapshot())),
    [],
    [query.hash, subscribe],
  );
  return { loading, error, docs: data, data: data.map((d) => d.data) };
}
