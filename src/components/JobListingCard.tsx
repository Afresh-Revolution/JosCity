import React from "react";
import { Briefcase, Clock } from "lucide-react";
import {
  getUserAvatar,
  getUserInitials,
  getUserName,
} from "../utils/userUtils";

interface JobListingCardProps {
  job: {
    id: string;
    role: string;
    jobDuration: string;
    applicationDeadline: string;
    companyName?: string;
  };
  onEdit?: (jobId: string) => void;
  onDelete?: (jobId: string) => void;
  onApply?: (jobId: string) => void;
  showApplyButton?: boolean;
  isApplied?: boolean;
}

const JobListingCard: React.FC<JobListingCardProps> = ({
  job,
  onEdit,
  onDelete,
  onApply,
  showApplyButton = false,
  isApplied = false,
}) => {
  const avatarUrl = getUserAvatar();
  const initials = getUserInitials();
  const username = getUserName();

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="job-listing-card">
      <div className="job-listing-card__header">
        <div className="job-listing-card__avatar">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={username}
              className="job-listing-card__avatar-img"
            />
          ) : (
            <div className="job-listing-card__avatar-initials">{initials}</div>
          )}
        </div>
        <h3 className="job-listing-card__company">
          {job.companyName || username}
        </h3>
      </div>

      <div className="job-listing-card__content">
        <div className="job-listing-card__info">
          <Briefcase size={16} className="job-listing-card__icon" />
          <span className="job-listing-card__text">{job.role}</span>
        </div>

        <div className="job-listing-card__info">
          <Clock size={16} className="job-listing-card__icon" />
          <span className="job-listing-card__text">
            Duration: {job.jobDuration}
          </span>
        </div>

        <div className="job-listing-card__info">
          <span className="job-listing-card__text">
            Deadline: {formatDate(job.applicationDeadline)}
          </span>
        </div>
      </div>

      <div className="job-listing-card__actions">
        {showApplyButton ? (
          <button
            className={`job-listing-card__btn job-listing-card__btn--apply ${
              isApplied ? "job-listing-card__btn--applied" : ""
            }`}
            onClick={() => !isApplied && onApply?.(job.id)}
            aria-label={isApplied ? "Already applied" : "Apply for job"}
            disabled={isApplied}
          >
            {isApplied ? "Applied" : "Apply"}
          </button>
        ) : (
          <>
            <button
              className="job-listing-card__btn job-listing-card__btn--edit"
              onClick={() => onEdit?.(job.id)}
              aria-label="Edit job"
            >
              Edit
            </button>
            <button
              className="job-listing-card__btn job-listing-card__btn--delete"
              onClick={() => onDelete?.(job.id)}
              aria-label="Delete job"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default JobListingCard;
