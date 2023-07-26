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

export function usePagination<T>(
  query: SnapshotEmitter<T>,
  options: PaginationOptions,
  deps: ReadonlyArray<unknown> = [],
): PaginationType<T> {
  const pagination = useRef<Pagination<T> | null>(null);
  const [paginationState, setPaginationState] = useState<PaginationState<T>>({
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

    pagination.current = query.paginate(options);
    let subscription = pagination.current.observeState().subscribe((state) => {
      if (!state.isLoading) {
        setPaginationState(state);
      } else {
        setPaginationState((prevState) => ({
          ...state,
          data: prevState.data,
        }));
      }
    });

    return () => {
      const prevPagination = pagination.current;
      setTimeout(() => {
        prevPagination?.unsubscribe();
        subscription.unsubscribe();
      }, 0);
    };
  }, [JSON.stringify(deps), JSON.stringify(options)]);

  const { isLoading, data, hasNext, hasPrev } = paginationState;

  return {
    loading: isLoading,
    data,
    hasNext,
    hasPrev,
    next: () => !isLoading && pagination.current?.next(),
    prev: () => !isLoading && pagination.current?.prev(),
  };
}
