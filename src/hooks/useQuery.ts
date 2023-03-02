import { DocumentReference, QueryBuilder } from '@squidcloud/client';
import { DocumentData } from '@squidcloud/common';
import { useEffect, useState } from 'react';
import { Subscription } from 'rxjs';

/**
 *
 */
export function useQuery<T extends DocumentData>(
  query: QueryBuilder<T>,
  subscribe = false,
): {
  docs: Array<DocumentReference<T>>;
  data: Array<T>;
} {
  const [docs, setDocs] = useState<Array<DocumentReference<T>>>([]);
  const [data, setData] = useState<Array<T>>([]);

  useEffect(() => {
    let subscription: Subscription;

    if (subscribe) {
      subscription = query.snapshots().subscribe((docs) => {
        setDocs(docs);
        setData(docs.map((d) => d.data()));
      });
    } else {
      query.snapshot().then((docs) => {
        setDocs(docs);
        setData(docs.map((d) => d.data()));
      });
    }

    return () => {
      subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.hash, subscribe]);

  return { data, docs };
}
