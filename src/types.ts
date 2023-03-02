export * from '@squidcloud/client';
export * from '@squidcloud/common';

import { Squid } from '@squidcloud/client';

export type SquidContextType = {
  squid: Squid | null;
};
