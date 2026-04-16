// API Base URL configuration
// In development, uses Vite proxy (/api -> http://localhost:3000/api)
// In production, uses VITE_API_BASE_URL or VITE_BASE_URL environment variable or defaults to /api

const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BASE_URL ||
  "/api";

/**
 * Engine.IO path for Socket.IO (must match the server). Default `/socket.io`.
 * If your Node app mounts Socket.IO under the same prefix as REST (e.g. `/api/socket.io`),
 * set `VITE_SOCKET_PATH=/api/socket.io` in `.env`.
 */
export const SOCKET_IO_PATH: string =
  import.meta.env.VITE_SOCKET_PATH || "/socket.io";

/**
 * Build an absolute API path. Ensures a single `/api` prefix so production envs like
 * `https://example.com` (missing `/api`) still hit `https://example.com/api/...`.
 */
export function apiUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/+$/, "");
  const withApi = base.endsWith("/api") ? base : `${base}/api`;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${withApi}${p}`;
}

// Debug logging in development
if (import.meta.env.DEV) {
  console.log("API Configuration:", {
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_BASE_URL: import.meta.env.VITE_BASE_URL,
    VITE_SOCKET_PATH: import.meta.env.VITE_SOCKET_PATH,
    resolved: API_BASE_URL,
    socketPath: SOCKET_IO_PATH,
  });
}

export default API_BASE_URL;
