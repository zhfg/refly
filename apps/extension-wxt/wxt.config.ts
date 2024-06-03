import { defineConfig, WxtViteConfig } from 'wxt';
import react from '@vitejs/plugin-react';
import { vitePluginForArco } from '@refly/arco-vite-plugin-react';
import postcssConfig from './postcss.config';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  vite: () =>
    ({
      plugins: [
        react(),
        tsconfigPaths(),
        vitePluginForArco({
          theme: '@arco-themes/react-refly-ai',
          filePatterns: ['apps/web/src', 'apps/extension-wxt/src', 'packages/ai-workspace-common/src'],
        }),
      ],
      css: {
        postcss: postcssConfig,
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
          '@refly/ai-workspace-common': path.resolve(__dirname, './node_modules/@refly/ai-workspace-common/src'),
          '@refly-packages/ai-workspace-common': path.resolve(
            __dirname,
            './node_modules/@refly/ai-workspace-common/src',
          ),
        },
      },
      build: {
        sourcemap: 'inline',
      },
      server: {
        port: 8000,
        fs: {
          strict: false, // TODO：这里需要添加限制，allow 需要处理，目前先临时解决
        },
      },
    }) as WxtViteConfig,
  manifest: {
    version: '0.2.0',
    author: 'pftom',
    name: '__MSG_displayName__',
    description: '__MSG_description__',
    default_locale: 'en',
    host_permissions: ['https://*/*', 'http://*/*', '<all_urls>'],
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'",
    },
    commands: {
      _execute_action: {
        suggested_key: { default: 'Ctrl+J', mac: 'Command+J' },
      },
    },
    homepage_url: 'https://refly.ai',
    permissions: [
      'storage',
      'scripting',
      'history',
      'activeTab',
      'tabs',
      'unlimitedStorage',
      'cookies',
      'notifications',
      'sidePanel',
    ],
  },
  runner: {
    startUrls: ['https://google.com/'],
  },
});
