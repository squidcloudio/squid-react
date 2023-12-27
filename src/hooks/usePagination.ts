'use client';

import { Pagination, SnapshotEmitter, PaginationOptions as SquidPaginationOptions } from '@squidcloud/client';
import { useEffect, useRef, useState } from 'react';

/**
 * Type representing the state and data of a paginated query.
 *
 * @template T - The type of the data items within the paginated data set.
 */
export type PaginationType<T> = {
  /** Indicates whether the pagination data is currently being loaded. */
  loading: boolean;
  /** An array of data items for the current page. */
  data: Array<T>;
  /** Indicates if there is a next page available. */
  hasNext: boolean;
  /** Indicates if there is a previous page available. */
  hasPrev: boolean;
  /** Function to navigate to the next page. */
  next: () => void;
  /** Function to navigate to the previous page. */
  prev: () => void;
};

type GetReturnType<T> = T extends SnapshotEmitter<infer U> ? U : never;

interface PaginationOptions extends SquidPaginationOptions {
  /**
   * Determines whether to execute the pagination query automatically. Defaults to `true`. When set to `false`,
   * executing the query will be delayed until `enabled` is set to `true`.
   */
  enabled?: boolean;
}

const DEFAULT_PAGINATION_OPTIONS: Required<Omit<PaginationOptions, keyof SquidPaginationOptions>> = {
  enabled: true,
};

/**
 * Hook that provides a simple interface for paginating data from a Squid query.
 * It returns the current pagination state including the data for the current page,
 * loading status, and functions to navigate to the next and previous pages.
 *
 * @template T - A type extending `SnapshotEmitter`, typically a Squid query.
 * @param query - The Squid query.
 * @param options - Pagination options to control the behavior of the pagination.
 * @param deps - An array of dependencies that, when changed, will reset the pagination and re-run the query.
 * @returns An object containing the current state of the pagination, including the data for the current page,
 * loading status, and functions to navigate between pages.
 */
export function usePagination<T>(
  query: T & SnapshotEmitter<any>,
  options: PaginationOptions,
  deps: ReadonlyArray<unknown> = [],
): PaginationType<GetReturnType<T>> {
  const mergedOptions = { ...DEFAULT_PAGINATION_OPTIONS, ...options };

  const pagination = useRef<Pagination<GetReturnType<T>> | null>(null);
  const [paginationState, setPaginationState] = useState<PaginationType<GetReturnType<T>>>({
    loading: true,
    data: [],
    hasNext: false,
    hasPrev: false,
    next: () => {
      return;
    },
    prev: () => {
      return;
    },
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

    const { enabled } = mergedOptions;
    if (!enabled) return;

    pagination.current = query.paginate(mergedOptions);
    const subscription = pagination.current.observeState().subscribe((state) => {
      setPaginationState({
        loading: false,
        data: state.data,
        hasNext: state.hasNext,
        hasPrev: state.hasPrev,
        next: () => {
          setLoading();
          pagination.current?.next();
        },
        prev: () => {
          setLoading();
          pagination.current?.prev();
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
  }, [JSON.stringify(deps), JSON.stringify(mergedOptions)]);

  return paginationState;
}
