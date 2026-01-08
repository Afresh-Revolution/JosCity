import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  Edit2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

interface CustomField {
  id: string;
  type: "text" | "textarea" | "select" | "date" | "number";
  label: string;
  placeholder?: string;
  options?: string[]; // For select type
  required?: boolean;
}

interface JobFormData {
  role: string;
  jobDescription: string;
  jobRequirements: string;
  jobQualifications: string;
  jobDuration: string;
  applicationDeadline: string;
  category?: string;
  customFields?: CustomField[];
  applicationFormFields?: CustomField[];
  [key: string]: string | CustomField[] | undefined;
}

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: JobFormData) => void;
  initialData?: {
    role: string;
    jobDescription: string;
    jobRequirements: string;
    jobQualifications: string;
    jobDuration: string;
    applicationDeadline: string;
    category?: string;
    customFields?: CustomField[];
  };
}

const CreateJobModal: React.FC<CreateJobModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({
    role: "",
    jobDescription: "",
    jobRequirements: "",
    jobQualifications: "",
    jobDuration: "Contract",
    applicationDeadline: "",
    category: "Other",
  });

  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [currentPage, setCurrentPage] = useState<
    "job-details" | "application-form"
  >("job-details");
  const [applicationFormFields, setApplicationFormFields] = useState<
    CustomField[]
  >([]);
  const [editingAppFieldId, setEditingAppFieldId] = useState<string | null>(
    null
  );
  const [newAppFieldLabel, setNewAppFieldLabel] = useState("");
  const [newAppFieldType, setNewAppFieldType] =
    useState<CustomField["type"]>("text");

  // Populate form when initialData is provided (editing mode)
  useEffect(() => {
    if (initialData) {
      setFormData({
        role: initialData.role || "",
        jobDescription: initialData.jobDescription || "",
        jobRequirements: initialData.jobRequirements || "",
        jobQualifications: initialData.jobQualifications || "",
        jobDuration: initialData.jobDuration || "Contract",
        applicationDeadline: initialData.applicationDeadline || "",
        category: initialData.category || "Other",
      });
      setCustomFields(initialData.customFields || []);
    } else {
      // Reset form when creating new job
      setFormData({
        role: "",
        jobDescription: "",
        jobRequirements: "",
        jobQualifications: "",
        jobDuration: "Contract",
        applicationDeadline: "",
        category: "Other",
      });
      setCustomFields([]);
    }
  }, [initialData, isOpen]);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [newFieldType, setNewFieldType] = useState<CustomField["type"]>("text");
  const [newFieldLabel, setNewFieldLabel] = useState("");

  const jobDurationOptions = [
    "Contract",
    "Full-time",
    "Part-time",
    "Temporary",
    "Internship",
  ];

  const jobCategoryOptions = [
    "Admin & Office",
    "Arts & Designs",
    "Business & Operations",
    "Cleaning & Facilities",
    "Community & Social Service",
    "Computer & Data",
    "Constructions & Mining",
    "Education",
    "Farming & Forestry",
    "Healthcare",
    "Installation & maintenance Repair",
    "Legal",
    "management",
    "Manufacturing",
    "Media & Communication",
    "Personal Care",
    "Protective Service",
    "Restaurant & hospitality",
    "Retail & Sales",
    "Science & Engineering",
    "Sports & Entertainment",
    "Transportation",
    "Other",
  ];

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddCustomField = () => {
    if (!newFieldLabel.trim()) return;

    const newField: CustomField = {
      id: `custom-${Date.now()}`,
      type: newFieldType,
      label: newFieldLabel,
      placeholder: `Enter ${newFieldLabel.toLowerCase()}`,
      required: false,
    };

    if (newFieldType === "select") {
      newField.options = ["Option 1", "Option 2"];
    }

    setCustomFields((prev) => [...prev, newField]);
    setNewFieldLabel("");
    setNewFieldType("text");
  };

  const handleRemoveCustomField = (id: string) => {
    setCustomFields((prev) => prev.filter((field) => field.id !== id));
    setFormData((prev) => {
      const newData = { ...prev };
      delete newData[id];
      return newData;
    });
  };

  const handleEditField = (field: CustomField) => {
    setEditingFieldId(field.id);
    setIsEditingMode(true);
    setNewFieldLabel(field.label);
    setNewFieldType(field.type);
  };

  const handleSaveFieldEdit = () => {
    if (!newFieldLabel.trim() || !editingFieldId) return;

    setCustomFields((prev) =>
      prev.map((field) =>
        field.id === editingFieldId
          ? { ...field, label: newFieldLabel, type: newFieldType }
          : field
      )
    );

    setEditingFieldId(null);
    setIsEditingMode(false);
    setNewFieldLabel("");
    setNewFieldType("text");
  };

  const handleCustomFieldChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  // Handle application form field management
  const handleAddAppField = () => {
    if (!newAppFieldLabel.trim()) return;

    const newField: CustomField = {
      id: `app-field-${Date.now()}`,
      type: newAppFieldType,
      label: newAppFieldLabel,
      placeholder: `Enter ${newAppFieldLabel.toLowerCase()}`,
      required: false,
    };

    if (newAppFieldType === "select") {
      newField.options = ["Option 1", "Option 2"];
    }

    setApplicationFormFields((prev) => [...prev, newField]);
    setNewAppFieldLabel("");
    setNewAppFieldType("text");
  };

  const handleRemoveAppField = (id: string) => {
    setApplicationFormFields((prev) => prev.filter((field) => field.id !== id));
  };

  const handleEditAppField = (field: CustomField) => {
    setEditingAppFieldId(field.id);
    setNewAppFieldLabel(field.label);
    setNewAppFieldType(field.type);
  };

  const handleSaveAppFieldEdit = () => {
    if (!newAppFieldLabel.trim() || !editingAppFieldId) return;

    setApplicationFormFields((prev) =>
      prev.map((field) =>
        field.id === editingAppFieldId
          ? { ...field, label: newAppFieldLabel, type: newAppFieldType }
          : field
      )
    );

    setEditingAppFieldId(null);
    setNewAppFieldLabel("");
    setNewAppFieldType("text");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: JobFormData = {
      role: formData.role || "",
      jobDescription: formData.jobDescription || "",
      jobRequirements: formData.jobRequirements || "",
      jobQualifications: formData.jobQualifications || "",
      jobDuration: formData.jobDuration || "Contract",
      applicationDeadline: formData.applicationDeadline || "",
      category: formData.category || "Other",
      customFields,
      applicationFormFields,
      ...formData,
    };
    onSubmit(submitData);
    // Reset form
    setFormData({
      role: "",
      jobDescription: "",
      jobRequirements: "",
      jobQualifications: "",
      jobDuration: "Contract",
      applicationDeadline: "",
      category: "Other",
    });
    setCustomFields([]);
    setApplicationFormFields([]);
    setCurrentPage("job-details");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="create-job-modal-overlay" onClick={onClose}>
      <div className="create-job-modal" onClick={(e) => e.stopPropagation()}>
        <div className="create-job-modal__header">
          <h2 className="create-job-modal__title">Create Job</h2>
          <button
            className="create-job-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Page Navigation Tabs */}
        <div className="create-job-modal__tabs">
          <button
            type="button"
            className={`create-job-modal__tab ${
              currentPage === "job-details"
                ? "create-job-modal__tab--active"
                : ""
            }`}
            onClick={() => setCurrentPage("job-details")}
          >
            Job Details
          </button>
          <button
            type="button"
            className={`create-job-modal__tab ${
              currentPage === "application-form"
                ? "create-job-modal__tab--active"
                : ""
            }`}
            onClick={() => setCurrentPage("application-form")}
          >
            Application Form
          </button>
        </div>

        <form className="create-job-modal__form" onSubmit={handleSubmit}>
          {currentPage === "job-details" ? (
            <>
              <div className="create-job-modal__section">
                <label className="create-job-modal__label">Job Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="create-job-modal__select"
                  required
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
              </div>

              <div className="create-job-modal__section">
                <label className="create-job-modal__label">Job Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="create-job-modal__select"
                  required
                >
                  {jobCategoryOptions.map((category: string) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="create-job-modal__section">
                <label className="create-job-modal__label">
                  Job Description
                </label>
                <textarea
                  name="jobDescription"
                  value={formData.jobDescription}
                  onChange={handleInputChange}
                  className="create-job-modal__textarea"
                  rows={8}
                  placeholder="Enter detailed job description..."
                  required
                />
              </div>

              <div className="create-job-modal__section">
                <label className="create-job-modal__label">
                  Job Requirement
                </label>
                <textarea
                  name="jobRequirements"
                  value={formData.jobRequirements}
                  onChange={handleInputChange}
                  className="create-job-modal__textarea"
                  rows={6}
                  placeholder="Enter job requirements (one per line or bullet points)..."
                  required
                />
              </div>

              <div className="create-job-modal__section">
                <label className="create-job-modal__label">
                  Job Qualifications
                </label>
                <textarea
                  name="jobQualifications"
                  value={formData.jobQualifications}
                  onChange={handleInputChange}
                  className="create-job-modal__textarea"
                  rows={6}
                  placeholder="Enter job qualifications (one per line or bullet points)..."
                  required
                />
              </div>

              <div className="create-job-modal__section create-job-modal__section--grid">
                <div className="create-job-modal__grid-item">
                  <label className="create-job-modal__label">
                    Job Duration
                  </label>
                  <select
                    name="jobDuration"
                    value={formData.jobDuration}
                    onChange={handleInputChange}
                    className="create-job-modal__select"
                    required
                  >
                    {jobDurationOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="create-job-modal__grid-item">
                  <label className="create-job-modal__label">
                    Application deadline
                  </label>
                  <input
                    type="date"
                    name="applicationDeadline"
                    value={formData.applicationDeadline}
                    onChange={handleInputChange}
                    className="create-job-modal__input"
                    required
                  />
                </div>
              </div>

              {/* Custom Fields Section */}
              {customFields.map((field) => (
                <div key={field.id} className="create-job-modal__section">
                  <div className="create-job-modal__field-header">
                    <label className="create-job-modal__label">
                      {field.label}
                    </label>
                    <div className="create-job-modal__field-actions">
                      <button
                        type="button"
                        className="create-job-modal__icon-btn"
                        onClick={() => handleEditField(field)}
                        aria-label="Edit field"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        className="create-job-modal__icon-btn"
                        onClick={() => handleRemoveCustomField(field.id)}
                        aria-label="Remove field"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {editingFieldId === field.id && isEditingMode ? (
                    <div className="create-job-modal__edit-field">
                      <input
                        type="text"
                        value={newFieldLabel}
                        onChange={(e) => setNewFieldLabel(e.target.value)}
                        className="create-job-modal__input"
                        placeholder="Field label"
                      />
                      <select
                        value={newFieldType}
                        onChange={(e) =>
                          setNewFieldType(e.target.value as CustomField["type"])
                        }
                        className="create-job-modal__select"
                      >
                        <option value="text">Text</option>
                        <option value="textarea">Textarea</option>
                        <option value="select">Select</option>
                        <option value="date">Date</option>
                        <option value="number">Number</option>
                      </select>
                      <button
                        type="button"
                        className="create-job-modal__save-btn"
                        onClick={handleSaveFieldEdit}
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <>
                      {field.type === "textarea" ? (
                        <textarea
                          value={formData[field.id] || ""}
                          onChange={(e) =>
                            handleCustomFieldChange(field.id, e.target.value)
                          }
                          className="create-job-modal__textarea"
                          rows={4}
                          placeholder={field.placeholder}
                        />
                      ) : field.type === "select" ? (
                        <select
                          value={formData[field.id] || ""}
                          onChange={(e) =>
                            handleCustomFieldChange(field.id, e.target.value)
                          }
                          className="create-job-modal__select"
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
                          value={formData[field.id] || ""}
                          onChange={(e) =>
                            handleCustomFieldChange(field.id, e.target.value)
                          }
                          className="create-job-modal__input"
                        />
                      ) : field.type === "number" ? (
                        <input
                          type="number"
                          value={formData[field.id] || ""}
                          onChange={(e) =>
                            handleCustomFieldChange(field.id, e.target.value)
                          }
                          className="create-job-modal__input"
                          placeholder={field.placeholder}
                        />
                      ) : (
                        <input
                          type="text"
                          value={formData[field.id] || ""}
                          onChange={(e) =>
                            handleCustomFieldChange(field.id, e.target.value)
                          }
                          className="create-job-modal__input"
                          placeholder={field.placeholder}
                        />
                      )}
                    </>
                  )}
                </div>
              ))}

              {/* Add Custom Field Section */}
              <div className="create-job-modal__section create-job-modal__add-field">
                <label className="create-job-modal__label">
                  Add Custom Field
                </label>
                <div className="create-job-modal__add-field-controls">
                  <input
                    type="text"
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                    className="create-job-modal__input"
                    placeholder="Field label"
                  />
                  <select
                    value={newFieldType}
                    onChange={(e) =>
                      setNewFieldType(e.target.value as CustomField["type"])
                    }
                    className="create-job-modal__select"
                  >
                    <option value="text">Text</option>
                    <option value="textarea">Textarea</option>
                    <option value="select">Select</option>
                    <option value="date">Date</option>
                    <option value="number">Number</option>
                  </select>
                  <button
                    type="button"
                    className="create-job-modal__add-btn"
                    onClick={handleAddCustomField}
                  >
                    <Plus size={16} />
                    Add Field
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Application Form Builder Page */
            <div className="create-job-modal__application-form-page">
              <div className="create-job-modal__section">
                <h3 className="create-job-modal__section-title">
                  Create Application Form
                </h3>
                <p className="create-job-modal__section-description">
                  Design the form that applicants will fill out when applying
                  for this job.
                </p>
              </div>

              {/* Existing Application Form Fields */}
              {applicationFormFields.length > 0 && (
                <div className="create-job-modal__section">
                  <label className="create-job-modal__label">
                    Application Form Fields
                  </label>
                  {applicationFormFields.map((field) => (
                    <div
                      key={field.id}
                      className="create-job-modal__field-item"
                    >
                      {editingAppFieldId === field.id ? (
                        <div className="create-job-modal__edit-field">
                          <input
                            type="text"
                            value={newAppFieldLabel}
                            onChange={(e) =>
                              setNewAppFieldLabel(e.target.value)
                            }
                            className="create-job-modal__input"
                            placeholder="Field label"
                          />
                          <select
                            value={newAppFieldType}
                            onChange={(e) =>
                              setNewAppFieldType(
                                e.target.value as CustomField["type"]
                              )
                            }
                            className="create-job-modal__select"
                          >
                            <option value="text">Text</option>
                            <option value="textarea">Textarea</option>
                            <option value="select">Select</option>
                            <option value="date">Date</option>
                            <option value="number">Number</option>
                          </select>
                          <button
                            type="button"
                            className="create-job-modal__save-btn"
                            onClick={handleSaveAppFieldEdit}
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="create-job-modal__field-display">
                          <span className="create-job-modal__field-label">
                            {field.label} ({field.type})
                          </span>
                          <div className="create-job-modal__field-actions">
                            <button
                              type="button"
                              className="create-job-modal__edit-btn"
                              onClick={() => handleEditAppField(field)}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              className="create-job-modal__delete-btn"
                              onClick={() => handleRemoveAppField(field.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add Application Form Field */}
              <div className="create-job-modal__section create-job-modal__add-field">
                <label className="create-job-modal__label">
                  Add Application Form Field
                </label>
                <div className="create-job-modal__add-field-controls">
                  <input
                    type="text"
                    value={newAppFieldLabel}
                    onChange={(e) => setNewAppFieldLabel(e.target.value)}
                    className="create-job-modal__input"
                    placeholder="Field label (e.g., Years of Experience)"
                  />
                  <select
                    value={newAppFieldType}
                    onChange={(e) =>
                      setNewAppFieldType(e.target.value as CustomField["type"])
                    }
                    className="create-job-modal__select"
                  >
                    <option value="text">Text</option>
                    <option value="textarea">Textarea</option>
                    <option value="select">Select</option>
                    <option value="date">Date</option>
                    <option value="number">Number</option>
                  </select>
                  <button
                    type="button"
                    className="create-job-modal__add-btn"
                    onClick={handleAddAppField}
                  >
                    <Plus size={16} />
                    Add Field
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="create-job-modal__actions">
            {currentPage === "application-form" ? (
              <>
                <button
                  type="button"
                  className="create-job-modal__nav-btn"
                  onClick={() => setCurrentPage("job-details")}
                >
                  <ChevronLeft size={16} />
                  Back
                </button>
                <button
                  type="button"
                  className="create-job-modal__cancel-btn"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="create-job-modal__submit-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage("job-details");
                  }}
                >
                  Continue to Job Details
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="create-job-modal__cancel-btn"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="create-job-modal__nav-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage("application-form");
                  }}
                >
                  Next: Application Form
                  <ChevronRight size={16} />
                </button>
                <button type="submit" className="create-job-modal__submit-btn">
                  Publish
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateJobModal;
