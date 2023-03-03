import { DocumentReference, QueryBuilder } from '@squidcloud/client';
import { DocumentData } from '@squidcloud/common';
import { useEffect, useState } from 'react';
import { Subscription } from 'rxjs';

export function useQuery<T extends DocumentData>(
  query: QueryBuilder<T>,
  subscribe = false,
): Array<DocumentReference<T>> {
  const [docs, setDocs] = useState<Array<DocumentReference<T>>>([]);

  useEffect(() => {
    let subscription: Subscription;

    if (subscribe) {
      subscription = query.snapshots().subscribe((docs) => {
        setDocs(docs);
      });
    } else {
      query.snapshot().then((docs) => {
        setDocs(docs);
      });
    }

    return () => {
      subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.hash, subscribe]);

  return docs;
}
