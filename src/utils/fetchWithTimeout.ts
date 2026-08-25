import API_BASE_URL from "../api/config";
import { fetchRegisteredCitizensCount } from "./citizenCountUtils";

export async function fetchWithTimeout(
  url: string,
  options?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string | object;
    timeout?: number;
    signal?: AbortSignal;
  }
): Promise<Response> {
  const timeout = options?.timeout ?? 15000;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);
  const onParentAbort = () => controller.abort();
  options?.signal?.addEventListener("abort", onParentAbort);
  try {
    const fetchOptions: RequestInit = { signal: controller.signal };

    if (options?.method) {
      fetchOptions.method = options.method;
    }

    if (options?.headers) {
      fetchOptions.headers = options.headers;
    }

    if (options?.body) {
      fetchOptions.body =
        typeof options.body === "object"
          ? JSON.stringify(options.body)
          : options.body;
    }

    return await fetch(url, fetchOptions);
  } catch (error) {
    if (
      (error instanceof DOMException && error.name === "AbortError") ||
      (error instanceof Error && error.name === "TimeoutError")
    ) {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error instanceof Error ? error : new Error("Unknown fetch error");
  } finally {
    window.clearTimeout(timer);
    options?.signal?.removeEventListener("abort", onParentAbort);
  }
}

interface PendingRegistration {
  user_id: string;
  account_type: "personal" | "business";
  business_email: string;
  user_email: string;
  email?: string;
  user_firstname?: string;
  user_lastname?: string;
  business_name?: string;
  user_phone: string;
  business_phone: string;
  address?: string;
  business_location?: string;
  nin_number?: string;
  cac_number?: string;
  created_at: string;
  user_registered: string;
  status: "pending" | "approved" | "rejected";
}

export async function fetchPendingRegistrations(): Promise<
  PendingRegistration[]
> {
  try {
    // Get the admin token
    // const adminToken = localStorage.getItem("adminToken");

    // Make the actual API call - DON'T call fetchPendingRegistrations() again!
    const response = await fetch(`${API_BASE_URL}/auth/personal/pending`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // 'Authorization': `Bearer ${adminToken}`,
      },
    });

    console.log("pending registrations response", response);

    if (!response.ok) {
      // If endpoint doesn't exist, use mock data for now

      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Successfully fetched data:", data);
    return data.data;
  } catch (error) {
    throw error instanceof Error ? error : new Error("Unknown fetch error");
  }
}

interface DashboardData {
  success: boolean;
  message?: string;
  [key: string]: unknown;
}

export const fetchDashboardData = async (): Promise<DashboardData> => {
  try {
    console.log("🚀 Starting dashboard API call...");

    // Get admin token from localStorage
    const adminToken = localStorage.getItem("adminToken");
    
    if (!adminToken) {
      console.error("❌ No admin token found in localStorage");
      throw new Error("Admin authentication required. Please login again.");
    }

    console.log("🔑 Admin token found:", adminToken.substring(0, 20) + "...");
    console.log("🔑 Full token length:", adminToken.length);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    // Always add Authorization header with Bearer token
    if (adminToken) {
      headers["Authorization"] = `Bearer ${adminToken}`;
    }

    console.log("📤 Sending request to:", `${API_BASE_URL}/admin/dashboard`);
    console.log("📤 Headers:", { ...headers, Authorization: "Bearer ***" });

    const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
      method: "GET",
      headers,
    });

    console.log("📡 API Response Status:", response.status);
    console.log("📡 API Response Headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      let errorText = "";
      let errorData: any = {};
      
      try {
        errorText = await response.text();
        console.log("📥 Error response text:", errorText);
        
        if (errorText) {
          try {
            errorData = JSON.parse(errorText);
            console.log("📥 Parsed error data:", errorData);
          } catch (parseError) {
            // If JSON parsing fails, use the text as the message
            errorData = { 
              message: errorText, 
              error: errorText 
            };
          }
        } else {
          errorData = { 
            message: response.statusText, 
            error: response.statusText 
          };
        }
      } catch (readError) {
        console.error("❌ Error reading response:", readError);
        errorData = { 
          message: `HTTP ${response.status}: ${response.statusText}`, 
          error: `HTTP ${response.status}: ${response.statusText}` 
        };
      }
      
      console.error("❌ API Error Response:", {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      
      // If it's a 401, the token might be invalid or expired
      if (response.status === 401) {
        console.error("❌ 401 Unauthorized - Clearing admin token");
        console.error("❌ Error details:", {
          errorText,
          errorData,
          hasMessage: !!errorData.message,
          hasError: !!errorData.error,
          errorKeys: Object.keys(errorData)
        });
        
        // Clear invalid token
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminData");
        
        // Extract the actual error message from the response
        // Backend might return { error: "..." } or { message: "..." } or { error: true, message: "..." }
        let errorMessage = "Authentication failed. Please login again.";
        
        if (errorData.error && typeof errorData.error === "string") {
          errorMessage = errorData.error;
        } else if (errorData.message && typeof errorData.message === "string") {
          errorMessage = errorData.message;
        } else if (errorText && typeof errorText === "string" && errorText.trim()) {
          errorMessage = errorText;
        }
        
        console.error("❌ Throwing error:", errorMessage);
        throw new Error(errorMessage);
      }
      
      // For other errors, use the error message from the response
      const errorMessage = errorData.error || errorData.message || errorText || `HTTP Error ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("📥 API Response Data:", data);

    if (!data.success && data.error) {
      throw new Error(data.error || data.message || "API request was not successful");
    }

    console.log("✅ Dashboard data fetched successfully", data);
    return data;
  } catch (error) {
    console.error("❌ Dashboard API Error:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to fetch dashboard data");
  }
};

interface UserActionResponse {
  success: boolean;
  message: string;
  [key: string]: unknown;
}

const handleUserAction = async (
  user_id: string,
  action: "approve" | "reject"
): Promise<UserActionResponse> => {
  const url = `${API_BASE_URL}/auth/personal/${action}`;
  console.log(`Calling ${action} endpoint:`, url);
  console.log("With user_id:", user_id);

  try {
    // Convert user_id to number if it's numeric (backend might expect number)
    const userIdValue = /^\d+$/.test(user_id) ? parseInt(user_id, 10) : user_id;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userIdValue }),
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);

    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch (jsonError) {
      throw new Error(`Server returned invalid JSON: ${response.status} ${response.statusText}`);
    }

    console.log("Response data:", data);

    if (!response.ok) {
      // For 500 errors, provide more context
      const errorMessage = data.message || data.error || `HTTP ${response.status}: Failed to ${action} user`;
      const fullError = response.status === 500 
        ? `${errorMessage} (Server Error - Please check backend logs)`
        : errorMessage;
      throw new Error(fullError);
    }
    console.log(`${action}d user`, data);
    return data;
  } catch (error) {
    console.error(`Error ${action}ing user:`, error);
    throw error instanceof Error
      ? error
      : new Error(`Failed to ${action} user`);
  }
};

export const approveUser = async (
  user_id: string
): Promise<UserActionResponse> => {
  return handleUserAction(user_id, "approve");
};

export const rejectUser = async (
  user_id: string
): Promise<UserActionResponse> => {
  const url = `${API_BASE_URL}/auth/admin/reject`;
  console.log("Calling reject endpoint:", url);
  console.log("With user_id:", user_id);

  try {
    const response = await fetch(`${API_BASE_URL}/auth/admin/reject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add Authorization header if needed
        // 'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ user_id }), // Send user_id in body
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);

    const data = await response.json();
    console.log("Response data:", data);

    if (!response.ok) {
      throw new Error(
        data.message || `HTTP ${response.status}: Failed to reject user`
      );
    }
    console.log("rejected user", data);
    return data;
  } catch (error) {
    console.error("Error rejecting user:", error);
    throw error instanceof Error ? error : new Error("Failed to reject user");
  }
};

export const rejectUsers = async (
  user_id: string
): Promise<UserActionResponse> => {
  return handleUserAction(user_id, "reject");
};

export const deleteUser = async (
  user_id: string
): Promise<UserActionResponse & { account_type?: string }> => {
  // Convert user_id to number if it's numeric (backend expects it in the URL)
  const userIdValue = /^\d+$/.test(user_id) ? parseInt(user_id, 10) : user_id;
  const url = `${API_BASE_URL}/admin/user/${userIdValue}`;
  console.log("Calling delete endpoint:", url);
  console.log("With user_id:", user_id);

  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        // Add Authorization header if admin token is available
        ...(localStorage.getItem("adminToken") && {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        }),
      },
    });

    console.log("Response status:", response.status);

    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch (jsonError) {
      throw new Error(
        `Server returned invalid JSON: ${response.status} ${response.statusText}`
      );
    }

    console.log("Response data:", data);

    if (!response.ok) {
      const errorMessage =
        data.message ||
        data.error ||
        `HTTP ${response.status}: Failed to delete user`;
      throw new Error(errorMessage);
    }
    console.log("deleted user", data);
    
    // Refresh count from API if deleted user was approved
    // Only approved users are counted in registered citizens
    if (data.success && (data.was_approved || data.account_status === "approved" || data.user_approved === "1" || data.user_approved === 1)) {
      await fetchRegisteredCitizensCount();
      // Dispatch event to update count in other components
      window.dispatchEvent(new Event("citizenCountUpdated"));
    }
    
    return data;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error instanceof Error ? error : new Error("Failed to delete user");
  }
};
