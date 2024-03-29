'use client';

import { DocumentData, DocumentReference } from '@squidcloud/client';
import { useEffect, useState } from 'react';
import { combineLatest } from 'rxjs';
import { DEFAULT_DOC_OPTIONS, DocOptions } from './useDoc';

/**
 * Represents the state and collection of document data returned from a query within the Squid framework.
 *
 * @template T - The type extending `DocumentData` which defines the expected shape of each document's data in the array.
 */
export type DocsType<T extends DocumentData> = {
  /** Indicates whether the document data collection request is in progress. */
  loading: boolean;
  /** An array of document data, where each item is either the document's data or `undefined` if the data is not yet fetched or if no data exists for that item. */
  data: Array<T | undefined>;
  /** Any error that may have occurred during the document data collection request. */
  error: any;
};

/**
 * Hook to get multiple Squid documents data, loading state, and errors.
 *
 * @template T extends DocumentData
 * @param docs Array of Squid document references.
 * @param options Options to control the behavior of the of the document queries.
 * @returns The documents data, loading state, and errors.
 */
export function useDocs<T extends DocumentData>(docs: Array<DocumentReference<T>>, options?: DocOptions): DocsType<T> {
  const [loading, setLoading] = useState<boolean>(!!docs.length);
  const [data, setData] = useState<Array<T | undefined>>(docs.map((d) => d.peek()));
  const [error, setError] = useState<any>(null);

  const mergedOptions = { ...DEFAULT_DOC_OPTIONS, ...options };

  useEffect(() => {
    setLoading(!!docs.length);

    const { enabled, subscribe } = mergedOptions;
    if (!enabled) return;

    const observables = docs.map((doc) => (subscribe ? doc.snapshots() : doc.snapshot()));

    const subscription = combineLatest(observables).subscribe({
      next: (value: Array<T | undefined>) => {
        setData(value);
        setLoading(false);
      },
      error: (err) => {
        setError(err);
        setLoading(false);
      },
    });

    return () => {
      setTimeout(() => subscription.unsubscribe(), 0);
    };
  }, [JSON.stringify(docs.map((d) => d.refId)), JSON.stringify(mergedOptions)]);

  return { loading, error, data };
}
