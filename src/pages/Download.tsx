import { useEffect } from "react";
import AppStoreDownload from "../components/AppStoreDownload";
import { DEFAULT_LINKS } from "../hooks/useAppStoreLinks";
import { getMobilePlatform } from "../utils/mobilePlatform";

export default function Download() {
  const platform = getMobilePlatform();

  useEffect(() => {
    if (platform) {
      window.location.replace(
        platform === "ios" ? DEFAULT_LINKS.ios_url : DEFAULT_LINKS.android_url,
      );
    }
  }, [platform]);

  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24 }}>
      <section style={{ width: "100%", maxWidth: 540 }}>
        <h1>Download JosCity</h1>
        <p role="status">
          {platform ? "Redirecting to your app store…" : "Choose your phone’s app store to install JosCity."}
        </p>
        <AppStoreDownload heading="" description="" />
      </section>
    </main>
  );
}
