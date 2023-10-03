'use client';

import { useEffect, useMemo, useState } from 'react';
import { Observable } from 'rxjs';

export type ObservableType<T> = {
  loading: boolean;
  data: T;
  error: any;
  complete: boolean;
};

/**
 * Hook to get Squid RXJS observable data, loading state, errors, and completion state.
 *
 * @param observable Function returning the observable (for instance, Squid query's snapshots()).
 * @param initialValue Initial value of the data.
 * @param deps Array of dependencies for the hook. Default is [].
 * @returns The observable data, loading state, errors, and completion state.
 */
export function useObservable<T>(
  observable: () => Observable<T>,
  initialValue: T,
  deps?: ReadonlyArray<unknown>,
): ObservableType<T>;
export function useObservable<T>(
  observable: () => Observable<T>,
  initialValue?: T,
  deps?: ReadonlyArray<unknown>,
): ObservableType<T | null>;
export function useObservable<T>(
  observable: () => Observable<T>,
  initialValue?: T,
  deps: ReadonlyArray<unknown> = [],
): ObservableType<T | null> {
  const [state, setState] = useState<ObservableType<T | null>>({
    loading: true,
    data: initialValue !== undefined ? initialValue : null,
    error: null,
    complete: false,
  });

  const observableMemo = useMemo(observable, deps);

  useEffect(() => {
    // Set loading state to true when the observable changes
    if (!state.loading) {
      setState((prevState) => ({
        ...prevState,
        data: initialValue !== undefined ? initialValue : null,
        loading: true,
        complete: false,
      }));
    }
    const subscription = observableMemo.subscribe({
      next: (value: T) =>
        setState({
          loading: false,
          data: value,
          error: null,
          complete: false,
        }),
      error: (error) =>
        setState((prevState) => ({
          ...prevState,
          loading: false,
          error,
          complete: false,
        })),
      complete: () =>
        setState((prevState) => ({
          ...prevState,
          loading: false,
          complete: true,
        })),
    });
    return () => {
      // Deferring the unsubscribe allows us to check if the new query is a subquery of the previous
      // subscription.
      setTimeout(() => subscription.unsubscribe(), 0);
    };
  }, [observableMemo]);

  return state;
}
