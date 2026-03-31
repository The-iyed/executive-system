import axios from "axios";
import { clearAllBrowserStorage, clearTokens } from "./token";
import { getAuthToken } from "./tokenGetter";
import { EXECUTION_SYSTEM_BASE_URL } from "@/lib/env";
import { getBrowserTimezone } from "@/lib/api/apiTimezone";
import { isSsoEnabled } from "@/lib/auth/ssoOrigin";
import { userManager } from "@/lib/auth/oidcConfig";

const baseURL = EXECUTION_SYSTEM_BASE_URL;
const headers = {
  Accept: "application/json",
  // 'Content-Type': 'application/json',
};

const axiosInstance = axios.create({
  baseURL,
  headers,
  // withCredentials: true,
});

let silentRenewPromise: Promise<unknown> | null = null;

axiosInstance.interceptors.request.use(
  async (config) => {
    config.headers["X-Timezone"] = getBrowserTimezone();
    const token = await getAuthToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    } else {
      config.headers["Content-Type"] = "application/json";
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config as (typeof error.config & { _retry?: boolean }) | undefined;
    if (error?.response?.status === 401) {
      if (isSsoEnabled()) {
        if (originalRequest?._retry) {
          return Promise.reject((error.response && error.response.data) || "حدث خطأ غير متوقع!");
        }

        try {
          if (!silentRenewPromise) {
            silentRenewPromise = userManager.signinSilent();
          }
          await silentRenewPromise;
          if (originalRequest) {
            originalRequest._retry = true;
            return axiosInstance(originalRequest);
          }
        } catch {
          return Promise.reject((error.response && error.response.data) || "حدث خطأ غير متوقع!");
        } finally {
          silentRenewPromise = null;
        }
      }
      clearAllBrowserStorage();
      return Promise.reject((error.response && error.response.data) || "حدث خطأ غير متوقع!");
    }

    return Promise.reject((error.response && error.response.data) || "حدث خطأ غير متوقع!");
  },
);

export default axiosInstance;
