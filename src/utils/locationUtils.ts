/**
 * Utility functions for location-based calculations
 */

export interface Location {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export const calculateDistance = (
  location1: Location,
  location2: Location
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(location2.latitude - location1.latitude);
  const dLon = toRadians(location2.longitude - location1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(location1.latitude)) *
      Math.cos(toRadians(location2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

/**
 * Convert degrees to radians
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Get user's location from localStorage or prompt for it
 */
export const getUserLocation = (): Location | null => {
  try {
    const storedLocation = localStorage.getItem("userLocation");
    if (storedLocation) {
      return JSON.parse(storedLocation) as Location;
    }
  } catch (error) {
    console.error("Error getting user location:", error);
  }
  return null;
};

/**
 * Save user's location to localStorage
 */
export const saveUserLocation = (location: Location): void => {
  try {
    localStorage.setItem("userLocation", JSON.stringify(location));
  } catch (error) {
    console.error("Error saving user location:", error);
  }
};

/**
 * Get user's specified range in kilometers (default: 500km)
 */
export const getUserRange = (): number => {
  try {
    const storedRange = localStorage.getItem("userRange");
    if (storedRange) {
      return parseInt(storedRange, 10);
    }
  } catch (error) {
    console.error("Error getting user range:", error);
  }
  return 500; // Default 500km
};

/**
 * Save user's specified range
 */
export const saveUserRange = (range: number): void => {
  try {
    localStorage.setItem("userRange", range.toString());
  } catch (error) {
    console.error("Error saving user range:", error);
  }
};

