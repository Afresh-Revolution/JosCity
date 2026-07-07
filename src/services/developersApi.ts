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
    id: "onoja-william-bosworth",
    fullName: "Onoja William Bosworth",
    role: "Software Developer lead / Prompt Engineer",
    description:
      "I am a tech-driven creative focused on building modern digital solutions with both technical skill and strategic thinking. I am the CAIO of NAB (Nigeria Ai Builders).",
    imageUrl: "",
    imageKey: "william",
    portfolioUrl: "https://william-lac.vercel.app",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "blessing-matthias",
    fullName: "Blessing Matthias",
    role: "Software developer",
    description:
      "I'm a passionate software developer focused on building modern, responsive, and user-friendly web applications. I enjoy turning ideas into functional digital solutions while continuously learning and improving my skills.",
    imageUrl: "",
    imageKey: "blessing",
    portfolioUrl: "https://github.com/Nachi-bl",
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "olayiwola-emmanuel-iyanu",
    fullName: "Olayiwola Emmanuel Iyanu",
    role: "UI/UX: UI/UX Designer",
    description:
      "Designs clean, intuitive interfaces and user experiences that make JOSCity easier to navigate, understand, and use.",
    imageUrl: "",
    imageKey: "ola",
    portfolioUrl: "https://my-portfolio-ljkq.onrender.com",
    isActive: true,
    sortOrder: 3,
  },
  {
    id: "sanderson-stephen",
    fullName: "Sanderson Stephen",
    role: "Frontend web developer",
    description:
      "I am a frontend developer passionate about building modern, responsive, and user-friendly web applications using technologies like React, Next.js, and TypeScript. At Joscity.com, I contributed to developing interactive user interfaces and improving the overall user experience of the platform. I enjoy building digital solutions that are both functional and impactful.",
    imageUrl: "",
    imageKey: "sanderson",
    portfolioUrl: "https://github.com/DeanAndie",
    isActive: true,
    sortOrder: 4,
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
  fallbackMessage: string,
): Promise<DeveloperProfile[]> => {
  const data = (await response.json().catch(() => ({}))) as DevelopersResponse;
  if (!response.ok || !data.success || !Array.isArray(data.data)) {
    throw new Error(data.message || fallbackMessage);
  }
  return data.data;
};

const adminDeveloperRequest = async (
  endpoint = "",
  options: RequestInit = {},
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

  async createAdminDeveloper(
    payload: DeveloperPayload,
  ): Promise<DeveloperProfile> {
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
    payload: DeveloperPayload,
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
