/**
 * Utility functions for working with user data from localStorage
 */

export interface UserData {
  id?: number;
  user_id?: number;
  userId?: number;
  user_firstname?: string;
  user_lastname?: string;
  user_email?: string;
  display_name?: string;
  name?: string;
  username?: string;
  user_name?: string;
  account_type?: string;
  created_at?: string;
  [key: string]: unknown;
}

/**
 * Get user data from localStorage
 */
export const getUserData = (): UserData | null => {
  try {
    const userData = localStorage.getItem("user");
    if (userData) {
      return JSON.parse(userData) as UserData;
    }
  } catch (error) {
    console.error("Error parsing user data:", error);
  }
  return null;
};

/**
 * Numeric user id from stored user object (JWT payload often synced here).
 */
export const getUserId = (): number => {
  const user = getUserData();
  if (!user) return 0;
  const raw: unknown =
    user.id ??
    user.user_id ??
    user.userId ??
    (typeof (user as { userId?: unknown }).userId === "number"
      ? (user as { userId: number }).userId
      : undefined);
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return raw;
  if (typeof raw === "string" && raw.trim() && !Number.isNaN(Number(raw))) {
    return Number(raw);
  }
  return 0;
};

/**
 * Get user's display name
 */
export const getUserName = (): string => {
  const user = getUserData();
  if (!user) return "User";

  if (user.display_name) return user.display_name;
  if (user.name) return user.name;
  if (user.username) return user.username;
  if (user.user_name) return user.user_name;
  if (user.user_firstname) {
    return user.user_lastname
      ? `${user.user_firstname} ${user.user_lastname}`
      : user.user_firstname;
  }
  return "User";
};

/**
 * Get initials from a name string
 * @param name - The name to get initials from
 * @returns Initials string (1-2 characters)
 */
export const getInitialsFromName = (name: string | null | undefined): string => {
  if (!name || typeof name !== "string") return "U";
  
  const trimmed = name.trim();
  if (!trimmed) return "U";
  
  const parts = trimmed.split(/\s+/).filter(p => p.length > 0);
  
  if (parts.length >= 2) {
    // Use first letter of first name and first letter of last name
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  
  if (parts.length === 1) {
    const singleName = parts[0];
    if (singleName.length >= 2) {
      return singleName.substring(0, 2).toUpperCase();
    }
    return singleName.charAt(0).toUpperCase();
  }
  
  return "U";
};

/**
 * Get user's initials from their name (for current user)
 */
export const getUserInitials = (): string => {
  const user = getUserData();
  if (!user) return "U";

  let firstName = "";
  let lastName = "";

  if (user.user_firstname) {
    firstName = user.user_firstname.trim();
  }
  if (user.user_lastname) {
    lastName = user.user_lastname.trim();
  }

  // If we have both first and last name, use both initials
  if (firstName && lastName) {
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }
  // If only first name, use first two characters
  if (firstName) {
    return firstName.substring(0, 2).toUpperCase();
  }
  // Fallback to display_name or name
  if (user.display_name) {
    return getInitialsFromName(user.display_name);
  }
  if (user.name) {
    return getInitialsFromName(user.name);
  }
  return "U"; // Default fallback
};

/**
 * Get user's email
 */
export const getUserEmail = (): string => {
  const user = getUserData();
  return user?.user_email || "";
};

/**
 * Get user's account type
 */
export const getUserAccountType = (): string => {
  const user = getUserData();
  return user?.account_type || "Basic";
};

/** Business badge / seller accounts (marketplace create, "My offers"). */
export const isBusinessUser = (): boolean => {
  const t = (getUserAccountType() || "").toLowerCase();
  return t === "business";
};

/** Personal (consumer) accounts — cart and checkout. */
export const isPersonalConsumerUser = (): boolean => {
  return isAuthenticated() && !isBusinessUser();
};

/**
 * Get username for profile URL
 */
export const getProfileUsername = (): string => {
  const user = getUserData();
  if (!user) return "user";

  if (user.username) return user.username;
  if (user.user_name) return user.user_name;
  if (user.display_name) return user.display_name.replace(/\s+/g, "");
  if (user.name) return user.name.replace(/\s+/g, "");
  if (user.user_firstname) {
    const first = user.user_firstname;
    const last = user.user_lastname || "";
    return (first + last).replace(/\s+/g, "");
  }
  return "user";
};

/**
 * Get user's profile picture/avatar from localStorage
 * Returns the stored profile picture URL or null if not available
 */
export const getUserAvatar = (): string | null => {
  try {
    const storedPicture = localStorage.getItem("userProfilePicture");
    if (storedPicture) {
      return storedPicture;
    }

    // Also check if there's a profile_image_url or user_picture in user data
    const user = getUserData();
    if (user && typeof user.profile_image_url === "string") {
      return user.profile_image_url;
    }
    if (user && typeof user.user_picture === "string") {
      return user.user_picture;
    }
    if (user && typeof user.user_avatar === "string") {
      return user.user_avatar;
    }
  } catch (error) {
    console.error("Error getting user avatar:", error);
  }
  return null;
};

/**
 * Check if user is authenticated
 * Returns true if user has a valid token and user data
 */
export const isAuthenticated = (): boolean => {
  try {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    const user = getUserData();
    return !!(token && user);
  } catch (error) {
    console.error("Error checking authentication:", error);
    return false;
  }
};