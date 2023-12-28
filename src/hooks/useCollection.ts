'use client';

import { CollectionName, CollectionReference, DocumentData, IntegrationId } from '@squidcloud/client';
import React from 'react';
import { SquidContext } from '../context';
import { useSquid } from './useSquid';

/**
 * Hook to get a Squid collection reference.
 *
 * @template T extends DocumentData
 * @throws Will throw an error if used outside a SquidContext.Provider.
 *
 * @param collectionName Name of the collection.
 * @param integrationId Optional integration id.
 * @returns Reference to the collection.
 */
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
