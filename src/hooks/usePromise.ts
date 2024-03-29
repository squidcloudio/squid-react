'use client';

import { useEffect, useMemo, useState } from 'react';
import { ObservableOptions } from './useObservable';

/**
 * Type representing the state of an asynchronous operation provided by a promise.
 *
 * @template T - The type of the data that the promise will resolve with.
 */
export type PromiseType<T = any> = {
  /** Indicates whether the promise is currently being resolved. */
  loading: boolean;
  /** The data resolved by the promise, if any. */
  data: T;
  /** Any error that may have been thrown during the promise resolution. */
  error: any;
};

export type PromiseOptions<T> = {
  /**
   * Determines whether to execute the promise automatically. Defaults to `true`. When set to `false`, executing the
   * promise will be delayed until `enabled` is set to `true`.
   */
  enabled?: boolean;
  /** The initial state for the data before the promise resolves. Defaults to `null`. */
  initialData?: T;
};

const DEFAULT_PROMISE_OPTIONS: Required<ObservableOptions<null>> = {
  enabled: true,
  initialData: null,
};

/**
 * Hook that provides state management for asynchronous operations, representing the loading state,
 * the resolved data, and any error that may occur. It is particularly useful for handling promises,
 * such as data fetching operations.
 *
 * @template T - The expected type of the data to be resolved by the promise.
 * @param promiseFn - A function that returns a promise, which resolves to the data of type `T`.
 * @param options - Options to control the behavior of the promise.
 * @param deps - An array of dependencies that, when changed, will trigger the promise function to be called again.
 * @returns An object containing the current state of the asynchronous operation: the loading status, the resolved data, and any error.
 */
export function usePromise<T>(
  promiseFn: () => Promise<T>,
  options: PromiseOptions<T> & { initialData: T },
  deps?: ReadonlyArray<unknown>,
): PromiseType<T>;
export function usePromise<T>(
  promiseFn: () => Promise<T>,
  options?: PromiseOptions<T>,
  deps?: ReadonlyArray<unknown>,
): PromiseType<T | null>;
export function usePromise<T>(
  promiseFn: () => Promise<T>,
  options: PromiseOptions<T> = {},
  deps: ReadonlyArray<unknown> = [],
): PromiseType<T | null> {
  const mergedOptions = { ...DEFAULT_PROMISE_OPTIONS, ...options };

  const [state, setState] = useState<PromiseType<T | null>>({
    loading: true,
    data: mergedOptions.initialData,
    error: null,
  });

  const promiseFnMemo = useMemo(() => promiseFn, [JSON.stringify(deps), mergedOptions.enabled]);

  useEffect(() => {
    // Set loading state to true when the observable changes
    if (!state.loading) {
      setState((prevState) => ({
        ...prevState,
        loading: true,
      }));
    }

    const { enabled } = mergedOptions;
    if (!enabled) return;

    let isSubscribed = true;
    promiseFnMemo()
      .then((value: T) => {
        if (isSubscribed) {
          setState({
            loading: false,
            data: value,
            error: null,
          });
        }
      })
      .catch((error) => {
        if (isSubscribed) {
          setState((prevState) => ({
            ...prevState,
            loading: false,
            error,
          }));
        }
      });

    // Prevent setting state if unmounted
    return () => {
      isSubscribed = false;
    };
  }, [promiseFnMemo]);

  return state;
}
