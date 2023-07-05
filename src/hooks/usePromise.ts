import { useEffect, useMemo, useState } from 'react';

export type PromiseType<T = any> = {
  loading: boolean;
  data: T | null;
  error: any;
};

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
