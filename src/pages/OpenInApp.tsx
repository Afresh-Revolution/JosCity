import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiUrl } from "../api/config";

const PLAY = "https://play.google.com/store/apps/details?id=com.joscity.app";

export default function OpenInApp() {
  const { kind = "", code = "" } = useParams();
  const [title, setTitle] = useState("JosCity");
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let live = true;
    void fetch(apiUrl(`/share/${encodeURIComponent(kind)}/${encodeURIComponent(code)}`))
      .then((response) => response.json())
      .then((data: { success?: boolean; appPath?: string; title?: string }) => {
        if (!live) return;
        if (!data?.success || !data.appPath) {
          setMissing(true);
          return;
        }
        setTitle(data.title || "JosCity");
        const path = data.appPath.replace(/^\/+/, "");
        const scheme = `joscity://${path}`;
        const android = /android/i.test(navigator.userAgent);
        window.location.href = android
          ? `intent://${path}#Intent;scheme=joscity;package=com.joscity.app;S.browser_fallback_url=${encodeURIComponent(window.location.href)};end`
          : scheme;
      })
      .catch(() => {
        if (live) setMissing(true);
      });
    return () => {
      live = false;
    };
  }, [code, kind]);

  return (
    <main style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: 24, fontFamily: "Montserrat, sans-serif" }}>
      <section style={{ maxWidth: 420, textAlign: "center" }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>{missing ? "Link unavailable" : "Opening JosCity"}</h1>
        <p style={{ color: "#4b5563", lineHeight: 1.5 }}>
          {missing
            ? "This link is no longer available."
            : `${title} opens in the JosCity app when it is installed on this phone.`}
        </p>
        {!missing ? (
          <p style={{ marginTop: 20 }}>
            <a href={PLAY}>Get JosCity on Google Play</a>
          </p>
        ) : null}
      </section>
    </main>
  );
}
