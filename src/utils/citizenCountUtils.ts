/**
 * Utility functions for managing registered citizens count
 */

import API_BASE_URL from "../api/config";

const CITIZEN_COUNT_KEY = "registeredCitizensCount";
const COUNT_CACHE_KEY = "registeredCitizensCountTimestamp";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

/**
 * Fetch the registered citizens count from the API
 */
export const fetchRegisteredCitizensCount = async (): Promise<number> => {
  try {
    const response = await fetch(`${API_BASE_URL}/citizens/count`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch count: ${response.statusText}`);
    }

    const data = await response.json();
    const count = data.count || 0;
    
    // Cache the count and timestamp
    setRegisteredCitizensCount(count);
    localStorage.setItem(COUNT_CACHE_KEY, Date.now().toString());
    
    return count;
  } catch (error) {
    console.error("Error fetching registered citizens count from API:", error);
    // Return cached value if API fails
    return getRegisteredCitizensCount();
  }
};

/**
 * Get the current registered citizens count from localStorage (cached)
 * Use fetchRegisteredCitizensCount() to get fresh data from API
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
 * Check if cached count is stale and needs refresh
 */
const isCacheStale = (): boolean => {
  try {
    const timestamp = localStorage.getItem(COUNT_CACHE_KEY);
    if (!timestamp) return true;
    const cacheAge = Date.now() - parseInt(timestamp, 10);
    return cacheAge > CACHE_DURATION;
  } catch {
    return true;
  }
};

/**
 * Get count from API if cache is stale, otherwise return cached value
 */
export const getRegisteredCitizensCountWithRefresh = async (): Promise<number> => {
  if (isCacheStale()) {
    return await fetchRegisteredCitizensCount();
  }
  return getRegisteredCitizensCount();
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

