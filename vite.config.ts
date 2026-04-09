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

/** Dev proxy options per upstream (main API vs forums microservice). */
function devApiProxy(target: string) {
  return {
    target,
    changeOrigin: true,
    secure: false,
    ws: true,
    timeout: 10000,
    configure: (proxy: {
      on: (event: string, handler: (...args: unknown[]) => void) => void;
    }) => {
      proxy.on("error", (err: Error) => {
        console.log("[Proxy] Backend connection issue:", err.message);
      });
      proxy.on("proxyReq", (_proxyReq, req) => {
        if (process.env.NODE_ENV === "development") {
          console.log("[Proxy]", req.method, req.url);
        }
      });
      proxy.on("proxyRes", (proxyRes, req) => {
        if (proxyRes.statusCode && proxyRes.statusCode >= 500) {
          console.log("[Proxy]", req.method, req.url, "->", proxyRes.statusCode);
        }
      });
    },
  };
}

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
      // Disable dev service worker / injectManifest dev pipeline — avoids bare-import / SW
      // issues during `vite` and matches “don’t register the SW in development”.
      devOptions: {
        enabled: false,
        type: "classic",
      },
    }),
  ],
  server: {
    host: true, // Allow access from network devices
    allowedHosts: [
      "joscity-com.onrender.com",
    ],
    // Forums microservice (New_Joscity/src/index.js) defaults to :3001; main API (server.js) :3000.
    // Sending all /api to the forums port broke login and admin (they 404 on the forums app).
    proxy: {
      "/api/forums": devApiProxy(
        process.env.VITE_FORUMS_API_TARGET || "http://localhost:3001"
      ),
      "/api/admin/forums": devApiProxy(
        process.env.VITE_FORUMS_API_TARGET || "http://localhost:3001"
      ),
      "/api/marketplace": devApiProxy(
        process.env.VITE_MARKETPLACE_API_TARGET ||
          process.env.VITE_FORUMS_API_TARGET ||
          "http://localhost:3001"
      ),
      "/api": devApiProxy(process.env.VITE_API_TARGET || "http://localhost:3000"),
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
