import Users, { Person } from '@/components/Users';
import { Squid } from '@squidcloud/client';
import { SupportedSquidRegion } from '@squidcloud/common';
import { withServerQuery } from '@squidcloud/react';

export default function Home() {
  const squid = Squid.getInstance({
    appId: process.env.NEXT_PUBLIC_SQUID_APP_ID,
    region: process.env.NEXT_PUBLIC_SQUID_REGION as SupportedSquidRegion,
    environmentId: 'dev',
    squidDeveloperId: process.env.NEXT_PUBLIC_SQUID_DEVELOPER_ID,
  });
  const UsersWithQuery = withServerQuery(
    Users,
    squid.collection<Person>('people').query().dereference(),
    true,
  );
  return <UsersWithQuery title="Users" />;
}
