'use client';

import { Pagination, PaginationOptions, PaginationState, SnapshotEmitter } from '@squidcloud/common';
import { useEffect, useRef, useState } from 'react';

export type PaginationType<T> = {
  loading: boolean;
  data: Array<T>;
  hasNext: boolean;
  hasPrev: boolean;
  next: () => void;
  prev: () => void;
};

type GetReturnType<T> = T extends SnapshotEmitter<infer U> ? U : never;

export function usePagination<T>(
  query: T & SnapshotEmitter<any>,
  options: PaginationOptions,
  deps: ReadonlyArray<unknown> = [],
): PaginationType<GetReturnType<T>> {
  const pagination = useRef<Pagination<GetReturnType<T>> | null>(null);
  const [paginationState, setPaginationState] = useState<PaginationState<GetReturnType<T>> | null>(null);

  useEffect(() => {
    setPaginationState(null);

    pagination.current = query.paginate(options);
    const subscription = pagination.current.observeState().subscribe((state) => {
      setPaginationState(state);
    });

    return () => {
      const prevPagination = pagination.current;
      setTimeout(() => {
        prevPagination?.unsubscribe();
        subscription.unsubscribe();
      }, 0);
    };
  }, [JSON.stringify(deps), JSON.stringify(options)]);

  return {
    loading: !paginationState,
    data: paginationState?.data || [],
    hasNext: paginationState?.hasNext || false,
    hasPrev: paginationState?.hasPrev || false,
    next: () => pagination.current?.next(),
    prev: () => pagination.current?.prev(),
  };
}
