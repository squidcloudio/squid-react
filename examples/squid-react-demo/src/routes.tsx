import Main from '@/components/Main';
import { ReactElement } from 'react';

interface NavBarItem {
  path: string;
  component: ReactElement;
  mainRoute?: boolean;
}

export const ROUTES: Array<NavBarItem> = [
  {
    path: '/',
    component: <Main />,
    mainRoute: true,
  },
];
