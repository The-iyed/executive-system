/**
 * Token refresh callback utility
 * Allows the axios interceptor to notify the AuthProvider when tokens are refreshed
 */

type TokenRefreshCallback = () => void | Promise<void>;

let tokenRefreshCallback: TokenRefreshCallback | null = null;

/**
 * Set the callback to be called when tokens are refreshed
 */
export const setTokenRefreshCallback = (callback: TokenRefreshCallback | null) => {
  tokenRefreshCallback = callback;
};

/**
 * Call the registered callback (used by axios interceptor)
 */
export const onTokenRefreshed = async () => {
  if (tokenRefreshCallback) {
    try {
      await tokenRefreshCallback();
    } catch (error) {
      console.error('Error in token refresh callback:', error);
    }
  }
};
