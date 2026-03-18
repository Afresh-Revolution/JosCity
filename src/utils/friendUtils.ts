/**
 * Utility functions for friend management
 */

export interface Friend {
  id: number;
  name: string;
  avatar: string;
  mutualFriends: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  isApproved?: boolean;
  isLoggedIn?: boolean;
}

/**
 * Get user's friends list from localStorage
 */
export const getFriendsList = (): number[] => {
  try {
    const friends = localStorage.getItem("userFriends");
    if (friends) {
      return JSON.parse(friends) as number[];
    }
  } catch (error) {
    console.error("Error getting friends list:", error);
  }
  return [];
};

/**
 * Add a friend to the user's friends list
 */
export const addFriend = (friendId: number): void => {
  try {
    const friends = getFriendsList();
    if (!friends.includes(friendId)) {
      friends.push(friendId);
      localStorage.setItem("userFriends", JSON.stringify(friends));
    }
  } catch (error) {
    console.error("Error adding friend:", error);
  }
};

/**
 * Remove a friend from the user's friends list
 */
export const removeFriend = (friendId: number): void => {
  try {
    const friends = getFriendsList();
    const updatedFriends = friends.filter((id) => id !== friendId);
    localStorage.setItem("userFriends", JSON.stringify(updatedFriends));
  } catch (error) {
    console.error("Error removing friend:", error);
  }
};

/**
 * Check if a user is a friend
 */
export const isFriend = (friendId: number): boolean => {
  const friends = getFriendsList();
  return friends.includes(friendId);
};

