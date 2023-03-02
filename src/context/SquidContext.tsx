import { Squid, SquidOptions } from '@squidcloud/client';
import React, { useRef } from 'react';
import { SquidContextType } from '../types';

export const SquidContext = React.createContext<SquidContextType>({
  squid: null,
});

type SquidContextProps = {
  children: React.ReactNode;
  options: SquidOptions;
};

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
