import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import postcss from './postcss.config.js';
import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  css: {
    postcss,
  },
  resolve: {
    alias: {
      '@refly-packages/editor-core': path.resolve(__dirname, './src/headless-core'),
      '@refly-packages/editor-component': path.resolve(__dirname, './src/components'),
    },
  },
});
