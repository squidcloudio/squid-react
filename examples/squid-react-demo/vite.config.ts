import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import * as path from 'path';
import svgr from 'vite-plugin-svgr';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), svgr({ svgrOptions: { exportType: 'default' } })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@squidcloud/react': path.resolve(__dirname, '../../src/index.ts'),
    },
  },
});
