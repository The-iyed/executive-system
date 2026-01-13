import axios from 'axios'
import { clearTokens, getTokens, setTokens } from './token'

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
    const previousRequest = error?.config
    if (error?.response?.status === 401 && !previousRequest?.sent) {
      previousRequest.sent = true
      try {
        const { refresh_token } = getTokens()
        const response = await axios.post(
          baseURL + '/api/auth/refresh',
          {
            refresh_token: refresh_token,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
        const { token } = response.data.payload
        setTokens(token)
        previousRequest.headers['Authorization'] = `Bearer ${token}`
        return axiosInstance(previousRequest)
      } catch (err) {
        clearTokens()
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