import { DocumentData, Pagination, PaginationState } from '@squidcloud/common';
import { DocumentReference, QueryBuilder } from '@squidcloud/client';
import { useEffect, useRef, useState } from 'react';

export type PaginationType<T extends DocumentData> = {
  loading: boolean;
  docs: Array<DocumentReference<T>>;
  data: Array<T>;
  hasNext: boolean;
  hasPrev: boolean;
  next: () => void;
  prev: () => void;
};

export function usePagination<T extends DocumentData>(
  query: QueryBuilder<T>,
  subscribe?: boolean,
  pageSize?: number,
): PaginationType<T> {
  const pagination = useRef<Pagination<DocumentReference<T>> | null>(null);
  const [paginationState, setPaginationState] = useState<PaginationState<DocumentReference<T>>>({
    isLoading: true,
    data: [],
    hasNext: false,
    hasPrev: false,
  });

  useEffect(() => {
    setPaginationState((prevState) => ({
      ...prevState,
      isLoading: true,
      hasNext: false,
      hasPrev: false,
    }));

    pagination.current = query.paginate({ subscribe, pageSize });
    let subscription = pagination.current.observeState().subscribe(setPaginationState);

    return () => {
      const prevPagination = pagination.current;
      setTimeout(() => {
        prevPagination?.unsubscribe();
        subscription.unsubscribe();
      }, 0);
    };
  }, [query.hash, subscribe, pageSize]);

  const { isLoading, data, hasNext, hasPrev } = paginationState;

  return {
    loading: isLoading,
    docs: data,
    data: data.map((d) => d.data),
    hasNext,
    hasPrev,
    next: () => !isLoading && pagination.current?.next(),
    prev: () => !isLoading && pagination.current?.prev(),
  };
}
