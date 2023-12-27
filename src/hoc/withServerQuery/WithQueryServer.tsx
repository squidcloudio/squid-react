import { SnapshotEmitter } from '@squidcloud/client';
import React from 'react';
import WithQueryClient from './WithQueryClient';
import {
  DEFAULT_WITH_QUERY_OPTIONS,
  WithQueryOptions,
  WithQueryProps,
} from './index';

type PropTypes<C extends React.ComponentType<any>, T> = {
  Component: C;
  props: Omit<React.ComponentProps<C>, keyof WithQueryProps<T>>;
  query: SnapshotEmitter<T>;
  options?: WithQueryOptions;
};

/**
 * Component to wrap another component with a server query.
 *
 * @template C - The type of the React component.
 * @template T - The type of the data in the query.
 * @param Component - The component to wrap.
 * @param props - The props of the Component.
 * @param query - The query object.
 * @param options - Options to control the behavior of the HOC.
 * @returns The Component wrapped with the query data, or a WithQueryClient component if subscribe is true.
 */
const WithQueryServer = async <C extends React.ComponentType<any>, T>({
  Component,
  props,
  query,
  options,
}: PropTypes<C, T>) => {
  const data = await query.snapshot();

  const mergedOptions = { ...DEFAULT_WITH_QUERY_OPTIONS, ...options };

  const propsWithData = {
    ...props,
    data,
  } as React.ComponentProps<C>;

  if (!mergedOptions.subscribe) {
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
