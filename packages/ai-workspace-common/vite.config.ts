import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import postcss from './postcss.config.js';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss,
  },
  resolve: {
    alias: {
      '@refly-packages/ai-workspace-common': path.resolve(__dirname, './src'),
      '@refly-packages/editor-component': path.resolve(__dirname, '../editor-common/src/components'),
      '@refly-packages/editor-core': path.resolve(__dirname, '../editor-common/src/headless-core'),
    },
  },
});
