import React from "react";
import LazyImage from "./LazyImage";

interface OfferCardProps {
  offer: {
    id: number;
    title: string;
    image?: string;
    category?: string;
    company?: string;
    location?: string;
    discount?: number;
    valid_until?: string;
  };
  onClick?: () => void;
}

const OfferCard: React.FC<OfferCardProps> = ({ offer, onClick }) => {
  const defaultImage = "https://via.placeholder.com/300x450?text=No+Image";

  return (
    <div className="offer-card" onClick={onClick}>
      <div className="offer-card__image-wrapper">
        <LazyImage
          src={offer.image || defaultImage}
          alt={offer.title}
          className="offer-card__image"
        />
        {offer.discount && (
          <div className="offer-card__discount">
            <span>{offer.discount}%</span>
          </div>
        )}
      </div>
      <div className="offer-card__content">
        <h3 className="offer-card__title">{offer.title}</h3>
        <div className="offer-card__meta">
          {offer.company && <span className="offer-card__company">{offer.company}</span>}
          {offer.location && <span className="offer-card__location">{offer.location}</span>}
          {offer.valid_until && (
            <span className="offer-card__valid-until">Valid until {offer.valid_until}</span>
          )}
          {offer.category && (
            <span className="offer-card__category">{offer.category}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfferCard;

