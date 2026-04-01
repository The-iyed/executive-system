import axios from "axios";
import { clearAllBrowserStorage } from "./token";
import { getAuthToken } from "./tokenGetter";
import { EXECUTION_SYSTEM_BASE_URL } from "@/lib/env";
import { getBrowserTimezone } from "@/lib/api/apiTimezone";
import { isSsoEnabled, renewToken } from "@/lib/auth";

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

/** Single in-flight renewal shared across all concurrent 401s. */
let renewPromise: Promise<unknown> | null = null;
let renewWaiters = 0;

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

        renewWaiters += 1;
        try {
          renewPromise ??= renewToken();
          const renewed = await renewPromise;
          if (renewed && originalRequest) {
            originalRequest._retry = true;
            return axiosInstance(originalRequest);
          }
          return Promise.reject((error.response && error.response.data) || "حدث خطأ غير متوقع!");
        } catch {
          return Promise.reject((error.response && error.response.data) || "حدث خطأ غير متوقع!");
        } finally {
          renewWaiters -= 1;
          if (renewWaiters === 0) {
            renewPromise = null;
          }
        }
      }
      clearAllBrowserStorage();
      return Promise.reject((error.response && error.response.data) || "حدث خطأ غير متوقع!");
    }

    return Promise.reject((error.response && error.response.data) || "حدث خطأ غير متوقع!");
  },
);

export default axiosInstance;
