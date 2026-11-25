export type MobilePlatform = "android" | "ios";

export function getMobilePlatform(
  device: Pick<Navigator, "userAgent" | "platform" | "maxTouchPoints"> = navigator,
): MobilePlatform | null {
  if (/android/i.test(device.userAgent)) return "android";
  if (/iPad|iPhone|iPod/i.test(device.userAgent) ||
      (/Mac/i.test(device.platform) && device.maxTouchPoints > 1)) return "ios";
  return null;
}
