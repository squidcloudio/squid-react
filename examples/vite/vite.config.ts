import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // https://vitejs.dev/guide/dep-pre-bundling.html#monorepos-and-linked-dependencies
  optimizeDeps: {
    include: ['@squidcloud/react'],
  },
  build: {
    commonjsOptions: {
      include: [/'@squidcloud\/react'/, /node_modules/],
    },
  },
});
