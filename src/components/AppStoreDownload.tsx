import React from "react";
import { useAppStoreLinks } from "../hooks/useAppStoreLinks";

type AppStoreDownloadProps = {
  className?: string;
  heading?: string;
  description?: string;
};

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="app-store-download__glyph">
    <path
      fill="currentColor"
      d="M3.6 2.2c-.4.2-.6.6-.6 1.1v17.4c0 .5.2.9.6 1.1l10.1-9.8L3.6 2.2zm11.2 5.1L12.1 10l2.8 2.7 4.6-2.6c.7-.4.7-1.4 0-1.8l-4.7-2zm-2.7 6.6-2.7 2.7 8.6 4.9c.7.4 1.5-.1 1.5-.9v-.3l-7.4-6.4z"
    />
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="app-store-download__glyph">
    <path
      fill="currentColor"
      d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.9-3.5.9-.7 0-1.8-.8-3-.8-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.1 9 .8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7s1.7.7 3 .7c1.3 0 2.1-1.1 2.9-2.2.9-1.2 1.3-2.4 1.3-2.5-.1 0-2.5-1-2.6-3.7zm-2.4-6.6c.6-.8 1.1-1.9.9-3-1 .1-2.1.7-2.8 1.5-.6.7-1.2 1.9-.9 2.9 1.1.1 2.2-.5 2.8-1.4z"
    />
  </svg>
);

const StoreButton = ({
  href,
  kind,
  kicker,
  name,
}: {
  href: string;
  kind: "android" | "ios";
  kicker: string;
  name: string;
}) => {
  const available = Boolean(href);
  const className = `app-store-download__store app-store-download__store--${kind}${
    available ? "" : " app-store-download__store--soon"
  }`;
  const inner = (
    <>
      <span className="app-store-download__icon">
        {kind === "android" ? <PlayIcon /> : <AppleIcon />}
      </span>
      <span className="app-store-download__meta">
        <span className="app-store-download__kicker">
          {available ? kicker : "Coming soon"}
        </span>
        <span className="app-store-download__name">{name}</span>
      </span>
    </>
  );

  if (!available) {
    return <span className={className}>{inner}</span>;
  }

  return (
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {inner}
    </a>
  );
};

const AppStoreDownload: React.FC<AppStoreDownloadProps> = ({
  className = "",
  heading = "Download the app",
  description = "Carry JosCity with you — Android and iPhone.",
}) => {
  const { android_url, ios_url } = useAppStoreLinks();

  const compact = !heading;

  return (
    <div
      className={`app-store-download${compact ? " app-store-download--compact" : ""} ${className}`.trim()}
    >
      <div className="app-store-download__panel">
        {heading ? <span className="app-store-download__badge">Mobile</span> : null}
        {heading ? <h3 className="app-store-download__title">{heading}</h3> : null}
        {description ? (
          <p className="app-store-download__copy">{description}</p>
        ) : null}
        <div className="app-store-download__actions">
          <StoreButton
            href={android_url}
            kind="android"
            kicker="Get it on"
            name="Google Play"
          />
          <StoreButton
            href={ios_url}
            kind="ios"
            kicker="Download on the"
            name="App Store"
          />
        </div>
      </div>
    </div>
  );
};

export default AppStoreDownload;
