import axios from "axios";
import { clearAllBrowserStorage } from "./token";
import { getAuthToken } from "./tokenGetter";
import { EXECUTION_SYSTEM_BASE_URL } from "@/lib/env";
import { getBrowserTimezone } from "@/lib/api/apiTimezone";
import { isSsoEnabled, initiateLogin, refreshAccessToken } from "@/lib/auth";

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

/** Single in-flight refresh call shared by concurrent 401s. */
let refreshPromise: Promise<unknown> | null = null;
/** Track concurrent waiters so we clear shared refresh only after the batch settles. */
let refreshWaiters = 0;

let ssoReloginPromise: Promise<void> | null = null;

function ensureSsoRelogin(): void {
  ssoReloginPromise ??= initiateLogin()
    .catch(() => {})
    .finally(() => {
      ssoReloginPromise = null;
    });
}

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
          ensureSsoRelogin();
          return Promise.reject((error.response && error.response.data) || "حدث خطأ غير متوقع!");
        }

        refreshWaiters += 1;
        try {
          refreshPromise ??= refreshAccessToken();
          const refreshed = await refreshPromise;
          if (!refreshed) {
            throw new Error("No refresh token available");
          }
          if (originalRequest) {
            originalRequest._retry = true;
            return axiosInstance(originalRequest);
          }
          ensureSsoRelogin();
          return Promise.reject((error.response && error.response.data) || "حدث خطأ غير متوقع!");
        } catch {
          ensureSsoRelogin();
          return Promise.reject((error.response && error.response.data) || "حدث خطأ غير متوقع!");
        } finally {
          refreshWaiters -= 1;
          if (refreshWaiters === 0) {
            refreshPromise = null;
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
