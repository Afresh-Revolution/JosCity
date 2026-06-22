import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PageBackButtonProps {
  to?: string;
  fallbackTo?: string;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

export default function PageBackButton({
  to,
  fallbackTo = "/",
  disabled = false,
  ariaLabel = "Go back",
  className = "",
}: PageBackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (disabled) return;

    if (to) {
      navigate(to);
      return;
    }

    const historyIdx = window.history.state?.idx;
    if (typeof historyIdx === "number" && historyIdx > 0) {
      navigate(-1);
      return;
    }

    navigate(fallbackTo);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`page-back-button${className ? ` ${className}` : ""}`}
      aria-label={ariaLabel}
      disabled={disabled}
    >
      <ArrowLeft size={20} />
    </button>
  );
}
