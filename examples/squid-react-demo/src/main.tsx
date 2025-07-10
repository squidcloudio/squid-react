import Layout from '@/components/Layout.tsx';
import { Toaster } from '@/components/ui/sonner.tsx';
import { ROUTES } from '@/routes.tsx';
import { SquidContextProvider } from '@squidcloud/react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './styles/global.scss';
import './styles/tw.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: ROUTES.map((route) => ({
      path: route.path,
      element: route.component,
      index: !!route.mainRoute,
    })),
  },
]);

createRoot(document.getElementById('root')!).render(
  <SquidContextProvider
    options={{
      appId: import.meta.env.VITE_SQUID_APP_ID,
      region: import.meta.env.VITE_SQUID_REGION,
      apiKey: import.meta.env.VITE_SQUID_API_KEY,
      environmentId: import.meta.env.VITE_SQUID_ENVIRONMENT_ID,
      squidDeveloperId: import.meta.env.VITE_SQUID_DEVELOPER_ID,
    }}
  >
    <RouterProvider router={router} />
    <Toaster />
  </SquidContextProvider>,
);
