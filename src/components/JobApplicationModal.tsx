import React, { useState, useEffect } from "react";
import { X, Upload, Info } from "lucide-react";

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
}

interface ApplicationFormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  currentAddress: string;
  educationStatus: string[];
  role: string;
  motivation: string;
  attachment: File | null;
  workRemotely: boolean;
  customFields?: Record<string, string>;
}

const JobApplicationModal: React.FC<JobApplicationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  jobRole,
  isRoleFixed = false,
  customFormFields = [],
}) => {
  const [formData, setFormData] = useState<ApplicationFormData>({
    fullName: "",
    email: "",
    phoneNumber: "",
    currentAddress: "",
    educationStatus: [],
    role: jobRole || "",
    motivation: "",
    attachment: null,
    workRemotely: false,
    customFields: {},
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  // Work remotely is a badge (always true), not a checkbox
  useEffect(() => {
    setFormData((prev) => ({ ...prev, workRemotely: true }));
  }, []);

  // Set role from jobRole prop
  useEffect(() => {
    if (jobRole) {
      setFormData((prev) => ({ ...prev, role: jobRole }));
    }
  }, [jobRole]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setFormData((prev) => {
      const status = prev.educationStatus;
      if (checked) {
        return {
          ...prev,
          educationStatus: [...status, value],
        };
      } else {
        return {
          ...prev,
          educationStatus: status.filter((s) => s !== value),
        };
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setFormData((prev) => ({ ...prev, attachment: file }));
  };

  const handleCustomFieldChange = (fieldId: string, value: string) => {
    setCustomFieldValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: ApplicationFormData = {
      ...formData,
      customFields: customFieldValues,
    };
    onSubmit(submitData);
    // Reset form
    setFormData({
      fullName: "",
      email: "",
      phoneNumber: "",
      currentAddress: "",
      educationStatus: [],
      role: jobRole || "",
      motivation: "",
      attachment: null,
      workRemotely: false,
      customFields: {},
    });
    setCustomFieldValues({});
    setSelectedFile(null);
  };

  if (!isOpen) return null;

  return (
    <div className="job-application-modal-overlay" onClick={onClose}>
      <div
        className="job-application-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="job-application-modal__header">
          <h2 className="job-application-modal__title">Create Job</h2>
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
          {/* Personal Information Section */}
          <div className="job-application-modal__section">
            <h3 className="job-application-modal__section-title">
              Personal Information
            </h3>
            <div className="job-application-modal__grid">
              <div className="job-application-modal__field">
                <label className="job-application-modal__label">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="job-application-modal__input"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div className="job-application-modal__field">
                <label className="job-application-modal__label">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="job-application-modal__input"
                  placeholder="Enter your email address"
                  required
                />
              </div>
              <div className="job-application-modal__field">
                <label className="job-application-modal__label">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="job-application-modal__input"
                  placeholder="Enter your phone number"
                  required
                />
              </div>
              <div className="job-application-modal__field">
                <label className="job-application-modal__label">
                  Current Address (City/State)
                </label>
                <input
                  type="text"
                  name="currentAddress"
                  value={formData.currentAddress}
                  onChange={handleInputChange}
                  className="job-application-modal__input"
                  placeholder="Enter your current address"
                  required
                />
              </div>
            </div>
          </div>

          {/* Education Status Section */}
          <div className="job-application-modal__section">
            <h3 className="job-application-modal__section-title">
              Education Status
            </h3>
            <div className="job-application-modal__checkbox-group">
              {["Student", "Graduate", "NYSC", "Unemployed", "Others"].map(
                (status) => (
                  <label
                    key={status}
                    className="job-application-modal__checkbox-label"
                  >
                    <input
                      type="checkbox"
                      value={status}
                      checked={formData.educationStatus.includes(status)}
                      onChange={handleCheckboxChange}
                      className="job-application-modal__checkbox"
                    />
                    <span>{status}</span>
                  </label>
                )
              )}
            </div>
          </div>

          {/* Role Section */}
          <div className="job-application-modal__section">
            <h3 className="job-application-modal__section-title">Role</h3>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="job-application-modal__select"
              required
              disabled={isRoleFixed}
            >
              <option value="">Select Role</option>
              <option value="Managing Director">Managing Director</option>
              <option value="CEO">CEO</option>
              <option value="Operations Manager">Operations Manager</option>
              <option value="Project Manager">Project Manager</option>
              <option value="Software Developer">Software Developer</option>
              <option value="Marketing Manager">Marketing Manager</option>
              <option value="HR Manager">HR Manager</option>
              <option value="Finance Manager">Finance Manager</option>
            </select>
            {isRoleFixed && (
              <p className="job-application-modal__role-note">
                <Info size={14} /> This role is fixed for this job posting.
              </p>
            )}
          </div>

          {/* Working days & Time Section */}
          <div className="job-application-modal__section">
            <h3 className="job-application-modal__section-title">
              Working days & Time
            </h3>
            <div className="job-application-modal__working-hours">
              <p>Mondays: 10am - 5pm</p>
              <p>Wednesday: 10am - 5pm</p>
              <p>Friday: 10am - 4pm</p>
            </div>
          </div>

          {/* Motivation Section */}
          <div className="job-application-modal__section">
            <h3 className="job-application-modal__section-title">
              Motivation
            </h3>
            <textarea
              name="motivation"
              value={formData.motivation}
              onChange={handleInputChange}
              className="job-application-modal__textarea"
              rows={6}
              placeholder="Why do you want to work with us? (Short Answer)"
              required
            />
          </div>

          {/* Attachment Section */}
          <div className="job-application-modal__section">
            <h3 className="job-application-modal__section-title">
              Attachment
            </h3>
            <div className="job-application-modal__file-upload">
              <input
                type="file"
                id="file-upload"
                onChange={handleFileChange}
                className="job-application-modal__file-input"
                accept=".pdf,.doc,.docx"
              />
              <label
                htmlFor="file-upload"
                className="job-application-modal__file-label"
              >
                <Upload size={24} />
                <span>{selectedFile ? selectedFile.name : "Upload File"}</span>
              </label>
            </div>
          </div>

          {/* Custom Form Fields from Job */}
          {customFormFields.length > 0 && (
            <div className="job-application-modal__section">
              <h3 className="job-application-modal__section-title">
                Additional Information
              </h3>
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
          )}

          {/* Work Remotely Badge */}
          <div className="job-application-modal__section">
            <div className="job-application-modal__remote-badge">
              <Info size={16} />
              <span>Work is remotely</span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="job-application-modal__actions">
            <button
              type="submit"
              className="job-application-modal__submit-btn"
            >
              Submit Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobApplicationModal;
