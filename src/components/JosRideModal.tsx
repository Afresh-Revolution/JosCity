import { useEffect, useRef } from "react";
import { Car, Smartphone, X, ArrowUpRight } from "lucide-react";
import "./JosRideModal.css";

interface JosRideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Fixed HTTPS store destinations; no user-provided URLs or HTML.
const passengerApps = [
  { label: "Android", store: "Play Store", url: "" },
  { label: "IOS", store: "App Store", url: "https://apps.apple.com/ng/app/josride/id6805468513" },
];

// Paste each driver app's HTTPS download/store link into its empty url below.
// Leave it empty to keep that download button disabled.
const driverApps = [
  { label: "Android", store: "Direct download", url: "https://expo.dev/artifacts/eas/MSUPhr3V0rU1afHcg2u41SlnbwVY2v3VjjzapX4nKgg.apk" },
  { label: "IOS", store: "App Store", url: "https://apps.apple.com/ng/app/josride-driver/id6805659224" },
].map((app) => {
  try {
    const url = new URL(app.url.trim());
    const allowedHosts =
      app.store === "App Store"
        ? ["apps.apple.com"]
        : ["play.google.com", "expo.dev"];
    const isAllowed =
      url.protocol === "https:" &&
      allowedHosts.includes(url.hostname) &&
      !url.username &&
      !url.password;
    return { ...app, url: isAllowed ? url.href : "" };
  } catch {
    return { ...app, url: "" };
  }
});

export default function JosRideModal({ isOpen, onClose }: JosRideModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) return;
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [isOpen]);

  return (
    <dialog ref={dialogRef} className="josride-card" aria-labelledby="josride-title"
      aria-describedby="josride-description"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="josride-card__body">
        <button type="button" className="josride-card__close" aria-label="Close JosRide downloads" onClick={onClose} autoFocus><X size={22} /></button>
        <div className="josride-card__icon"><Car size={30} aria-hidden="true" /></div>
        <p className="josride-card__eyebrow">YOUR CITY. YOUR RIDE.</p>
        <h2 id="josride-title">Ride with JosRide</h2>
        <p id="josride-description">Choose your device to download the app and get moving around Jos.</p>
        <section aria-labelledby="josride-passenger-title">
          <h3 id="josride-passenger-title">Passenger app</h3>
          <div className="josride-card__options">
            {passengerApps.map((app) => (
              <a key={app.label} className="josride-card__download" href={app.url} target="_blank" rel="noopener noreferrer" aria-label={`Download JosRide for ${app.label} on ${app.store} (opens in a new tab)`}>
                <Smartphone size={24} aria-hidden="true" /><span><strong>{app.label}</strong><small>{app.store}</small></span><ArrowUpRight size={18} aria-hidden="true" />
              </a>
            ))}
          </div>
        </section>
        <section className="josride-card__drivers" aria-labelledby="josride-driver-title">
          <h3 id="josride-driver-title">Drive with JosRide</h3>
          <p>{driverApps.some((app) => app.url) ? "Choose your device to download the driver app." : "Driver app downloads will be available soon."}</p>
          <div className="josride-card__options">
            {driverApps.map((app) => app.url ? (
              <a key={app.label} className="josride-card__download" href={app.url} target="_blank" rel="noopener noreferrer" aria-label={`Download JosRide driver app for ${app.label} on ${app.store} (opens in a new tab)`}>
                <Smartphone size={24} aria-hidden="true" /><span><strong>{app.label}</strong><small>{app.store}</small></span><ArrowUpRight size={18} aria-hidden="true" />
              </a>
            ) : (
              <button key={app.label} type="button" className="josride-card__download" disabled aria-label={`JosRide driver app for ${app.label}: coming soon`}>
                <Smartphone size={24} aria-hidden="true" /><span><strong>{app.label}</strong><small>Coming soon</small></span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </dialog>
  );
}
