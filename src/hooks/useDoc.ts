'use client';

import { DocumentReference } from '@squidcloud/client';
import { DocumentData } from '@squidcloud/common';
import { from } from 'rxjs';
import { useObservable } from './useObservable';

/**
 * Hook to get a Squid document data, loading state, and errors.
 *
 * @template T extends DocumentData
 * @param doc Squid document reference.
 * @param subscribe Whether to subscribe to document updates. Default is false.
 * @returns The document data, loading state, and errors.
 */
export type DocType<T extends DocumentData> = {
  loading: boolean;
  data: T | undefined;
  error: any;
};

export function useDoc<T extends DocumentData>(doc: DocumentReference<T>, subscribe = false): DocType<T> {
  const { loading, error, data } = useObservable<T | undefined>(
    () => (subscribe ? doc.snapshots() : from(doc.snapshot())),
    doc.peek(),
    [doc.refId, subscribe],
  );

  return { loading, error, data };
}
