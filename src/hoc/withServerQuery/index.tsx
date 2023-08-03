import { SnapshotEmitter } from '@squidcloud/common';
import React from 'react';
import WithQueryServer from './WithQueryServer';

export type AddQueryProps<Props, DataType> = Props & {
  data: Array<DataType>;
}

export function withServerQuery<Props, DataType>(
  Component: React.ComponentType<AddQueryProps<Props, DataType>>,
  query: SnapshotEmitter<DataType>,
  subscribe = false,
) {
  const withQuery: React.FC<Props> = (props: Props) => {
    return (
      // @ts-expect-error Server Component
      <WithQueryServer<Props, DataType>
        props={props}
        Component={Component}
        query={query}
        subscribe={subscribe}
      />
    );
  };

  return withQuery;
}
