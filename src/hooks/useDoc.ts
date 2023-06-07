import { DocumentReference } from '@squidcloud/client';
import { DocumentData } from '@squidcloud/common';
import { useEffect, useState } from 'react';
import { from } from 'rxjs';
import { useObservable } from './useObservable';

export function useDoc<T extends DocumentData>(doc: DocumentReference<T>, subscribe = false): DocumentReference<T> {
  const [_, refresh] = useState<[]>([]);

  const { data } = useObservable<DocumentReference<T> | undefined>(
    subscribe ? doc.snapshots() : from(doc.snapshot()),
    undefined,
    [doc, subscribe],
  );

  useEffect(() => {
    refresh([]);
  }, [data]);

  return doc;
}
