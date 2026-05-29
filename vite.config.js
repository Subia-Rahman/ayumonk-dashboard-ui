import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Theme colors mirror src/theme.js — keep in sync.
const THEME_COLOR = "#0f766e";
const BACKGROUND_COLOR = "#f7f2e9";

export default defineConfig({
  server: {
    allowedHosts: [".ngrok-free.dev", ".ngrok-free.app", ".ngrok.io", "dev.ayumonk.com"],
  },
  preview: {
    allowedHosts: [".ngrok-free.dev", ".ngrok-free.app", ".ngrok.io", "dev.ayumonk.com"],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      includeAssets: [
        "favicon.png",
        "favicon-16x16.png",
        "favicon-32x32.png",
        "apple-touch-icon.png",
        "icon-source.svg",
        "screenshot-wide.png",
        "screenshot-mobile.png",
      ],
      manifest: {
        id: "/",
        name: "Ayumonk",
        short_name: "Ayumonk",
        description:
          "Ayumonk — daily wellness challenges, KPIs and sessions for your team.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        theme_color: THEME_COLOR,
        background_color: BACKGROUND_COLOR,
        lang: "en",
        dir: "ltr",
        categories: ["health", "productivity", "lifestyle"],
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png",
            purpose: "any",
          },
        ],
        screenshots: [
          {
            src: "screenshot-wide.png",
            sizes: "1280x720",
            type: "image/png",
            form_factor: "wide",
            label: "Ayumonk Dashboard",
          },
          {
            src: "screenshot-mobile.png",
            sizes: "390x844",
            type: "image/png",
            label: "Ayumonk Mobile",
          },
        ],
      },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webp,jpg,jpeg,json}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      devOptions: {
        enabled: false,
        type: "module",
        navigateFallback: "index.html",
      },
    }),
  ],
});
