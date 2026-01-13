import axios from 'axios'
import { clearTokens, getTokens, setTokens } from './token'
import { onTokenRefreshed } from './tokenRefreshCallback'

const baseURL = import.meta.env.VITE_APP_BASE_URL_MINISTER as string
const headers = {
  Accept: 'application/json',
  // 'Content-Type': 'application/json',
}

const axiosInstance = axios.create({
  baseURL,
  headers,
  // withCredentials: true,
})

axiosInstance.interceptors.request.use(
  (config) => {
    const { access_token } = getTokens()
    if (access_token) {
      config.headers['Authorization'] = `Bearer ${access_token}`
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    } else {
      config.headers['Content-Type'] = 'application/json'
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config
    
    // Handle 401 Unauthorized - Try to refresh token
    if (error?.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true
      
      try {
        const { refresh_token } = getTokens()
        
        if (!refresh_token) {
          // No refresh token available, logout
          clearTokens()
          // Only redirect if not already on login page
          if (window.location.pathname !== '/login') {
            window.location.href = '/login'
          }
          return Promise.reject(error)
        }
        
        // Call refresh token API using plain axios to avoid interceptor loops
        const refreshResponse = await axios.post<{
          access_token: string;
          refresh_token: string;
          token_type: string;
          expires_in: number;
        }>(
          `${baseURL}/api/auth/refresh`,
          { refresh_token },
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          }
        )
        
        const { access_token, refresh_token: newRefreshToken } = refreshResponse.data
        
        // Update tokens
        setTokens(access_token, newRefreshToken)
        
        // Notify that tokens were refreshed (triggers user data refetch)
        await onTokenRefreshed()
        
        // Retry the original request with new access token
        originalRequest.headers['Authorization'] = `Bearer ${access_token}`
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        // Refresh token failed, logout user
        clearTokens()
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }
    const currentPath = window.location.pathname
    if (error?.response?.status >= 500 && currentPath !== '/500') {
      clearTokens()
      window.location.href = '/500'
    }

    if ((!error.response || error.code === 'ERR_NETWORK') && currentPath !== '/network-error') {
      // Possible CORS or connectivity issue
      clearTokens()
      window.location.href = '/network-error'
    }

    return Promise.reject((error.response && error.response.data) || 'Something went wrong!')
  }
)

export default axiosInstance
