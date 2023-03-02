import { DocumentReference } from '@squidcloud/client';
import { DocumentData } from '@squidcloud/common';
import { useEffect, useState } from 'react';
import { Subscription } from 'rxjs';

export function useDoc<T extends DocumentData>(doc: DocumentReference<T>, subscribe = false): T {
  const [_, refresh] = useState<[]>([]);

  useEffect(() => {
    let subscription: Subscription;

    if (subscribe) {
      subscription = doc.snapshots().subscribe(() => {
        refresh([]);
      });
    } else {
      doc.snapshot().then(() => {
        refresh([]);
      });
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, [doc, subscribe]);

  return doc.data();
}
