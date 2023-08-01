import { SnapshotEmitter } from '@squidcloud/common';
import React from 'react';
import Client from './Client';
import { WithQueryProps } from './index';

type PropTypes<C extends React.ComponentType<any>, T> = {
  Component: C;
  props: Omit<React.ComponentProps<C>, keyof WithQueryProps<T>>;
  query: SnapshotEmitter<T>;
  subscribe: boolean;
};

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
    <Client
      serializedQuery={query.serialize()}
      props={props}
      data={data}
      Component={Component}
    />
  );
};

export default WithQueryServer;
