import React from "react";
import { Mail, MapPin, Lock, Eye, EyeOff, ChevronDown } from "lucide-react";

interface BusinessFormData {
  business_name: string;
  business_type: string;
  business_email: string;
  CAC_number: string;
  business_phone: string;
  business_location: string;
  business_password: string;
}

interface BusinessFormFieldsProps {
  formData: BusinessFormData;
  showPassword: boolean;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  onTogglePassword: () => void;
}

const BusinessFormFields: React.FC<BusinessFormFieldsProps> = ({
  formData,
  showPassword,
  onInputChange,
  onTogglePassword,
}) => {
  return (
    <>
      <div className="register-form-row">
        <div className="register-form-group">
          <label htmlFor="business_name">Business Name</label>
          <input
            type="text"
            id="business_name"
            name="business_name"
            value={formData.business_name}
            onChange={onInputChange}
            placeholder="Business Name"
          />
        </div>
        <div className="register-form-group">
          <label htmlFor="business_type">Business Type</label>
          <div className="register-select-wrapper">
            <select
              id="business_type"
              name="business_type"
              value={formData.business_type}
              onChange={onInputChange}
            >
              <option value="">Select Type</option>
              <option value="retail">Retail</option>
              <option value="service">Service</option>
              <option value="manufacturing">Manufacturing</option>
            </select>
            <ChevronDown className="register-select-icon" size={20} />
          </div>
        </div>
      </div>

      <div className="register-form-group">
        <label htmlFor="business_email">Business Email</label>
        <div className="register-input-wrapper">
          <Mail className="register-input-icon" size={20} />
          <input
            type="email"
            id="business_email"
            name="business_email"
            value={formData.business_email}
            onChange={onInputChange}
            placeholder="Business Email"
          />
        </div>
      </div>

      <div className="register-form-group">
        <label htmlFor="CAC_number">
          CAC Number <span style={{ color: "#ff4444" }}>*</span>
        </label>
        <input
          type="text"
          id="CAC_number"
          name="CAC_number"
          value={formData.CAC_number}
          onChange={onInputChange}
          placeholder="CAC Number (Required)"
          required
        />
      </div>

      <div className="register-form-group">
        <label htmlFor="business_phone">Business Phone</label>
        <input
          type="tel"
          id="business_phone"
          name="business_phone"
          value={formData.business_phone}
          onChange={onInputChange}
          placeholder="Business Phone"
        />
      </div>

      <div className="register-form-group">
        <label htmlFor="business_location">Business Address</label>
        <div className="register-input-wrapper">
          <MapPin className="register-input-icon" size={20} />
          <input
            type="text"
            id="business_location"
            name="business_location"
            value={formData.business_location}
            onChange={onInputChange}
            placeholder="Business Address"
          />
        </div>
      </div>

      <div className="register-form-group">
        <label htmlFor="business_password">Password</label>
        <div className="register-input-wrapper">
          <Lock className="register-input-icon" size={20} />
          <input
            type={showPassword ? "text" : "password"}
            id="business_password"
            name="business_password"
            value={formData.business_password}
            onChange={onInputChange}
            placeholder="Password"
          />
          <button
            type="button"
            className="register-password-toggle"
            onClick={onTogglePassword}
          >
            {showPassword ? (
              <EyeOff className="register-input-icon" size={20} />
            ) : (
              <Eye className="register-input-icon" size={20} />
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default BusinessFormFields;
