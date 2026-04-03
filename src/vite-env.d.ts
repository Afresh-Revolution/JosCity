/// <reference types="vite/client" />

// Environment variable types
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_BASE_URL?: string;
  readonly VITE_MAINTENANCE_MODE?: string;
  readonly VITE_VAPID_PUBLIC_KEY?: string;
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
