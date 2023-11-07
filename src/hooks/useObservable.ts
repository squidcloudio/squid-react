'use client';

import { useEffect, useMemo, useState } from 'react';
import { Observable } from 'rxjs';

/**
 * Type representing the state and data of an observable request.
 *
 * @template T - The type of data the observable emits.
 */
export type ObservableType<T> = {
  /** Indicates whether the observable request is in progress. */
  loading: boolean;
  /** The latest data emitted by the observable. */
  data: T;
  /** Any error that may have occurred during the observable request. */
  error: any;
  /** Indicates whether the observable has completed its stream. */
  complete: boolean;
};

/**
 * Hook that subscribes to an RXJS Observable and keeps track of its loading state, data, errors, and completion state.
 * This hook handles the subscription and unsubscription to the observable provided.
 *
 * @template T - The type of data the observable emits.
 * @param observable - A function that returns the observable to subscribe to.
 * @param initialValue - The initial value to be used for the data before the observable emits.
 * @param deps - Optional array of dependencies that, when changed, will re-subscribe to the provided observable function.
 * @returns An object containing the observable's current loading state, the latest data emitted, any errors encountered, and completion state.
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
      // We don't reset the data here to ensure that the user still has access to the data
      // from the previously emitted value while the new value is loading. This is important
      // to prevent UI flashes of data, etc.
      setState((prevState) => ({
        ...prevState,
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
