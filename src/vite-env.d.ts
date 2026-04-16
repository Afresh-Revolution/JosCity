/// <reference types="vite/client" />

/** Chromium: deferred install dialog (not available on iOS Safari). */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  prompt(): Promise<void>;
}

interface WindowEventMap {
  beforeinstallprompt: BeforeInstallPromptEvent;
  appinstalled: Event;
}

// Environment variable types
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_BASE_URL?: string;
  readonly VITE_MAINTENANCE_MODE?: string;
  readonly VITE_VAPID_PUBLIC_KEY?: string;
  /** Engine.IO path, e.g. `/api/socket.io` if the server mounts Socket.IO under `/api`. */
  readonly VITE_SOCKET_PATH?: string;
  /** When `true` or `1`, enables client-side “prevent inspect” (blocks context menu, common DevTools shortcuts, etc.). */
  readonly VITE_PREVENT_INSPECT?: string;
}

declare module "virtual:pwa-register/react" {
  export function useRegisterSW(options?: {
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: unknown) => void;
  }): {
    needRefresh: [boolean, (value: boolean) => void];
    offlineReady: [boolean, (value: boolean) => void];
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  };
}

declare module "workbox-core" {
  export function clientsClaim(): void;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Image module declarations for Vite
declare module "*.png" {
  const value: string;
  export default value;
}

declare module "*.jpg" {
  const value: string;
  export default value;
}

declare module "*.jpeg" {
  const value: string;
  export default value;
}

declare module "*.svg" {
  const value: string;
  export default value;
}

declare module "*.webp" {
  const value: string;
  export default value;
}
