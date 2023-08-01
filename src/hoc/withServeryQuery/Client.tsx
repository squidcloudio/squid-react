'use client';

import { deserializeQuery } from '@squidcloud/client';
import { SerializedQuery } from '@squidcloud/common';
import React from 'react';
import { useObservable, useSquid } from '../../hooks';
import { WithQueryProps } from './index';

type PropTypes<C extends React.ComponentType<any>, T> = {
  Component: C;
  props: Omit<React.ComponentProps<C>, keyof WithQueryProps<T>>;
  serializedQuery: SerializedQuery;
  data: Array<T>;
};

const WithClientQuery = <C extends React.ComponentType<any>, T>({
  Component,
  props,
  serializedQuery,
  data,
}: PropTypes<C, T>) => {
  const squid = useSquid();

  const { data: currentData } = useObservable(
    deserializeQuery<T>(squid, serializedQuery).snapshots(),
    data,
    [],
  );
  const propsWithData = {
    ...props,
    data: currentData,
  } as React.ComponentProps<C>;

  return <Component {...propsWithData} />;
};

export default WithClientQuery;
