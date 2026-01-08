import React, { useState } from "react";
import { X, Plus, Trash2, Edit2 } from "lucide-react";

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
  customFields?: CustomField[];
  [key: string]: string | CustomField[] | undefined;
}

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: JobFormData) => void;
}

const CreateJobModal: React.FC<CreateJobModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({
    role: "",
    jobDescription: "",
    jobRequirements: "",
    jobQualifications: "",
    jobDuration: "Contract",
    applicationDeadline: "",
  });

  const [customFields, setCustomFields] = useState<CustomField[]>([]);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: JobFormData = {
      role: formData.role || "",
      jobDescription: formData.jobDescription || "",
      jobRequirements: formData.jobRequirements || "",
      jobQualifications: formData.jobQualifications || "",
      jobDuration: formData.jobDuration || "Contract",
      applicationDeadline: formData.applicationDeadline || "",
      customFields,
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
    });
    setCustomFields([]);
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

        <form className="create-job-modal__form" onSubmit={handleSubmit}>
          <div className="create-job-modal__section">
            <label className="create-job-modal__label">Job Description</label>
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
            <label className="create-job-modal__label">Job Description</label>
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
            <label className="create-job-modal__label">Job Requirement</label>
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
              <label className="create-job-modal__label">Job Duration</label>
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
                <label className="create-job-modal__label">{field.label}</label>
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
            <label className="create-job-modal__label">Add Custom Field</label>
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

          <div className="create-job-modal__actions">
            <button
              type="button"
              className="create-job-modal__cancel-btn"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="create-job-modal__submit-btn">
              Publish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateJobModal;
