import { SnapshotEmitter } from '@squidcloud/common';
import React, {ComponentType} from 'react';
import WithQueryClient from './WithQueryClient';
import { AddQueryProps } from './index';

type PropTypes<Props, DataType> = {
  Component: ComponentType<AddQueryProps<Props, DataType>>;
  props: Props;
  query: SnapshotEmitter<DataType>;
  subscribe: boolean;
};

const WithQueryServer = async <Props, DataType>({
  Component,
  props,
  query,
  subscribe,
}: PropTypes<Props, DataType>) => {
  const data = await query.snapshot();

  const propsWithData = {
    ...props,
    data,
  };

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
