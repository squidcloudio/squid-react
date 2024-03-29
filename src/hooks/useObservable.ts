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

export type ObservableOptions<T> = {
  /**
   * Determines whether to execute the observable automatically. Defaults to `true`. When set to `false`, executing the
   * observable will be delayed until `enabled` is set to `true`.
   */
  enabled?: boolean;

  /** The initial data to be used for the data before the observable emits. Defaults to `null`. */
  initialData?: T;
};

const DEFAULT_OBSERVABLE_OPTIONS: Required<ObservableOptions<null>> = {
  enabled: true,
  initialData: null,
};

/**
 * Hook that subscribes to an RXJS Observable and keeps track of its loading state, data, errors, and completion state.
 * This hook handles the subscription and unsubscription to the observable provided.
 *
 * @template T - The type of data the observable emits.
 * @param observable - A function that returns the observable to subscribe to.
 * @param options - Options to control the behavior of the observable.
 * @param deps - Optional array of dependencies that, when changed, will re-subscribe to the provided observable function.
 * @returns An object containing the observable's current loading state, the latest data emitted, any errors encountered, and completion state.
 */
export function useObservable<T>(
  observable: () => Observable<T>,
  options: ObservableOptions<T> & { initialData: T },
  deps?: ReadonlyArray<unknown>,
): ObservableType<T>;
export function useObservable<T>(
  observable: () => Observable<T>,
  options?: ObservableOptions<T>,
  deps?: ReadonlyArray<unknown>,
): ObservableType<T | null>;
export function useObservable<T>(
  observable: () => Observable<T>,
  options: ObservableOptions<T> = {},
  deps: ReadonlyArray<unknown> = [],
): ObservableType<T | null> {
  const mergedOptions = { ...DEFAULT_OBSERVABLE_OPTIONS, ...options };

  const [state, setState] = useState<ObservableType<T | null>>({
    loading: true,
    data: mergedOptions.initialData,
    error: null,
    complete: false,
  });

  const observableMemo = useMemo(observable, [JSON.stringify(deps), mergedOptions.enabled]);

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

    const { enabled } = mergedOptions;
    if (!enabled) return;

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
