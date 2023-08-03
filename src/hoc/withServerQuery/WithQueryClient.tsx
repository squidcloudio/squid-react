'use client';

import { deserializeQuery } from '@squidcloud/client';
import { SerializedQuery } from '@squidcloud/common';
import React, {ComponentType} from 'react';
import { useObservable, useSquid } from '../../hooks';
import { AddQueryProps } from './index';

type PropTypes<Props, DataType> = {
  Component: ComponentType<AddQueryProps<Props, DataType>>;
  props: Props;
  serializedQuery: SerializedQuery;
  data: Array<DataType>;
};

const WithQueryClient = <Props, DataType>({
  Component,
  props,
  serializedQuery,
  data,
}: PropTypes<Props, DataType>) => {
  const squid = useSquid();

  const { data: currentData } = useObservable(
    deserializeQuery<DataType>(squid, serializedQuery).snapshots(),
    data,
    [],
  );
  const propsWithData = {
    ...props,
    data: currentData,
  };

  return <Component {...propsWithData} />;
};

export default WithQueryClient;
