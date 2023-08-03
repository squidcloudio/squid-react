import Users, { Person } from '@/components/Users';
import { Squid } from '@squidcloud/client';
import { SupportedSquidRegion } from '@squidcloud/common';
import { GetServerSideProps, InferGetServerSidePropsType } from 'next';

export default function Home({
  users,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return <Users title="Users" initialData={users} />;
}

export const getServerSideProps: GetServerSideProps<{
  users: Array<Person>;
}> = async () => {
  const squid = Squid.getInstance({
    appId: process.env.NEXT_PUBLIC_SQUID_APP_ID,
    region: process.env.NEXT_PUBLIC_SQUID_REGION as SupportedSquidRegion,
    apiKey: process.env.SQUID_API_KEY,
    environmentId: 'dev',
    squidDeveloperId: process.env.NEXT_PUBLIC_SQUID_DEVELOPER_ID,
  });

  const data = await squid
    .collection<Person>('people')
    .query()
    .dereference()
    .snapshot();
  return {
    props: {
      users: data,
    },
  };
};
