'use client';

import { deserializeQuery } from '@squidcloud/client';
import { SerializedQuery } from '@squidcloud/common';
import React from 'react';
import { useQuery, useSquid } from '../../hooks';
import { WithQueryProps } from './index';

type PropTypes<C extends React.ComponentType<any>, T> = {
  Component: C;
  props: Omit<React.ComponentProps<C>, keyof WithQueryProps<T>>;
  serializedQuery: SerializedQuery;
  data: Array<T>;
};

/**
 * Component to wrap another component with a client query.
 *
 * @template C - The type of the React component.
 * @template T - The type of the data in the query.
 * @param Component - The component to wrap.
 * @param props - The props of the Component.
 * @param serializedQuery - The serialized query object.
 * @param data - The initial data.
 * @returns The Component wrapped with the current query data.
 */
const WithQueryClient = <C extends React.ComponentType<any>, T>({
  Component,
  props,
  serializedQuery,
  data,
}: PropTypes<C, T>) => {
  const squid = useSquid();

  const { data: currentData } = useQuery(
    deserializeQuery<T>(squid, serializedQuery),
    { subscribe: true },
    data,
  );
  const propsWithData = {
    ...props,
    data: currentData,
  } as React.ComponentProps<C>;

  return <Component {...propsWithData} />;
};

export default WithQueryClient;
