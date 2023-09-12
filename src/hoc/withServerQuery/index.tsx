import { SnapshotEmitter } from '@squidcloud/common';
import React from 'react';
import WithQueryServer from './WithQueryServer';

export interface WithQueryProps<T> {
  data: Array<T>;
}

/**
 * Higher Order Component (HOC) to wrap a component with a server query.
 *
 * @template C - The type of the React component.
 * @template T - The type of the data in the query.
 * @param Component - The component to wrap.
 * @param query - The query object.
 * @param subscribe - Whether to subscribe to query snapshots. Default is false.
 * @returns A new component that wraps the given component with the server query.
 */
export const withServerQuery = <C extends React.ComponentType<any>, T>(
  Component: C,
  query: SnapshotEmitter<T>,
  subscribe = false,
) => {
  const withQuery: React.FC<
    Omit<React.ComponentProps<C>, keyof WithQueryProps<T>>
  > = (props: Omit<React.ComponentProps<C>, keyof WithQueryProps<T>>) => {
    return (
      // @ts-expect-error Server Component
      <WithQueryServer<C, T>
        props={props}
        Component={Component}
        query={query}
        subscribe={subscribe}
      />
    );
  };

  return withQuery;
};
