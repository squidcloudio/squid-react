'use client';

import { DocumentReference } from '@squidcloud/client';
import { DocumentData } from '@squidcloud/common';
import { useEffect, useState } from 'react';
import { combineLatest } from 'rxjs';

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
 * @param subscribe Whether to subscribe to documents updates. Default is false.
 * @returns The documents data, loading state, and errors.
 */
export function useDocs<T extends DocumentData>(docs: Array<DocumentReference<T>>, subscribe = false): DocsType<T> {
  const [loading, setLoading] = useState<boolean>(!!docs.length);
  const [data, setData] = useState<Array<T | undefined>>(docs.map((d) => d.peek()));
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    setLoading(!!docs.length);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(docs.map((d) => d.refId)), subscribe]);

  return { loading, error, data };
}
