'use client';

import { Squid, SquidOptions } from '@squidcloud/client';
import React, { useRef } from 'react';
import { SquidContextType } from '../types';

/**
 * React Context for Squid.
 * Provides a way to pass the Squid instance down the component tree without having to pass the prop down manually at every level.
 * It is created with a default value of null for the squid instance.
 */
export const SquidContext = React.createContext<SquidContextType>({
  squid: null,
});

type SquidContextProps = {
  children: React.ReactNode;
  options: SquidOptions;
};

/**
 * React Component to provide Squid instance to all children in the component tree.
 *
 * @param children - The child nodes of the Provider.
 * @param options - The options for the Squid instance.
 * @returns A React context provider with the Squid instance.
 */
export const SquidContextProvider: React.FC<SquidContextProps> = ({
  children,
  options,
}) => {
  const squid = useRef(Squid.getInstance(options));

  return (
    <SquidContext.Provider value={{ squid: squid.current }}>
      {children}
    </SquidContext.Provider>
  );
};
