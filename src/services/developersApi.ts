import { apiUrl } from "../api/config";

export interface DeveloperProfile {
  id: string;
  fullName: string;
  role: string;
  description: string;
  imageKey: string;
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
    imageKey: "joseph",
  },
  {
    id: "david-peter",
    fullName: "David Peter",
    role: "Frontend Developer",
    description:
      "Crafts responsive interfaces and smooth interaction flows for residents and businesses.",
    imageKey: "david",
  },
  {
    id: "blessing-matthias",
    fullName: "Blessing Matthias",
    role: "Product UI Developer",
    description:
      "Shapes user-facing details, accessibility, and visual polish across the platform.",
    imageKey: "blessing",
  },
];

export const developersApi = {
  async getDevelopers(): Promise<DeveloperProfile[]> {
    const response = await fetch(apiUrl("/developers"), {
      method: "GET",
      signal: AbortSignal.timeout(15000),
    });
    const data = (await response.json().catch(() => ({}))) as DevelopersResponse;
    if (!response.ok || !data.success || !Array.isArray(data.data)) {
      throw new Error(data.message || "Unable to load developers.");
    }
    return data.data;
  },
};
