import { useEffect, useMemo, useState } from 'react';
import { Observable } from 'rxjs';

export type ObservableType<T> = {
  loading: boolean;
  data: T;
  error: any;
  complete: boolean;
};

export function useObservable<T>(
  observable: Observable<T>,
  initialValue: T,
  deps?: ReadonlyArray<unknown>,
): ObservableType<T>;
export function useObservable<T>(
  observable: Observable<T>,
  initialValue?: T,
  deps?: ReadonlyArray<unknown>,
): ObservableType<T | null>;
export function useObservable<T>(
  observable: Observable<T>,
  initialValue?: T,
  deps: ReadonlyArray<unknown> = [],
): ObservableType<T | null> {
  const [state, setState] = useState<ObservableType<T | null>>({
    loading: true,
    data: initialValue !== undefined ? initialValue : null,
    error: null,
    complete: false,
  });

  const observableMemo = useMemo(() => observable, deps);

  useEffect(() => {
    // Set loading state to true when the observable changes
    setState(() => ({
      loading: true,
      data: initialValue !== undefined ? initialValue : null,
      error: null,
      complete: false,
    }));
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
    return () => subscription.unsubscribe(); // Clean-up function
  }, [observableMemo]);

  return state;
}
