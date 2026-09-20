import { useEffect, useState } from "react";
import { apiUrl } from "../api/config";

export type AppStoreLinks = {
  android_url: string;
  ios_url: string;
};

const DEFAULT_LINKS: AppStoreLinks = {
  android_url:
    "https://expo.dev/artifacts/eas/A4k01OyriMyNyU3e5N8MlvQmb2fm-4hD48U3VxWD8jc.apk",
  ios_url: "https://apps.apple.com/ng/app/joscity/id6805214004",
};

export function useAppStoreLinks() {
  const [links, setLinks] = useState<AppStoreLinks>(DEFAULT_LINKS);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(apiUrl("/app-stores"));
        const json = (await response.json()) as { data?: AppStoreLinks };
        if (cancelled) return;
        setLinks({
          android_url: DEFAULT_LINKS.android_url,
          ios_url: String(json.data?.ios_url || "").trim(),
        });
      } catch {
        if (!cancelled) setLinks(DEFAULT_LINKS);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return links;
}
