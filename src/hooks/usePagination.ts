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
  const [paginationState, setPaginationState] =
    useState<PaginationType<GetReturnType<T>>>({
      loading: true,
      data: [],
      hasNext: false,
      hasPrev: false,
      next: () => { return; },
      prev: () => { return; },
    });

  function setLoading() {
    setPaginationState((prevState) => ({
      ...prevState,
      loading: true,
      hasNext: false,
      hasPrev: false,
    }));
  }

  useEffect(() => {
    setLoading();

    pagination.current = query.paginate(options);
    const subscription = pagination.current.observeState().subscribe((state) => {
      setPaginationState({
        loading: false,
        data: state.data,
        hasNext: state.hasNext,
        hasPrev: state.hasPrev,
        next: () => {
          setLoading();
          pagination.current?.next()
        },
        prev: () => {
          setLoading();
          pagination.current?.prev()
        },
      });
    });

    return () => {
      const prevPagination = pagination.current;
      setTimeout(() => {
        prevPagination?.unsubscribe();
        subscription.unsubscribe();
      }, 0);
    };
  }, [JSON.stringify(deps), JSON.stringify(options)]);

  return paginationState;
}
