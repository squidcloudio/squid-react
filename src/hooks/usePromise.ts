'use client';

import { useEffect, useMemo, useState } from 'react';

/**
 * Type representing the state of an asynchronous operation provided by a promise.
 *
 * @template T - The type of the data that the promise will resolve with.
 */
export type PromiseType<T = any> = {
  /** Indicates whether the promise is currently being resolved. */
  loading: boolean;
  /** The data resolved by the promise, if any. */
  data: T | null;
  /** Any error that may have been thrown during the promise resolution. */
  error: any;
};

/**
 * Hook that provides state management for asynchronous operations, representing the loading state,
 * the resolved data, and any error that may occur. It is particularly useful for handling promises,
 * such as data fetching operations.
 *
 * @template T - The expected type of the data to be resolved by the promise.
 * @param promiseFn - A function that returns a promise, which resolves to the data of type `T`.
 * @param initialValue - The initial state for the data before the promise resolves.
 * @param deps - An array of dependencies that, when changed, will trigger the promise function to be called again.
 * @returns An object containing the current state of the asynchronous operation: the loading status, the resolved data, and any error.
 */
export function usePromise<T>(
  promiseFn: () => Promise<T>,
  initialValue: T,
  deps?: ReadonlyArray<unknown>,
): PromiseType<T>;
export function usePromise<T>(
  promiseFn: () => Promise<T>,
  initialValue?: T,
  deps?: ReadonlyArray<unknown>,
): PromiseType<T | null>;
export function usePromise<T>(
  promiseFn: () => Promise<T>,
  initialValue?: T,
  deps: ReadonlyArray<unknown> = [],
): PromiseType<T | null> {
  const [state, setState] = useState<PromiseType<T>>({
    loading: true,
    data: initialValue !== undefined ? initialValue : null,
    error: null,
  });

  const promiseFnMemo = useMemo(() => promiseFn, deps);

  useEffect(() => {
    let isSubscribed = true;
    // Set loading state to true when the observable changes
    if (!state.loading) {
      setState((prevState) => ({
        ...prevState,
        loading: true,
      }));
    }
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
