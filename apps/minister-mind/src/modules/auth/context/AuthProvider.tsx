import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jwtDecode } from 'jwt-decode';
import { getTokens, clearTokens } from '../utils/token';
import { setTokenRefreshCallback } from '../utils/tokenRefreshCallback';
import { loginApi, getCurrentUserApi, LoginPayload, User } from '../data/authApi';
import { useIsMountedRef } from '../hooks';
import { ScreenLoader } from '@shared';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isInitialised: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface JwtPayload {
  exp: number;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Query keys - defined outside component to avoid recreation
const USER_QUERY_KEY = ['auth', 'user'];

const isValidToken = (token: string): boolean => {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp ? decoded.exp > currentTime : false;
  } catch {
    return false;
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const isMounted = useIsMountedRef();
  const queryClient = useQueryClient();
  const [isInitialised, setIsInitialised] = useState(false);

  // Get current user query
  const {
    data: user,
    isLoading: isLoadingUser,
    isError,
  } = useQuery({
    queryKey: USER_QUERY_KEY,
    queryFn: getCurrentUserApi,
    enabled: false, // We'll manually trigger this
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: loginApi,
    onError: (error) => {
      console.error('Login error:', error);
      clearTokens();
    },
  });

  // Function to refetch user data after token refresh
  const refetchUserData = useCallback(async () => {
    try {
      const userData = await queryClient.fetchQuery({
        queryKey: USER_QUERY_KEY,
        queryFn: getCurrentUserApi,
      });
      // Explicitly set the query data to ensure it's in cache and triggers re-render
      queryClient.setQueryData(USER_QUERY_KEY, userData);
      // Refetch to ensure the hook gets updated
      await queryClient.refetchQueries({ queryKey: USER_QUERY_KEY });
    } catch (error) {
      console.error('Error refetching user data after token refresh:', error);
      // Don't clear tokens here - let the interceptor handle it
    }
  }, [queryClient]);

  // Register token refresh callback
  useEffect(() => {
    setTokenRefreshCallback(refetchUserData);
    
    // Cleanup: remove callback on unmount
    return () => {
      setTokenRefreshCallback(null);
    };
  }, [refetchUserData]);

  // Initialize auth state
  useEffect(() => {
    if (!isMounted.current) {
      return;
    }

    const errorPaths = ['/500', '/network-error'];
    if (errorPaths.includes(window.location.pathname)) {
      setIsInitialised(true);
      return;
    }

    async function initializeAuth() {
      const { access_token, refresh_token } = getTokens();

      // Check if we have valid tokens
      if (refresh_token && isValidToken(refresh_token)) {
        if (access_token && isValidToken(access_token)) {
          // We have valid tokens, fetch user
          try {
            await queryClient.fetchQuery({
              queryKey: USER_QUERY_KEY,
              queryFn: getCurrentUserApi,
            });
          } catch (error) {
            // Error is handled by axios interceptor
            // Clear tokens if fetch fails
            clearTokens();
          }
        } else {
          // Access token expired but refresh token is valid
          // The axios interceptor will handle refresh
          try {
            await queryClient.fetchQuery({
              queryKey: USER_QUERY_KEY,
              queryFn: getCurrentUserApi,
            });
          } catch (error) {
            clearTokens();
          }
        }
      } else {
        // No valid tokens
        clearTokens();
      }

      setIsInitialised(true);
    }

    initializeAuth();
  }, [isMounted, queryClient]);

  // Handle logout
  const logout = () => {
    clearTokens();
    queryClient.setQueryData(USER_QUERY_KEY, null);
    queryClient.removeQueries({ queryKey: USER_QUERY_KEY });
  };

  // Handle login
  const login = async (payload: LoginPayload): Promise<User> => {
    // Perform login
    await loginMutation.mutateAsync(payload);
    // After successful login, fetch user data
    try {
      const userData = await queryClient.fetchQuery({
        queryKey: USER_QUERY_KEY,
        queryFn: getCurrentUserApi,
      });
      // Explicitly set the query data to ensure it's in cache and triggers re-render
      queryClient.setQueryData(USER_QUERY_KEY, userData);
      // Refetch to ensure the hook gets updated (even though enabled is false, this will update the cache)
      await queryClient.refetchQueries({ queryKey: USER_QUERY_KEY });
      return userData;
    } catch (error) {
      console.error('Error fetching user after login:', error);
      throw error;
    }
  };

  // Get user from cache if query data is not available (for disabled queries)
  const cachedUser = queryClient.getQueryData<User>(USER_QUERY_KEY);
  const currentUser = user || cachedUser || null;
  
  const isLoading = isLoadingUser || loginMutation.isPending;
  const isAuthenticated = !!currentUser && !isError;

  // Centralized loading/initialization check - don't render children until ready
  if (!isInitialised || isLoading) {
    return <ScreenLoader />;
  }

  const value: AuthContextType = {
    user: currentUser,
    isAuthenticated,
    isInitialised,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;