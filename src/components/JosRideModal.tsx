import { useEffect, useRef, useState } from "react";
import { Car, Smartphone, X, ArrowUpRight, User } from "lucide-react";
import { getMobilePlatform } from "../utils/mobilePlatform";
import "./JosRideModal.css";

interface JosRideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const apps = {
  passenger: {
    android: "https://play.google.com/store/apps/details?id=ng.josride.app&pcampaignid=web_share",
    ios: "https://apps.apple.com/ng/app/josride/id6805468513",
  },
  driver: {
    android: "https://play.google.com/store/apps/details?id=com.josride.drive&pcampaignid=web_share",
    ios: "https://apps.apple.com/ng/app/josride-driver/id6805659224",
  },
};
type Role = keyof typeof apps;

export default function JosRideModal({ isOpen, onClose }: JosRideModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) return;
    setSelectedRole(null);
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

  const chooseRole = (role: Role) => {
    const platform = getMobilePlatform();
    if (platform) window.location.assign(apps[role][platform]);
    else setSelectedRole(role);
  };

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
        <p id="josride-description" aria-live="polite">{selectedRole
          ? `Choose your phone's store to install the ${selectedRole} app.`
          : "Join as a passenger or driver to download your app."}</p>
        <div className="josride-card__options">
          {selectedRole ? (["android", "ios"] as const).map((platform) => (
            <a key={platform} className="josride-card__download" href={apps[selectedRole][platform]}>
              <Smartphone size={24} aria-hidden="true" />
              <span><strong>{platform === "android" ? "Google Play" : "App Store"}</strong><small>{platform === "android" ? "Android" : "iPhone and iPad"}</small></span>
              <ArrowUpRight size={18} aria-hidden="true" />
            </a>
          )) : (["passenger", "driver"] as const).map((role) => (
            <button key={role} type="button" className="josride-card__download" onClick={() => chooseRole(role)}>
              {role === "passenger" ? <User size={24} aria-hidden="true" /> : <Car size={24} aria-hidden="true" />}
              <span><strong>{role === "passenger" ? "Passenger" : "Driver"}</strong><small>{role === "passenger" ? "Book a ride" : "Drive with JosRide"}</small></span>
              <ArrowUpRight size={18} aria-hidden="true" />
            </button>
          ))}
        </div>
        {selectedRole && <button type="button" className="josride-card__back" onClick={() => setSelectedRole(null)}>Back to passenger or driver</button>}
      </div>
    </dialog>
  );
}
