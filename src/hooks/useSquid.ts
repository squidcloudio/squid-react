import { Squid } from '@squidcloud/client';
import React from 'react';
import { SquidContext } from '../context';

export function useSquid(): Squid {
  const context = React.useContext(SquidContext);

  if (context === undefined) {
    throw new Error('useSquid must be used within a SquidContext.Provider');
  }

  return context.squid as Squid;
}
