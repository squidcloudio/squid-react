import { SnapshotEmitter } from '@squidcloud/common';
import React from 'react';
import WithQueryServer from './WithQueryServer';

export interface WithQueryProps<T> {
  data: Array<T>;
}

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
