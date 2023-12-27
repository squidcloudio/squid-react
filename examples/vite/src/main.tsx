import { SupportedSquidRegion } from '@squidcloud/client';
import { SquidContextProvider } from '@squidcloud/react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <SquidContextProvider
    options={{
      appId: import.meta.env.VITE_SQUID_APP_ID,
      region: import.meta.env.VITE_SQUID_REGION as SupportedSquidRegion,
      environmentId: 'dev',
      squidDeveloperId: import.meta.env.VITE_SQUID_DEVELOPER_ID,
    }}
  >
    <App />
  </SquidContextProvider>,
);
