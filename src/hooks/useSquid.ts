'use client';

import { Squid } from '@squidcloud/client';
import React from 'react';
import { SquidContext } from '../context';

/**
 * React Hook to get the Squid instance from the SquidContext.
 *
 * @returns The Squid instance from the context.
 * @throws Will throw an error if used outside a SquidContext.Provider.
 */
export function useSquid(): Squid {
  const context = React.useContext(SquidContext);

  if (!context) {
    throw new Error('useSquid must be used within a SquidContext.Provider');
  }

  return context.squid as Squid;
}
