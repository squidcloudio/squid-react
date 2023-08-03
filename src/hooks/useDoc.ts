'use client';

import { DocumentReference } from '@squidcloud/client';
import { DocumentData } from '@squidcloud/common';
import { from } from 'rxjs';
import { useObservable } from './useObservable';

export type DocType<T extends DocumentData> = {
  loading: boolean;
  doc: DocumentReference<T>;
  data: T | undefined;
  error: any;
};

export function useDoc<T extends DocumentData>(doc: DocumentReference<T>, subscribe = false): DocType<T> {
  const { loading, error, data } = useObservable<DocumentReference<T> | undefined>(
    () => (subscribe ? doc.snapshots() : from(doc.snapshot())),
    doc,
    [doc.refId, subscribe],
  );

  return { loading, error, doc, data: data?.hasData ? data.data : undefined };
}
