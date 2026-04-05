import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import type { ViteDevServer } from "vite";

// Plugin to suppress proxy connection errors when backend is not running
const suppressProxyErrors = () => {
  return {
    name: 'suppress-proxy-errors',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    configureServer(_server: ViteDevServer) {
      const originalError = console.error;
      console.error = (...args) => {
        // Suppress ECONNREFUSED, ETIMEDOUT, and ECONNRESET errors from proxy
        const message = args.join(' ');
        if (
          message.includes('http proxy error') &&
          (message.includes('ECONNREFUSED') || 
           message.includes('ETIMEDOUT') || 
           message.includes('ECONNRESET'))
        ) {
          // Suppress these errors - they're expected when backend isn't running
          return;
        }
        originalError.apply(console, args);
      };
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    suppressProxyErrors(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "prompt", // Show "update available" so we can display our badge
      injectRegister: "auto",
      manifest: {
        name: "JosCity",
        short_name: "JosCity",
        description: "Jos Smart City Platform",
        id: "/",
        theme_color: "#0d4a1f",
        background_color: "#0a0a0a",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        // Separate any / maskable helps Chromium treat the app as a full installable PWA
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        categories: ["social", "lifestyle"],
      },
      devOptions: {
        enabled: true,
        type: "classic",
      },
    }),
  ],
  server: {
    host: true, // Allow access from network devices
    allowedHosts: [
      "joscity-com.onrender.com",
    ],
    proxy: {
      "/api": {
        target: process.env.VITE_API_TARGET || "http://localhost:3000",
        changeOrigin: true,
        secure: false,
        ws: true, // Enable websocket proxying
        timeout: 10000, // 10 second timeout
        // Don't rewrite - backend expects /api in the path
        // Note: Connection errors (ECONNREFUSED, ETIMEDOUT, ECONNRESET) are expected 
        // when the backend server is not running. The app handles these gracefully.
        configure: (proxy) => {
          proxy.on('error', (err) => {
            // Suppress proxy errors to prevent console spam
            // The frontend will handle these gracefully
            console.log('[Proxy] Backend connection issue:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            // Log only in development for debugging
            if (process.env.NODE_ENV === 'development') {
              console.log('[Proxy]', req.method, req.url);
            }
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            // Suppress 502/503 errors from being logged repeatedly
            if (proxyRes.statusCode && proxyRes.statusCode >= 500) {
              console.log('[Proxy]', req.method, req.url, '->', proxyRes.statusCode);
            }
          });
        },
      },
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    // Let Vite handle chunking automatically for better dependency resolution
    // This ensures React and its dependencies load in the correct order
    chunkSizeWarningLimit: 1000,
    // Ensure proper module resolution
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
  publicDir: "public",
});
