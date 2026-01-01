/**
 * Utility functions for managing registered citizens count
 */

const CITIZEN_COUNT_KEY = "registeredCitizensCount";

/**
 * Get the current registered citizens count from localStorage
 */
export const getRegisteredCitizensCount = (): number => {
  try {
    const count = localStorage.getItem(CITIZEN_COUNT_KEY);
    if (count) {
      return parseInt(count, 10);
    }
  } catch (error) {
    console.error("Error getting registered citizens count:", error);
  }
  return 0;
};

/**
 * Set the registered citizens count in localStorage
 */
export const setRegisteredCitizensCount = (count: number): void => {
  try {
    localStorage.setItem(CITIZEN_COUNT_KEY, count.toString());
  } catch (error) {
    console.error("Error setting registered citizens count:", error);
  }
};

/**
 * Increment the registered citizens count
 */
export const incrementRegisteredCitizensCount = (): number => {
  const currentCount = getRegisteredCitizensCount();
  const newCount = currentCount + 1;
  setRegisteredCitizensCount(newCount);
  return newCount;
};

/**
 * Decrement the registered citizens count
 */
export const decrementRegisteredCitizensCount = (): number => {
  const currentCount = getRegisteredCitizensCount();
  const newCount = Math.max(0, currentCount - 1); // Ensure count doesn't go below 0
  setRegisteredCitizensCount(newCount);
  return newCount;
};

/**
 * Format the count for display (e.g., "1,234" or "1.2K")
 */
export const formatCitizenCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toLocaleString();
};

