/**
 * LocalStorage service for managing user ID
 */

const USER_ID_KEY = 'OWS_USER_ID';

// Generate a random GUID
export const generateGuid = (): string => {
  const guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
  return `${USER_ID_KEY}_${guid}`;
};

// Check if code is running in browser environment
const isBrowser = (): boolean => {
  return typeof window !== 'undefined';
};

/**
 * Get user ID from localStorage
 * @returns The stored user ID or null if not found
 */
export const getUserId = (): string | null => {
  if (!isBrowser()) {
    return null;
  }
  
  return localStorage.getItem(USER_ID_KEY);
};

/**
 * Set user ID in localStorage
 * @param userId - The user ID to store
 * @returns true if successful, false if not in browser environment
 */
export const setUserId = (userId: string): boolean => {
  if (!isBrowser()) {
    return false;
  }
  
  localStorage.setItem(USER_ID_KEY, userId);
  return true;
};

/**
 * Get existing user ID or generate a new one
 * @returns User ID (existing or newly generated)
 */
export const getOrCreateUserId = (): string => {
  if (!isBrowser()) {
    return '';
  }
  
  let userId = getUserId();
  
  if (!userId) {
    userId = generateGuid();
    setUserId(userId);
  }
  
  return userId;
}; 
