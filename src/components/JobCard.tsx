import React from "react";
import LazyImage from "./LazyImage";

interface JobCardProps {
  job: {
    id: number;
    title: string;
    image?: string;
    category?: string;
    company?: string;
    location?: string;
    type?: string;
    year?: number;
    rating?: number;
  };
  onClick?: () => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onClick }) => {
  const defaultImage = "https://via.placeholder.com/300x450?text=No+Image";

  return (
    <div className="job-card" onClick={onClick}>
      <div className="job-card__image-wrapper">
        <LazyImage
          src={job.image || defaultImage}
          alt={job.title}
          className="job-card__image"
        />
        {job.rating && (
          <div className="job-card__rating">
            <span>⭐</span>
            <span>{job.rating.toFixed(1)}</span>
          </div>
        )}
      </div>
      <div className="job-card__content">
        <h3 className="job-card__title">{job.title}</h3>
        <div className="job-card__meta">
          {job.company && <span className="job-card__company">{job.company}</span>}
          {job.location && <span className="job-card__location">{job.location}</span>}
          {job.year && <span className="job-card__year">{job.year}</span>}
          {job.category && (
            <span className="job-card__category">{job.category}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobCard;



