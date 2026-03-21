import React, { useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle, XCircle, X, Eye } from "lucide-react";

interface CustomField {
  id: string;
  type: "text" | "textarea" | "select" | "date" | "number";
  label: string;
  placeholder?: string;
  options?: string[];
  required?: boolean;
  
}

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
  applicationFormFields?: CustomField[];
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  onAccept,
  onReject,
  applicationFormFields = [],
}) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
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

  // Get applicant name from custom fields (look for "Full Name" or "Name")
  const getApplicantName = () => {
    if (!application.customFields || Object.keys(application.customFields).length === 0) {
      return application.applicantName; // Fallback to default
    }

    // Find field with label "Full Name" or "Name"
    const nameField = applicationFormFields.find(
      (field) => 
        field.label.toLowerCase() === "full name" || 
        field.label.toLowerCase() === "name"
    );

    if (nameField && application.customFields[nameField.id]) {
      return application.customFields[nameField.id];
    }

    // Fallback to default if not found
    return application.applicantName;
  };

  const popupContent = isPopupOpen ? (
    <div 
      className="application-card__popup-overlay"
      onClick={() => setIsPopupOpen(false)}
    >
      <div 
        className="application-card__popup"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="application-card__popup-header">
          <h3 className="application-card__popup-title">
            Application Details
          </h3>
          <button
            className="application-card__popup-close"
            onClick={() => setIsPopupOpen(false)}
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <div className="application-card__content">
          {application.customFields && Object.keys(application.customFields).length > 0 ? (
            <div className="application-card__section">
              {Object.entries(application.customFields).map(([fieldId, value]) => {
                // Find the field definition to get the label
                const fieldDefinition = applicationFormFields.find((field) => field.id === fieldId);
                const fieldLabel = fieldDefinition?.label || fieldId;
                
                return (
                  <div key={fieldId} className="application-card__custom-field">
                    <strong>{fieldLabel}:</strong> {value}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="application-card__section">
              <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "1rem" }}>
                No application data available.
              </p>
            </div>
          )}
        </div>

        {application.status === "pending" && (
          <div className="application-card__popup-actions">
            <button
              className="application-card__btn application-card__btn--accept"
              onClick={() => {
                onAccept(application.id);
                setIsPopupOpen(false);
              }}
            >
              <CheckCircle size={16} />
              Accept
            </button>
            <button
              className="application-card__btn application-card__btn--reject"
              onClick={() => {
                onReject(application.id);
                setIsPopupOpen(false);
              }}
            >
              <XCircle size={16} />
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="application-card">
        <div className="application-card__header">
          <div className="application-card__header-top">
            <h3 className="application-card__applicant-name">
              {getApplicantName()}
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

        <div className="application-card__actions">
          <button
            className="application-card__btn application-card__btn--view"
            onClick={() => setIsPopupOpen(true)}
          >
            <Eye size={16} />
            View
          </button>
        </div>
      </div>

      {/* Popup Modal - Rendered via Portal outside the card */}
      {typeof document !== "undefined" && document.body
        ? createPortal(popupContent, document.body)
        : popupContent}
    </>
  );
};

export default ApplicationCard;
