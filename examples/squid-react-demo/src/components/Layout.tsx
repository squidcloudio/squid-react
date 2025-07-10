import Header from '@/components/Header.tsx';
import { useSquid } from '@squidcloud/react';
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';

export default function Layout() {
  const squid = useSquid();
  useEffect(() => {
    (window as any).squid = squid;
  }, []);
  return (
    <div className={'w-full h-full'}>
      <Header />
      <Outlet />
    </div>
  );
}
