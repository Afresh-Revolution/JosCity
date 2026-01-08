import React from "react";
import { Mail, Phone, MapPin, Briefcase, CheckCircle, XCircle } from "lucide-react";

interface ApplicationCardProps {
  application: {
    id: string;
    jobId: string;
    jobRole: string;
    jobCompany: string;
    applicantName: string;
    applicantEmail: string;
    applicantPhone: string;
    applicantAddress: string;
    educationStatus: string[];
    role: string;
    motivation: string;
    attachment: string | null;
    workRemotely: boolean;
    customFields?: Record<string, string>;
    status: "pending" | "accepted" | "rejected";
    appliedAt: string;
  };
  onAccept: (applicationId: string) => void;
  onReject: (applicationId: string) => void;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  onAccept,
  onReject,
}) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = () => {
    switch (application.status) {
      case "accepted":
        return (
          <span className="application-card__status application-card__status--accepted">
            <CheckCircle size={14} />
            Accepted
          </span>
        );
      case "rejected":
        return (
          <span className="application-card__status application-card__status--rejected">
            <XCircle size={14} />
            Rejected
          </span>
        );
      default:
        return (
          <span className="application-card__status application-card__status--pending">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="application-card">
      <div className="application-card__header">
        <div className="application-card__header-top">
          <h3 className="application-card__applicant-name">
            {application.applicantName}
          </h3>
          {getStatusBadge()}
        </div>
        <p className="application-card__job-info">
          Applied for: <strong>{application.jobRole}</strong> at {application.jobCompany}
        </p>
        <p className="application-card__applied-date">
          Applied on {formatDate(application.appliedAt)}
        </p>
      </div>

      <div className="application-card__content">
        <div className="application-card__info-item">
          <Mail size={16} className="application-card__icon" />
          <span>{application.applicantEmail}</span>
        </div>

        <div className="application-card__info-item">
          <Phone size={16} className="application-card__icon" />
          <span>{application.applicantPhone}</span>
        </div>

        <div className="application-card__info-item">
          <MapPin size={16} className="application-card__icon" />
          <span>{application.applicantAddress}</span>
        </div>

        <div className="application-card__info-item">
          <Briefcase size={16} className="application-card__icon" />
          <span>Role: {application.role}</span>
        </div>

        {application.educationStatus.length > 0 && (
          <div className="application-card__info-item">
            <span>Education Status: {application.educationStatus.join(", ")}</span>
          </div>
        )}

        {application.motivation && (
          <div className="application-card__section">
            <h4 className="application-card__section-title">Motivation</h4>
            <p className="application-card__text">{application.motivation}</p>
          </div>
        )}

        {application.customFields && Object.keys(application.customFields).length > 0 && (
          <div className="application-card__section">
            <h4 className="application-card__section-title">Additional Information</h4>
            {Object.entries(application.customFields).map(([key, value]) => (
              <div key={key} className="application-card__custom-field">
                <strong>{key}:</strong> {value}
              </div>
            ))}
          </div>
        )}

        {application.attachment && (
          <div className="application-card__section">
            <h4 className="application-card__section-title">Attachment</h4>
            <a
              href="#"
              className="application-card__attachment"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Implement file download
                console.log("Download attachment:", application.attachment);
              }}
            >
              {application.attachment}
            </a>
          </div>
        )}

        {application.workRemotely && (
          <div className="application-card__badge">
            <span>Work Remotely</span>
          </div>
        )}
      </div>

      {application.status === "pending" && (
        <div className="application-card__actions">
          <button
            className="application-card__btn application-card__btn--accept"
            onClick={() => onAccept(application.id)}
          >
            <CheckCircle size={16} />
            Accept
          </button>
          <button
            className="application-card__btn application-card__btn--reject"
            onClick={() => onReject(application.id)}
          >
            <XCircle size={16} />
            Reject
          </button>
        </div>
      )}
    </div>
  );
};

export default ApplicationCard;
