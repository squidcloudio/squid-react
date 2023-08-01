import { SupportedSquidRegion } from '@squidcloud/common';
import { SquidContextProvider } from '@squidcloud/react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
root.render(
  <React.StrictMode>
    <SquidContextProvider
      options={{
        appId: process.env.REACT_APP_SQUID_APP_ID,
        region: process.env.REACT_APP_SQUID_REGION as SupportedSquidRegion,
        environmentId: 'dev',
        squidDeveloperId: process.env.REACT_APP_SQUID_DEVELOPER_ID,
      }}
    >
      <App />
    </SquidContextProvider>
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
