import { Star } from "lucide-react";

export default function AgentStars({
  value,
  onSelect,
  label,
}: {
  value: number;
  onSelect?: (rating: number) => void;
  label?: string;
}) {
  const rating = Number(value) || 0;
  return (
    <div className="agent-stars" role={onSelect ? "radiogroup" : "img"} aria-label={label || `${rating} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= rating;
        const inner = (
          <Star
            size={onSelect ? 32 : 16}
            fill={filled ? "#E8B923" : "none"}
            color={filled ? "#E8B923" : "currentColor"}
            aria-hidden="true"
          />
        );
        if (!onSelect) return <span key={star}>{inner}</span>;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === rating}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
            className="agent-stars__btn"
            onClick={() => onSelect(star)}
          >
            {inner}
          </button>
        );
      })}
    </div>
  );
}
