import { SnapshotEmitter, Squid } from '@squidcloud/client';

/** Type representing the context for the Squid library. */
export type SquidContextType = {
  squid: Squid | null;
};

export type SnapshotEmitterReturnType<T> = T extends SnapshotEmitter<infer U> ? U : never;
