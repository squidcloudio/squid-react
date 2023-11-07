'use client';

import { DocumentReference } from '@squidcloud/client';
import { DocumentData } from '@squidcloud/common';
import { from } from 'rxjs';
import { useObservable } from './useObservable';

/**
 * Represents the state and data of a document request within the Squid framework.
 *
 * @template T - The type extending `DocumentData` which defines the expected shape of the document's data.
 */
export type DocType<T extends DocumentData> = {
  /** Indicates whether the document request is in progress. */
  loading: boolean;
  /** The document's data if available; `undefined` if the data is not yet fetched or if no data exists. */
  data: T | undefined;
  /** Any error that may have occurred during the document request. */
  error: any;
};

/**
 * Hook to get a Squid document data, loading state, and errors.
 *
 * @template T extends DocumentData
 * @param doc Squid document reference.
 * @param subscribe Whether to subscribe to document updates. Default is false.
 * @returns The document data, loading state, and errors.
 */
export function useDoc<T extends DocumentData>(doc: DocumentReference<T>, subscribe = false): DocType<T> {
  const { loading, error, data } = useObservable<T | undefined>(
    () => (subscribe ? doc.snapshots() : from(doc.snapshot())),
    doc.peek(),
    [doc.refId, subscribe],
  );

  return { loading, error, data };
}
