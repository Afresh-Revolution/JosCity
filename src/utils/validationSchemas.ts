// Validation schemas for Personal and Business registration forms

import {
  BUSINESS_CATEGORY_SLUGS,
  isKnownBusinessType,
} from "../constants/businessCategories";

export interface ValidationError {
  field: string;
  message: string;
}

// Personal Form Validation Schema
export interface PersonalFormData {
  user_firstname: string;
  user_lastname: string;
  user_gender: string;
  user_phone: string;
  user_email: string;
  nin_number: string;
  address: string;
  user_password: string;
}

// Business Form Validation Schema
export interface BusinessFormData {
  business_name: string;
  business_type: string;
  business_email: string;
  CAC_number: string;
  business_phone: string;
  business_location: string;
  business_password: string;
  business_password_confirm: string;
  business_description: string;
  terms_accepted: boolean;
}

// Validation functions
export const validatePersonalForm = (
  data: PersonalFormData
): ValidationError[] => {
  const errors: ValidationError[] = [];

  // First Name validation
  if (!data.user_firstname || data.user_firstname.trim() === "") {
    errors.push({ field: "user_firstname", message: "First name is required" });
  } else if (data.user_firstname.trim().length < 2) {
    errors.push({
      field: "user_firstname",
      message: "First name must be at least 2 characters",
    });
  }

  // Last Name validation
  if (!data.user_lastname || data.user_lastname.trim() === "") {
    errors.push({ field: "user_lastname", message: "Last name is required" });
  } else if (data.user_lastname.trim().length < 2) {
    errors.push({
      field: "user_lastname",
      message: "Last name must be at least 2 characters",
    });
  }

  // Gender is optional; if provided it must be male or female
  if (data.user_gender?.trim() && !["male", "female"].includes(data.user_gender.trim().toLowerCase())) {
    errors.push({ field: "user_gender", message: "Please select a valid gender" });
  }

  // Phone Number validation
  if (!data.user_phone || data.user_phone.trim() === "") {
    errors.push({ field: "user_phone", message: "Phone number is required" });
  } else {
    const phoneRegex =
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    if (!phoneRegex.test(data.user_phone.replace(/\s/g, ""))) {
      errors.push({
        field: "user_phone",
        message: "Please enter a valid phone number",
      });
    }
  }

  // Email validation
  if (!data.user_email || data.user_email.trim() === "") {
    errors.push({ field: "user_email", message: "Email is required" });
  } else {
    // Normalize email to lowercase for validation
    const normalizedEmail = data.user_email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      errors.push({
        field: "user_email",
        message: "Please enter a valid email address",
      });
    }
  }

  // NIN is optional; if provided it must be 11 digits
  const ninDigits = (data.nin_number || "").replace(/\D/g, "");
  if (ninDigits && ninDigits.length !== 11) {
    errors.push({
      field: "nin_number",
      message: "NIN number must be 11 digits",
    });
  }

  // Password validation
  if (!data.user_password || data.user_password === "") {
    errors.push({ field: "user_password", message: "Password is required" });
  } else if (data.user_password.length < 8) {
    errors.push({
      field: "user_password",
      message: "Password must be at least 8 characters",
    });
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.user_password)) {
    errors.push({
      field: "user_password",
      message:
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    });
  }

  return errors;
};

export const validateBusinessForm = (
  data: BusinessFormData,
  allowedTypes: string[] = BUSINESS_CATEGORY_SLUGS
): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Business Name validation
  if (!data.business_name || data.business_name.trim() === "") {
    errors.push({
      field: "business_name",
      message: "Enter your business name.",
    });
  } else if (data.business_name.trim().length < 2) {
    errors.push({
      field: "business_name",
      message: "Business name must be at least 2 characters",
    });
  }

  // Business Type validation — same catalog as the app / backend
  if (!data.business_type || data.business_type === "") {
    errors.push({
      field: "business_type",
      message: "Select a business type.",
    });
  } else if (!isKnownBusinessType(data.business_type, allowedTypes)) {
    errors.push({
      field: "business_type",
      message: "Please select a valid business type",
    });
  }

  const description = (data.business_description || "").trim();
  if (description.length > 240) {
    errors.push({
      field: "business_description",
      message: "Description must be 240 characters or less",
    });
  }

  // Business Email validation
  if (!data.business_email || data.business_email.trim() === "") {
    errors.push({
      field: "business_email",
      message: "Business email is required",
    });
  } else {
    const normalizedEmail = data.business_email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      errors.push({
        field: "business_email",
        message: "Enter a valid business email.",
      });
    }
  }

  // CAC Number validation (optional)
  const cacValue = (data.CAC_number || "").trim().toUpperCase();
  if (cacValue && (cacValue.length < 5 || !/^[A-Z0-9/-]+$/.test(cacValue))) {
    errors.push({
      field: "CAC_number",
      message: "Enter a valid CAC number, or leave it blank.",
    });
  }

  // Business Phone validation
  if (!data.business_phone || data.business_phone.trim() === "") {
    errors.push({
      field: "business_phone",
      message: "Business phone is required",
    });
  } else if (data.business_phone.replace(/\s/g, "").length < 10) {
    errors.push({
      field: "business_phone",
      message: "Enter a valid business phone number.",
    });
  }

  // Business Address validation
  if (!data.business_location || data.business_location.trim() === "") {
    errors.push({
      field: "business_location",
      message: "Business address is required",
    });
  } else if (data.business_location.trim().length < 10) {
    errors.push({
      field: "business_location",
      message: "Enter a fuller business address (street, area, Jos).",
    });
  }

  // Business Password validation — same rule as the app and backend
  if (!data.business_password || data.business_password === "") {
    errors.push({ field: "business_password", message: "Password is required" });
  } else if (
    data.business_password.length < 8 ||
    !/[A-Za-z]/.test(data.business_password) ||
    !/\d/.test(data.business_password)
  ) {
    errors.push({
      field: "business_password",
      message: "Use 8+ characters with a letter and a number.",
    });
  }

  if (data.business_password !== data.business_password_confirm) {
    errors.push({
      field: "business_password_confirm",
      message: "Passwords do not match.",
    });
  }

  if (!data.terms_accepted) {
    errors.push({
      field: "terms_accepted",
      message:
        "Agree to the Terms of Service, Merchant Terms and Privacy Policy to continue.",
    });
  }

  return errors;
};

// Helper function to get error message for a specific field
export const getFieldError = (
  errors: ValidationError[],
  fieldName: string
): string | undefined => {
  const error = errors.find((err) => err.field === fieldName);
  return error?.message;
};
