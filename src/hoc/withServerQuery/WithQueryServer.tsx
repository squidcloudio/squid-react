import { SnapshotEmitter } from '@squidcloud/common';
import React from 'react';
import WithQueryClient from './WithQueryClient';
import { WithQueryProps } from './index';

type PropTypes<C extends React.ComponentType<any>, T> = {
  Component: C;
  props: Omit<React.ComponentProps<C>, keyof WithQueryProps<T>>;
  query: SnapshotEmitter<T>;
  subscribe: boolean;
};

/**
 * Component to wrap another component with a server query.
 *
 * @template C - The type of the React component.
 * @template T - The type of the data in the query.
 * @param Component - The component to wrap.
 * @param props - The props of the Component.
 * @param query - The query object.
 * @param subscribe - If true, the Component will subscribe to the query snapshots.
 * @returns The Component wrapped with the query data, or a WithQueryClient component if subscribe is true.
 */
const WithQueryServer = async <C extends React.ComponentType<any>, T>({
  Component,
  props,
  query,
  subscribe,
}: PropTypes<C, T>) => {
  const data = await query.snapshot();

  const propsWithData = {
    ...props,
    data,
  } as React.ComponentProps<C>;

  if (!subscribe) {
    return <Component {...propsWithData} />;
  }

  return (
    <WithQueryClient
      serializedQuery={query.serialize()}
      props={props}
      data={data}
      Component={Component}
    />
  );
};

export default WithQueryServer;
