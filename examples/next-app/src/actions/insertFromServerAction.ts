'use server';

import { Person } from '@/components/Users';
import { randomAge, randomName } from '@/data/names';
import { Squid, SupportedSquidRegion } from '@squidcloud/client';

export default async function insertFromServerAction() {
  const squid = Squid.getInstance({
    appId: process.env.NEXT_PUBLIC_SQUID_APP_ID,
    region: process.env.NEXT_PUBLIC_SQUID_REGION as SupportedSquidRegion,
    apiKey: process.env.SQUID_API_KEY,
    environmentId: 'dev',
    squidDeveloperId: process.env.NEXT_PUBLIC_SQUID_DEVELOPER_ID,
  });

  await squid.collection<Person>('people').doc().insert({
    name: randomName(),
    age: randomAge(),
  });
}
