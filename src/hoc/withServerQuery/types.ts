export interface WithQueryProps<T> {
  /**
   * The data returned from the `query` passed to the `withServerQuery` HOC. On initial render, the data will be
   * passed from the server. If the component subscribes to query snaphosts, the data will be updated whenever the
   * query results change.
   */
  data: Array<T>;
}

export type WithQueryOptions = {
  /**
   * If true, the Component will subscribe to the query snapshots. Defaults to `true`.
   */
  subscribe?: boolean;
};

/** @internal */
export const DEFAULT_WITH_QUERY_OPTIONS: Required<WithQueryOptions> = {
  subscribe: true,
};