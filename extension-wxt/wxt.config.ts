import { defineConfig } from "wxt";
import react from "@vitejs/plugin-react";
import { vitePluginForArco } from "@arco-plugins/vite-react";
import postcssConfig from "./postcss.config";

// See https://wxt.dev/api/config.html
export default defineConfig({
  vite: () => ({
    plugins: [
      react(),
      vitePluginForArco({
        theme: "@arco-themes/react-refly-ai",
      }),
    ],
    css: {
      postcss: postcssConfig,
    },
  }),
  manifest: {
    version: "0.2.0",
    author: "pftom",
    name: "__MSG_displayName__",
    description: "__MSG_description__",
    default_locale: "en",
    host_permissions: ["https://*/*", "http://*/*", "<all_urls>"],
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'",
    },
    commands: {
      _execute_action: {
        suggested_key: { default: "Ctrl+J", mac: "Command+J" },
      },
    },
    homepage_url: "https://refly.ai",
    permissions: [
      "storage",
      "scripting",
      "history",
      "activeTab",
      "tabs",
      "unlimitedStorage",
      "cookies",
      "notifications",
    ],
  },
});
