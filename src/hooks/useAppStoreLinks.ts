import { useEffect, useState } from "react";
import { apiUrl } from "../api/config";

export type AppStoreLinks = {
  android_url: string;
  ios_url: string;
};

const EMPTY: AppStoreLinks = { android_url: "", ios_url: "" };

export function useAppStoreLinks() {
  const [links, setLinks] = useState<AppStoreLinks>(EMPTY);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(apiUrl("/app-stores"));
        const json = (await response.json()) as { data?: AppStoreLinks };
        if (cancelled) return;
        setLinks({
          android_url: String(json.data?.android_url || "").trim(),
          ios_url: String(json.data?.ios_url || "").trim(),
        });
      } catch {
        if (!cancelled) setLinks(EMPTY);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return links;
}
