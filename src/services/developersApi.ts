import { apiUrl } from "../api/config";

export interface DeveloperProfile {
  id: string | number;
  fullName: string;
  role: string;
  description: string;
  imageUrl?: string;
  imageKey: string;
  portfolioUrl?: string;
  isActive?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface DevelopersResponse {
  success?: boolean;
  data?: DeveloperProfile[];
  message?: string;
}

export const fallbackDevelopers: DeveloperProfile[] = [
  {
    id: "joseph-azumara",
    fullName: "Joseph Azumara",
    role: "Lead Platform Developer",
    description:
      "Builds the core JOSCity experience across community, marketplace, and smart city workflows.",
    imageUrl: "",
    imageKey: "joseph",
    portfolioUrl: "https://afresh.center",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "david-peter",
    fullName: "David Peter",
    role: "Frontend Developer",
    description:
      "Crafts responsive interfaces and smooth interaction flows for residents and businesses.",
    imageUrl: "",
    imageKey: "david",
    portfolioUrl: "https://afresh.center",
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "blessing-matthias",
    fullName: "Blessing Matthias",
    role: "Product UI Developer",
    description:
      "Shapes user-facing details, accessibility, and visual polish across the platform.",
    imageUrl: "",
    imageKey: "blessing",
    portfolioUrl: "https://afresh.center",
    isActive: true,
    sortOrder: 3,
  },
];

export interface DeveloperPayload {
  fullName: string;
  role: string;
  description: string;
  imageUrl?: string;
  imageKey?: string;
  portfolioUrl?: string;
  isActive?: boolean;
  sortOrder?: number;
  imageFile?: File | null;
}

const getAdminToken = (): string | null => localStorage.getItem("adminToken");

const buildDeveloperFormData = (payload: DeveloperPayload) => {
  const formData = new FormData();
  formData.append("fullName", payload.fullName || "");
  formData.append("role", payload.role || "");
  formData.append("description", payload.description || "");
  formData.append("imageUrl", payload.imageUrl || "");
  formData.append("imageKey", payload.imageKey || "");
  formData.append("portfolioUrl", payload.portfolioUrl || "");
  formData.append("isActive", String(payload.isActive ?? true));
  formData.append("sortOrder", String(payload.sortOrder ?? 0));
  if (payload.imageFile) {
    formData.append("developer_image", payload.imageFile);
  }
  return formData;
};

const readDevelopersResponse = async (
  response: Response,
  fallbackMessage: string
): Promise<DeveloperProfile[]> => {
  const data = (await response.json().catch(() => ({}))) as DevelopersResponse;
  if (!response.ok || !data.success || !Array.isArray(data.data)) {
    throw new Error(data.message || fallbackMessage);
  }
  return data.data;
};

const adminDeveloperRequest = async (
  endpoint = "",
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAdminToken();
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(apiUrl(`/admin/developers${endpoint}`), {
    ...options,
    headers,
    signal: AbortSignal.timeout(30000),
  });
};

export const developersApi = {
  async getDevelopers(): Promise<DeveloperProfile[]> {
    const response = await fetch(apiUrl("/developers"), {
      method: "GET",
      signal: AbortSignal.timeout(15000),
    });
    return readDevelopersResponse(response, "Unable to load developers.");
  },

  async getAdminDevelopers(): Promise<DeveloperProfile[]> {
    const response = await adminDeveloperRequest();
    return readDevelopersResponse(response, "Unable to load admin developers.");
  },

  async createAdminDeveloper(payload: DeveloperPayload): Promise<DeveloperProfile> {
    const response = await adminDeveloperRequest("", {
      method: "POST",
      body: buildDeveloperFormData(payload),
    });
    const data = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      data?: DeveloperProfile;
      message?: string;
    };
    if (!response.ok || !data.success || !data.data) {
      throw new Error(data.message || "Unable to create developer.");
    }
    return data.data;
  },

  async updateAdminDeveloper(
    id: string | number,
    payload: DeveloperPayload
  ): Promise<DeveloperProfile> {
    const response = await adminDeveloperRequest(`/${id}`, {
      method: "PUT",
      body: buildDeveloperFormData(payload),
    });
    const data = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      data?: DeveloperProfile;
      message?: string;
    };
    if (!response.ok || !data.success || !data.data) {
      throw new Error(data.message || "Unable to update developer.");
    }
    return data.data;
  },

  async deleteAdminDeveloper(id: string | number): Promise<void> {
    const response = await adminDeveloperRequest(`/${id}`, {
      method: "DELETE",
    });
    const data = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      message?: string;
    };
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Unable to delete developer.");
    }
  },
};
