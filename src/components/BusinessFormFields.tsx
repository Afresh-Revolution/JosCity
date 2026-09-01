import React from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, Lock, Eye, EyeOff, ChevronDown } from "lucide-react";
import type { BusinessFormData } from "../utils/validationSchemas";
import type { BusinessCategory } from "../constants/businessCategories";
import { BUSINESS_CATEGORIES } from "../constants/businessCategories";

interface BusinessFormFieldsProps {
  formData: BusinessFormData;
  categories?: BusinessCategory[];
  showPassword: boolean;
  showConfirmPassword: boolean;
  onInputChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
  onTogglePassword: () => void;
  onToggleConfirmPassword: () => void;
}

const BusinessFormFields: React.FC<BusinessFormFieldsProps> = ({
  formData,
  categories = BUSINESS_CATEGORIES,
  showPassword,
  showConfirmPassword,
  onInputChange,
  onTogglePassword,
  onToggleConfirmPassword,
}) => {
  const typeOptions = categories.length > 0 ? categories : BUSINESS_CATEGORIES;

  return (
    <>
      <div className="register-form-row">
        <div className="register-form-group">
          <label htmlFor="business_name">Business name</label>
          <input
            type="text"
            id="business_name"
            name="business_name"
            value={formData.business_name}
            onChange={onInputChange}
            placeholder="Terminus Fresh Foods"
            autoComplete="organization"
          />
        </div>
        <div className="register-form-group">
          <label htmlFor="business_type">Business type</label>
          <div className="register-select-wrapper">
            <select
              id="business_type"
              name="business_type"
              value={formData.business_type}
              onChange={onInputChange}
            >
              <option value="">Select business type</option>
              {typeOptions.map((option) => (
                <option key={option.slug} value={option.slug}>
                  {option.name}
                </option>
              ))}
            </select>
            <ChevronDown className="register-select-icon" size={20} />
          </div>
        </div>
      </div>

      <div className="register-form-group">
        <label htmlFor="business_description">
          Short description <span>(optional)</span>
        </label>
        <textarea
          id="business_description"
          name="business_description"
          value={formData.business_description}
          onChange={onInputChange}
          placeholder="What your business offers in one or two lines"
          maxLength={240}
          rows={3}
        />
      </div>

      <div className="register-form-group">
        <label htmlFor="business_email">Business email</label>
        <div className="register-input-wrapper">
          <Mail className="register-input-icon" size={20} />
          <input
            type="email"
            id="business_email"
            name="business_email"
            value={formData.business_email}
            onChange={onInputChange}
            placeholder="business@example.com"
            autoComplete="email"
          />
        </div>
      </div>

      <div className="register-form-group">
        <label htmlFor="CAC_number">
          CAC number <span>(optional)</span>
        </label>
        <input
          type="text"
          id="CAC_number"
          name="CAC_number"
          value={formData.CAC_number}
          onChange={onInputChange}
          placeholder="RC1234567"
          autoCapitalize="characters"
          autoComplete="off"
        />
        <p className="register-helper">
          Leave blank if your business isn&apos;t CAC registered yet.
        </p>
      </div>

      <div className="register-form-group">
        <label htmlFor="business_phone">Business phone</label>
        <input
          type="tel"
          id="business_phone"
          name="business_phone"
          value={formData.business_phone}
          onChange={onInputChange}
          placeholder="0803 000 0000"
          autoComplete="tel"
        />
      </div>

      <div className="register-form-group">
        <label htmlFor="business_location">Business address</label>
        <div className="register-input-wrapper">
          <MapPin className="register-input-icon" size={20} />
          <input
            type="text"
            id="business_location"
            name="business_location"
            value={formData.business_location}
            onChange={onInputChange}
            placeholder="Street, area, Jos"
            autoComplete="street-address"
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
            autoComplete="new-password"
            value={formData.business_password}
            onChange={onInputChange}
            placeholder="At least 8 characters"
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
        <p className="register-helper">
          Use 8+ characters with a letter and a number
        </p>
      </div>

      <div className="register-form-group">
        <label htmlFor="business_password_confirm">Confirm password</label>
        <div className="register-input-wrapper">
          <Lock className="register-input-icon" size={20} />
          <input
            type={showConfirmPassword ? "text" : "password"}
            id="business_password_confirm"
            name="business_password_confirm"
            autoComplete="new-password"
            value={formData.business_password_confirm}
            onChange={onInputChange}
            placeholder="Re-enter your password"
          />
          <button
            type="button"
            className="register-password-toggle"
            onClick={onToggleConfirmPassword}
          >
            {showConfirmPassword ? (
              <EyeOff className="register-input-icon" size={20} />
            ) : (
              <Eye className="register-input-icon" size={20} />
            )}
          </button>
        </div>
      </div>

      <label className="register-terms" htmlFor="terms_accepted">
        <input
          type="checkbox"
          id="terms_accepted"
          name="terms_accepted"
          checked={formData.terms_accepted}
          onChange={onInputChange}
        />
        <span>
          I agree to the JOSCITY{" "}
          <Link to="/terms-of-service" target="_blank" rel="noopener noreferrer">
            Terms of Service
          </Link>
          ,{" "}
          <Link to="/terms-of-service" target="_blank" rel="noopener noreferrer">
            Merchant Terms
          </Link>{" "}
          and{" "}
          <Link to="/privacy-policy" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </Link>
          , and confirm I&apos;m authorised to register this business.
        </span>
      </label>
    </>
  );
};

export default BusinessFormFields;
