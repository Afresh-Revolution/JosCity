import React, { useState } from "react";
import { X } from "lucide-react";

interface CustomField {
  id: string;
  type: "text" | "textarea" | "select" | "date" | "number";
  label: string;
  placeholder?: string;
  options?: string[];
  required?: boolean;
}

interface JobApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ApplicationFormData) => void;
  jobRole: string;
  isRoleFixed?: boolean;
  customFormFields?: CustomField[];
  companyName?: string;
}

export interface ApplicationFormData {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  currentAddress?: string;
  educationStatus?: string[];
  role?: string;
  motivation?: string;
  attachment?: File | null;
  workRemotely?: boolean;
  customFields?: Record<string, string>;
}

const JobApplicationModal: React.FC<JobApplicationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  jobRole: _jobRole,
  isRoleFixed: _isRoleFixed = false,
  customFormFields = [],
  companyName,
}) => {
  const [_formData, setFormData] = useState<ApplicationFormData>({
    customFields: {},
  });

  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  const handleCustomFieldChange = (fieldId: string, value: string) => {
    setCustomFieldValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: ApplicationFormData = {
      customFields: customFieldValues,
    };
    onSubmit(submitData);
    // Reset form
    setFormData({
      customFields: {},
    });
    setCustomFieldValues({});
  };

  if (!isOpen) return null;

  return (
    <div className="job-application-modal-overlay" onClick={onClose}>
      <div
        className="job-application-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="job-application-modal__header">
          <h2 className="job-application-modal__title">
            {companyName || "Job Application"}
          </h2>
          <button
            className="job-application-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <form
          className="job-application-modal__form"
          onSubmit={handleSubmit}
        >
          {/* Custom Form Fields from Job */}
          {customFormFields.length > 0 ? (
            <div className="job-application-modal__section">
              {customFormFields.map((field) => (
                <div key={field.id} className="job-application-modal__field">
                  <label className="job-application-modal__label">
                    {field.label}
                    {field.required && <span className="job-application-modal__required">*</span>}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      value={customFieldValues[field.id] || ""}
                      onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                      className="job-application-modal__textarea"
                      rows={4}
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={customFieldValues[field.id] || ""}
                      onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                      className="job-application-modal__select"
                      required={field.required}
                    >
                      <option value="">Select {field.label}</option>
                      {field.options?.map((option, idx) => (
                        <option key={idx} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "date" ? (
                    <input
                      type="date"
                      value={customFieldValues[field.id] || ""}
                      onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                      className="job-application-modal__input"
                      required={field.required}
                    />
                  ) : field.type === "number" ? (
                    <input
                      type="number"
                      value={customFieldValues[field.id] || ""}
                      onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                      className="job-application-modal__input"
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  ) : (
                    <input
                      type="text"
                      value={customFieldValues[field.id] || ""}
                      onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                      className="job-application-modal__input"
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="job-application-modal__section">
              <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "2rem" }}>
                No application form fields have been configured for this job.
              </p>
            </div>
          )}

          {/* Submit Button */}
          {customFormFields.length > 0 && (
            <div className="job-application-modal__actions">
              <button
                type="submit"
                className="job-application-modal__submit-btn"
              >
                Submit Application
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default JobApplicationModal;
