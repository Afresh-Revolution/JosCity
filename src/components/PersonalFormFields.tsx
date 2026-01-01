import React from "react";
import {
  Mail,
  User,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
} from "lucide-react";

interface PersonalFormData {
  user_firstname: string;
  user_lastname: string;
  user_gender: string;
  user_phone: string;
  user_email: string;
  nin_number: string;
  address: string;
  user_password: string;
}

interface PersonalFormFieldsProps {
  formData: PersonalFormData;
  showPassword: boolean;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  onTogglePassword: () => void;
}

const PersonalFormFields: React.FC<PersonalFormFieldsProps> = ({
  formData,
  showPassword,
  onInputChange,
  onTogglePassword,
}) => {
  return (
    <>
      <div className="register-form-row">
        <div className="register-form-group">
          <label htmlFor="user_firstname">First Name</label>
          <input
            type="text"
            id="user_firstname"
            name="user_firstname"
            value={formData.user_firstname}
            onChange={onInputChange}
            placeholder="First Name"
          />
        </div>
        <div className="register-form-group">
          <label htmlFor="user_lastname">Last Name</label>
          <input
            type="text"
            id="user_lastname"
            name="user_lastname"
            value={formData.user_lastname}
            onChange={onInputChange}
            placeholder="Last Name"
          />
        </div>
      </div>

      <div className="register-form-row">
        <div className="register-form-group">
          <label htmlFor="user_gender">Gender</label>
          <div className="register-select-wrapper">
            <select
              id="user_gender"
              name="user_gender"
              value={formData.user_gender}
              onChange={onInputChange}
            >
              <option value="">Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <ChevronDown className="register-select-icon" size={20} />
          </div>
        </div>
        <div className="register-form-group">
          <label htmlFor="user_phone">Phone Number</label>
          <input
            type="tel"
            id="user_phone"
            name="user_phone"
            value={formData.user_phone}
            onChange={onInputChange}
            placeholder="Phone Number"
          />
        </div>
      </div>

      <div className="register-form-group">
        <label htmlFor="user_email">Email</label>
        <div className="register-input-wrapper">
          <Mail className="register-input-icon" size={20} />
          <input
            type="email"
            id="user_email"
            name="user_email"
            value={formData.user_email}
            onChange={onInputChange}
            placeholder="Email"
          />
        </div>
      </div>

      <div className="register-form-group">
        <label htmlFor="nin_number">NIN Number</label>
        <div className="register-input-wrapper">
          <User className="register-input-icon" size={20} />
          <input
            type="text"
            id="nin_number"
            name="nin_number"
            value={formData.nin_number}
            onChange={onInputChange}
            placeholder="NIN Number"
          />
        </div>
      </div>

      <div className="register-form-group">
        <label htmlFor="address">Address</label>
        <div className="register-input-wrapper">
          <MapPin className="register-input-icon" size={20} />
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={onInputChange}
            placeholder="Address"
          />
        </div>
      </div>

      <div className="register-form-group">
        <label htmlFor="user_password">Password</label>
        <div className="register-input-wrapper">
          <Lock className="register-input-icon" size={20} />
          <input
            type={showPassword ? "text" : "password"}
            id="user_password"
            name="user_password"
            value={formData.user_password}
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

export default PersonalFormFields;
