export type BusinessCategory = {
  slug: string;
  name: string;
};

/** Same catalog as the JOSCITY app and backend `/auth/business/categories`. */
export const BUSINESS_CATEGORIES: BusinessCategory[] = [
  { slug: "retail", name: "Retail & Shop" },
  { slug: "grocery", name: "Grocery & Supermarket" },
  { slug: "fashion", name: "Fashion & Clothing" },
  { slug: "electronics", name: "Electronics & Phones" },
  { slug: "restaurant", name: "Restaurant & Food" },
  { slug: "cafe", name: "Cafe & Bakery" },
  { slug: "bar-lounge", name: "Bar, Lounge & Nightlife" },
  { slug: "beauty", name: "Beauty, Salon & Spa" },
  { slug: "health", name: "Health, Clinic & Pharmacy" },
  { slug: "fitness", name: "Gym & Fitness" },
  { slug: "education", name: "Education & Training" },
  { slug: "professional", name: "Professional Services" },
  { slug: "legal-finance", name: "Legal, Accounting & Finance" },
  { slug: "technology", name: "Technology & IT" },
  { slug: "construction", name: "Construction & Real Estate" },
  { slug: "automotive", name: "Automotive & Auto Repair" },
  { slug: "logistics", name: "Logistics & Transportation" },
  { slug: "agriculture", name: "Agriculture & Farming" },
  { slug: "manufacturing", name: "Manufacturing" },
  { slug: "wholesale", name: "Wholesale & Distribution" },
  { slug: "hospitality", name: "Hotel & Hospitality" },
  { slug: "events", name: "Events, Photo & Video" },
  { slug: "entertainment", name: "Entertainment & Arts" },
  { slug: "media", name: "Media & Advertising" },
  { slug: "home-services", name: "Home & Household Services" },
  { slug: "nonprofit", name: "Non-Profit & NGO" },
  { slug: "service", name: "General Services" },
  { slug: "other", name: "Other" },
];

export const BUSINESS_CATEGORY_SLUGS = BUSINESS_CATEGORIES.map(
  (item) => item.slug
);

const CATEGORY_BY_SLUG = new Map(
  BUSINESS_CATEGORIES.map((item) => [item.slug, item])
);

const CATEGORY_BY_NAME = new Map(
  BUSINESS_CATEGORIES.map((item) => [item.name.toLowerCase(), item.slug])
);

export function normalizeBusinessType(value: string): string {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const slug = raw.toLowerCase().replace(/\s+/g, "-");
  if (CATEGORY_BY_SLUG.has(slug)) return slug;
  return CATEGORY_BY_NAME.get(raw.toLowerCase()) || "";
}

export function isKnownBusinessType(
  value: string,
  extraSlugs: string[] = []
): boolean {
  const slug = normalizeBusinessType(value);
  if (slug) return true;
  const raw = String(value || "").trim().toLowerCase();
  return extraSlugs.some((item) => item.toLowerCase() === raw);
}

export function businessCategoryLabel(value: string): string {
  const slug = normalizeBusinessType(value);
  if (slug) return CATEGORY_BY_SLUG.get(slug)?.name || slug;
  return String(value || "").trim();
}
