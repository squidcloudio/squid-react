import { DocumentReference } from '@squidcloud/client';
import { DocumentData } from '@squidcloud/common';
import { useEffect, useState } from 'react';
import { combineLatest } from 'rxjs';

export type DocsType<T extends DocumentData> = {
  loading: boolean;
  docs: Array<DocumentReference<T>>;
  data: Array<T | undefined>;
  error: any;
};

export function useDocs<T extends DocumentData>(docs: Array<DocumentReference<T>>, subscribe = false): DocsType<T> {
  const [loading, setLoading] = useState<boolean>(!!docs.length);
  const [data, setData] = useState<Array<T | undefined>>([]);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    setLoading(!!docs.length);

    const observables = docs.map((doc) => (subscribe ? doc.snapshots() : doc.snapshot()));

    const subscription = combineLatest(observables).subscribe({
      next: (value: Array<DocumentReference<T> | undefined>) => {
        setData(value.map((d) => d?.data));
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
  }, [docs, subscribe]);

  return { loading, error, docs, data };
}
