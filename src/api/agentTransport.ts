import { apiUrl } from './config';
import type { UploadImage } from './agent';

export async function appendAgentImage(data: FormData, field: string, image: UploadImage) {
  if (!(image instanceof File)) throw new Error('Choose a local image file');
  data.append(field, image, image.name);
}

function isAbort(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const name = String((error as { name?: string }).name || '');
  return name === 'AbortError' || name === 'TimeoutError';
}

export async function agentRequest<T>(
  path: string,
  options: RequestInit & { auth?: boolean; timeoutMs?: number } = {}
): Promise<T> {
  const { auth = true, timeoutMs, ...init } = options;
  const token = auth ? localStorage.getItem('token') || localStorage.getItem('authToken') : null;
  const form = init.body instanceof FormData;
  try {
    const response = await fetch(apiUrl(path), {
      ...init,
      signal: init.signal || AbortSignal.timeout(timeoutMs || (form ? 60000 : 15000)),
      headers: {
        Accept: 'application/json',
        ...(init.body && !form ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success !== true) {
      if (response.status === 504 || response.status === 503) {
        throw new Error(typeof payload.error === 'string' && payload.error !== 'true'
          ? payload.error
          : payload.message || 'That search took too long. Try again.');
      }
      throw new Error(typeof payload.error === 'string' ? payload.error : payload.message || `Request failed (${response.status})`);
    }
    return payload.data as T;
  } catch (error) {
    if (isAbort(error)) throw new Error('That search took too long. Try again.');
    throw error;
  }
}
