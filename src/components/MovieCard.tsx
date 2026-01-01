import React from "react";
import LazyImage from "./LazyImage";

interface MovieCardProps {
  movie: {
    id: number;
    title: string;
    image?: string;
    category?: string;
    year?: number;
    rating?: number;
  };
  onClick?: () => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick }) => {
  const defaultImage = "https://via.placeholder.com/300x450?text=No+Image";

  return (
    <div className="movie-card" onClick={onClick}>
      <div className="movie-card__image-wrapper">
        <LazyImage
          src={movie.image || defaultImage}
          alt={movie.title}
          className="movie-card__image"
        />
        {movie.rating && (
          <div className="movie-card__rating">
            <span>⭐</span>
            <span>{movie.rating.toFixed(1)}</span>
          </div>
        )}
      </div>
      <div className="movie-card__content">
        <h3 className="movie-card__title">{movie.title}</h3>
        <div className="movie-card__meta">
          {movie.year && <span className="movie-card__year">{movie.year}</span>}
          {movie.category && (
            <span className="movie-card__category">{movie.category}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;

