'use client';

import { CollectionReference } from '@squidcloud/client';
import { CollectionName, DocumentData, IntegrationId } from '@squidcloud/common';
import React from 'react';
import { SquidContext } from '../context';
import { useSquid } from './useSquid';

export function useCollection<T extends DocumentData>(
  collectionName: CollectionName,
  integrationId?: IntegrationId,
): CollectionReference<T> {
  const context = React.useContext(SquidContext);

  if (context === undefined) {
    throw new Error('useSquid must be used within a SquidContext.Provider');
  }

  return useSquid().collection<T>(collectionName, integrationId);
}
