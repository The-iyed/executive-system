/**
 * Get or create a unique browser ID
 * Stores the ID in localStorage for persistence across sessions
 */
export const getBrowserId = (): string => {
  const STORAGE_KEY = 'sanad_ai_browser_id';
  
  // Try to get existing ID from localStorage
  const existingId = localStorage.getItem(STORAGE_KEY);
  if (existingId) {
    return existingId;
  }
  
  // Generate a new ID if none exists
  // Format: browser_<timestamp>_<random>
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const newId = `browser_${timestamp}_${random}`;
  
  // Store in localStorage
  localStorage.setItem(STORAGE_KEY, newId);
  
  return newId;
};





