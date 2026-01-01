import API_BASE_URL from "./config";
import type {
  PersonalFormData,
  BusinessFormData,
} from "../utils/validationSchemas";
import { fetchWithTimeout } from "../utils/fetchWithTimeout";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

export const registerPersonal = async (
  formData: PersonalFormData
): Promise<ApiResponse<{ userId: string; email: string }>> => {
  try {
    // Normalize email to lowercase for case-insensitive uniqueness
    const normalizedEmail = formData.user_email.toLowerCase().trim();

    const response = await fetchWithTimeout(
      `${API_BASE_URL}/auth/personal/signup`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_firstname: formData.user_firstname,
          user_lastname: formData.user_lastname,
          user_gender: formData.user_gender,
          user_phone: formData.user_phone,
          user_email: normalizedEmail,
          nin_number: formData.nin_number,
          address: formData.address,
          user_password: formData.user_password,
        }),
        timeout: 30000, // 30 second timeout
      }
    );

    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch (jsonError) {
      // If response is not valid JSON, return error
      return {
        success: false,
        message: `Server error: ${response.status} ${response.statusText}`,
        errors: [],
      };
    }

    if (!response.ok) {
      // Check for duplicate email errors
      const errorMessage = data.message || data.error || "";
      const errorMessageLower = errorMessage.toLowerCase();
      const isDuplicateEmail =
        errorMessageLower.includes("email") &&
        (errorMessageLower.includes("already") ||
          errorMessageLower.includes("exists") ||
          errorMessageLower.includes("duplicate") ||
          errorMessageLower.includes("registered") ||
          errorMessageLower.includes("taken"));

      // Check errors array for email field errors
      const emailError = data.errors?.find(
        (err: { field: string; message: string }) =>
          err.field === "user_email" ||
          err.field === "email" ||
          err.message?.toLowerCase().includes("email")
      );

      if (isDuplicateEmail || emailError) {
        return {
          success: false,
          message:
            "This email address is already registered. Please use a different email or sign in instead.",
          errors: [
            {
              field: "user_email",
              message:
                "This email address is already registered. Please use a different email or sign in instead.",
            },
            ...(data.errors || []),
          ],
        };
      }

      return {
        success: false,
        message:
          data.message ||
          `Registration failed: ${response.status} ${response.statusText}`,
        errors: data.errors || [],
      };
    }

    return {
      success: true,
      data: data.user,
      message: data.message || "Registration successful",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Network error occurred",
    };
  }
};

export const registerBusiness = async (
  formData: BusinessFormData
): Promise<ApiResponse<{ businessId: string; email: string }>> => {
  try {
    // Normalize email to lowercase for case-insensitive uniqueness
    const normalizedEmail = formData.business_email.toLowerCase().trim();

    const response = await fetchWithTimeout(
      `${API_BASE_URL}/auth/business/signup`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          business_name: formData.business_name,
          business_type: formData.business_type,
          business_email: normalizedEmail,
          CAC_number: formData.CAC_number,
          business_phone: formData.business_phone,
          business_location: formData.business_location,
          business_password: formData.business_password,
        }),
        timeout: 30000, // 30 second timeout
      }
    );

    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch (jsonError) {
      // If response is not valid JSON, return error
      return {
        success: false,
        message: `Server error: ${response.status} ${response.statusText}`,
        errors: [],
      };
    }

    if (!response.ok) {
      // Check for duplicate email errors
      const errorMessage = data.message || data.error || "";
      const errorMessageLower = errorMessage.toLowerCase();
      const isDuplicateEmail =
        errorMessageLower.includes("email") &&
        (errorMessageLower.includes("already") ||
          errorMessageLower.includes("exists") ||
          errorMessageLower.includes("duplicate") ||
          errorMessageLower.includes("registered") ||
          errorMessageLower.includes("taken"));

      // Check errors array for email field errors
      const emailError = data.errors?.find(
        (err: { field: string; message: string }) =>
          err.field === "business_email" ||
          err.field === "email" ||
          err.message?.toLowerCase().includes("email")
      );

      if (isDuplicateEmail || emailError) {
        return {
          success: false,
          message:
            "This email address is already registered. Please use a different email or sign in instead.",
          errors: [
            {
              field: "business_email",
              message:
                "This email address is already registered. Please use a different email or sign in instead.",
            },
            ...(data.errors || []),
          ],
        };
      }

      return {
        success: false,
        message:
          data.message ||
          `Registration failed: ${response.status} ${response.statusText}`,
        errors: data.errors || [],
      };
    }

    return {
      success: true,
      data: data.business,
      message: data.message || "Registration successful",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Network error occurred",
    };
  }
};

interface LoginCredentials {
  email: string;
  password: string;
  activationCode?: string;
}

interface LoginResponse {
  success: boolean;
  token?: string;
  user?: Record<string, unknown>;
  data?: Record<string, unknown>;
  message?: string;
  error?: string;
}

export const loginPersonal = async (
  credentials: LoginCredentials
): Promise<LoginResponse> => {
  try {
    const normalizedEmail = credentials.email.toLowerCase().trim();
    // Normalize activation code: trim, remove spaces, convert to uppercase (common format)
    const activationCode = credentials.activationCode
      ? credentials.activationCode.trim().replace(/\s+/g, "").toUpperCase()
      : undefined;

    // Build request body - backend expects activation_code (snake_case)
    const requestBody: {
      email: string;
      password: string;
      activation_code?: string;
    } = {
      email: normalizedEmail,
      password: credentials.password,
    };

    // Always include activation_code field (even if empty) as backend may require it
    requestBody.activation_code = activationCode || "";

    console.log("Login request body:", {
      email: requestBody.email,
      password: "***",
      activation_code: requestBody.activation_code,
      activation_code_length: requestBody.activation_code?.length,
    });

    const response = await fetchWithTimeout(
      `${API_BASE_URL}/auth/personal/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        timeout: 30000,
      }
    );

    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch (jsonError) {
      console.error("Failed to parse response:", jsonError);
      return {
        success: false,
        message: `Server error: ${response.status} ${response.statusText}`,
      };
    }

    if (!response.ok) {
      console.error("Login failed - Response:", {
        status: response.status,
        statusText: response.statusText,
        data: data,
      });

      // Extract error message from various possible response formats
      const errorMessage =
        data.message ||
        data.error ||
        data.errors?.map((e: { message?: string }) => e.message).join(", ") ||
        `Login failed: ${response.status} ${response.statusText}`;

      return {
        success: false,
        message: errorMessage,
        error: data.error || data.message,
      };
    }

    return {
      success: true,
      token: data.token,
      user: data.user || data.data,
      message: data.message || "Login successful",
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Network error occurred",
    };
  }
};

export const loginBusiness = async (
  credentials: LoginCredentials
): Promise<LoginResponse> => {
  try {
    const normalizedEmail = credentials.email.toLowerCase().trim();
    // Normalize activation code: trim, remove spaces, convert to uppercase (common format)
    const activationCode = credentials.activationCode
      ? credentials.activationCode.trim().replace(/\s+/g, "").toUpperCase()
      : undefined;

    // Build request body - backend expects activation_code (snake_case)
    const requestBody: {
      email: string;
      password: string;
      activation_code?: string;
    } = {
      email: normalizedEmail,
      password: credentials.password,
    };

    // Always include activation_code field (even if empty) as backend may require it
    requestBody.activation_code = activationCode || "";

    console.log("Login request body:", {
      email: requestBody.email,
      password: "***",
      activation_code: requestBody.activation_code,
      activation_code_length: requestBody.activation_code?.length,
    });

    const response = await fetchWithTimeout(
      `${API_BASE_URL}/auth/business/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        timeout: 30000,
      }
    );

    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch (jsonError) {
      console.error("Failed to parse response:", jsonError);
      return {
        success: false,
        message: `Server error: ${response.status} ${response.statusText}`,
      };
    }

    if (!response.ok) {
      console.error("Login failed - Response:", {
        status: response.status,
        statusText: response.statusText,
        data: data,
      });

      // Extract error message from various possible response formats
      const errorMessage =
        data.message ||
        data.error ||
        data.errors?.map((e: { message?: string }) => e.message).join(", ") ||
        `Login failed: ${response.status} ${response.statusText}`;

      return {
        success: false,
        message: errorMessage,
        error: data.error || data.message,
      };
    }

    return {
      success: true,
      token: data.token,
      user: data.user || data.data,
      message: data.message || "Login successful",
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Network error occurred",
    };
  }
};
