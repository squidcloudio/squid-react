import { useEffect, useMemo, useState } from 'react';
import { Observable, defer } from 'rxjs';

export type ObservableType<T> = {
  loading: boolean;
  data: T;
  error: any;
  complete: boolean;
};

export function useObservable<T>(
  observable: Observable<T> | (() => Observable<T>),
  initialValue: T,
  deps?: ReadonlyArray<unknown>,
): ObservableType<T>;
export function useObservable<T>(
  observable: Observable<T> | (() => Observable<T>),
  initialValue?: T,
  deps?: ReadonlyArray<unknown>,
): ObservableType<T | null>;
export function useObservable<T>(
  observable: Observable<T> | (() => Observable<T>),
  initialValue?: T,
  deps: ReadonlyArray<unknown> = [],
): ObservableType<T | null> {
  const [state, setState] = useState<ObservableType<T | null>>({
    loading: true,
    data: initialValue !== undefined ? initialValue : null,
    error: null,
    complete: false,
  });

  const observableMemo = useMemo(
    () => (typeof observable === 'function' ? defer(() => observable()) : observable),
    deps,
  );

  useEffect(() => {
    // Set loading state to true when the observable changes
    if (!state.loading) {
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
