import { DocumentReference, QueryBuilder } from '@squidcloud/client';
import { DocumentData } from '@squidcloud/common';
import { from } from 'rxjs';
import { useObservable } from './useObservable';

export function useQuery<T extends DocumentData>(
  query: QueryBuilder<T>,
  subscribe = false,
): Array<DocumentReference<T>> {
  const { data } = useObservable<DocumentReference<T>[]>(
    subscribe ? query.snapshots() : from(query.snapshot()),
    [],
    [query.hash, subscribe],
  );
  return data;
}
