import { Person } from '@/components/Users';
import { randomAge, randomName } from '@/data/names';
import { Squid } from '@squidcloud/client';
import { SupportedSquidRegion } from '@squidcloud/common';
import { NextResponse } from 'next/server';

export async function POST() {
  const squid = Squid.getInstance({
    appId: process.env.NEXT_PUBLIC_SQUID_APP_ID,
    region: process.env.NEXT_PUBLIC_SQUID_REGION as SupportedSquidRegion,
    apiKey: process.env.SQUID_API_KEY,
    environmentId: 'dev',
    squidDeveloperId: process.env.NEXT_PUBLIC_SQUID_DEVELOPER_ID,
  });

  const person = { name: randomName(), age: randomAge() };

  await squid.collection<Person>('people').doc().insert(person);

  return NextResponse.json(person);
}
