/**
 * Utility functions for notifications and sounds
 */

export interface MessageNotification {
  id: number;
  userId: number;
  userName: string;
  userAvatar: string;
  message: string;
  timestamp: string;
  chatId: number;
}

/**
 * Play notification sound
 */
export const playNotificationSound = (): void => {
  try {
    // Create audio context for notification sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Set a pleasant notification tone
    oscillator.frequency.value = 800; // Higher pitch
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.error("Error playing notification sound:", error);
    // Fallback: try using HTML5 audio if available
    try {
      const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi77+efTRAMUKfj8LZjHAY4kdfyzHksBSR3x/Dej0AKFF606euoVRQKRp/g8r5sIQUrgc7y2Yk2CBlo");
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore if audio play fails
      });
    } catch (e) {
      // Ignore if audio creation fails
    }
  }
};

/**
 * Show browser notification (if permission granted)
 */
export const showBrowserNotification = (
  title: string,
  message: string,
  icon?: string
): void => {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      body: message,
      icon: icon || "/icon-192.png",
      badge: "/icon-192.png",
    });
  }
};

/**
 * Request notification permission
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if ("Notification" in window) {
    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return Notification.permission === "granted";
  }
  return false;
};

/**
 * Push subscription payload to send to backend for Web Push (works when PWA is closed).
 * Backend should store this and use web-push to send notifications.
 */
export interface PushSubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  expirationTime: number | null;
}

/**
 * Subscribe to push notifications (PWA). Call after notification permission is granted.
 * Returns the subscription to send to your backend; backend uses it with web-push to send
 * notifications that appear even when the app is not open.
 * Requires VAPID public key from backend (or use a static key in env).
 */
export const subscribeToPushNotifications = async (
  vapidPublicKey?: string
): Promise<PushSubscriptionPayload | null> => {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  const reg = await navigator.serviceWorker.ready;
  if (!reg.pushManager) return null;
  const key = vapidPublicKey || import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!key) {
    console.warn("Push: no VAPID public key; set VITE_VAPID_PUBLIC_KEY or pass vapidPublicKey");
    return null;
  }
  try {
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
    });
    const json = sub.toJSON();
    return {
      endpoint: json.endpoint!,
      keys: { p256dh: json.keys!.p256dh!, auth: json.keys!.auth! },
      expirationTime: json.expirationTime ?? null,
    };
  } catch (e) {
    console.warn("Push subscription failed:", e);
    return null;
  }
};

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) output[i] = rawData.charCodeAt(i);
  return output;
}

