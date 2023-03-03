import { DocumentReference } from '@squidcloud/client';
import { DocumentData } from '@squidcloud/common';
import { useEffect, useRef, useState } from 'react';
import { Subscription } from 'rxjs';

const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

export function useDocs<T extends DocumentData>(
  docs: Array<DocumentReference<T>>,
  subscribe = false,
): Array<DocumentReference<T>> {
  const prevDocs = usePrevious<Array<DocumentReference<T>>>(docs);
  const subscriptions = useRef<Map<DocumentReference<T>, Subscription>>(new Map());
  const [_, refresh] = useState<[]>([]);

  useEffect(() => {
    const docsAdded = docs.filter((x) => prevDocs?.indexOf(x) === -1);
    const docsRemoved = prevDocs?.filter((x) => docs.indexOf(x) === -1) || [];

    docsRemoved.forEach((doc) => {
      const subscription = subscriptions.current.get(doc);
      subscription?.unsubscribe();
      subscriptions.current.delete(doc);
    });

    if (subscribe) {
      docsAdded.forEach((doc) => {
        const subscription = doc.snapshots().subscribe(() => {
          refresh([]);
        });
        subscriptions.current.set(doc, subscription);
      });
    } else {
      Promise.all(docsAdded.map((doc) => doc.snapshot())).then(() => {
        refresh([]);
      });
    }
  }, [docs, prevDocs, subscribe]);

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      for (const [_, subscription] of subscriptions.current) {
        subscription.unsubscribe();
      }
    };
  }, []);

  return docs;
}
