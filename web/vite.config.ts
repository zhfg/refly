import { sentryVitePlugin } from "@sentry/vite-plugin"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"
import postcss from "./postcss.config.js"
import { vitePluginForArco } from "@arco-plugins/vite-react"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    vitePluginForArco({
      theme: "@arco-themes/react-refly-ai",
    }),
    sentryVitePlugin({
      org: "refly-ai",
      project: "web",
    }),
  ],
  css: {
    postcss,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    sourcemap: true,
  },
})
