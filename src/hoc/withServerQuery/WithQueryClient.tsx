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

const WithQueryClient = <C extends React.ComponentType<any>, T>({
  Component,
  props,
  serializedQuery,
  data,
}: PropTypes<C, T>) => {
  const squid = useSquid();

  const { data: currentData } = useQuery(
    deserializeQuery<T>(squid, serializedQuery),
    true,
    data,
  );
  const propsWithData = {
    ...props,
    data: currentData,
  } as React.ComponentProps<C>;

  return <Component {...propsWithData} />;
};

export default WithQueryClient;
