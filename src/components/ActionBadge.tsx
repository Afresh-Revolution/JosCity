import { AlertCircle, CheckCircle, X } from "lucide-react";

type Props = {
  variant: "success" | "error";
  message: string;
  onDismiss: () => void;
};

export default function ActionBadge({ variant, message, onDismiss }: Props) {
  return (
    <div
      className={`joscity-action-badge joscity-action-badge--${variant}`}
      role="status"
    >
      {variant === "success" ? (
        <CheckCircle size={20} className="joscity-action-badge__icon" aria-hidden />
      ) : (
        <AlertCircle size={20} className="joscity-action-badge__icon" aria-hidden />
      )}
      <span className="joscity-action-badge__text">{message}</span>
      <button
        type="button"
        className="joscity-action-badge__dismiss"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}
