import axios from "axios";
import {
  ADMIN_AUTH_EXPIRED_EVENT,
  clearAdminSession,
  getAdminAccessToken,
  getAdminRefreshToken,
  setAdminSession,
} from "./adminAuthStorage";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const refreshURL = `${baseURL.replace(/\/+$/, "")}/admin/auth/refresh`;

export const adminClient = axios.create({ baseURL });

const AUTH_ENDPOINTS = ["/admin/auth/login", "/admin/auth/refresh"];

adminClient.interceptors.request.use((config) => {
  const token = getAdminAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise = null;

function doRefresh() {
  if (!refreshPromise) {
    const refreshToken = getAdminRefreshToken();
    refreshPromise = (
      refreshToken
        ? axios.post(refreshURL, { refresh_token: refreshToken })
        : Promise.reject(new Error("No refresh token"))
    )
      .then((res) => {
        setAdminSession(res.data);
        return res.data.access_token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

adminClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    const isAuthEndpoint =
      config && AUTH_ENDPOINTS.some((p) => config.url?.startsWith(p));

    if (response?.status === 401 && !isAuthEndpoint && !config._retried) {
      config._retried = true;
      try {
        const accessToken = await doRefresh();
        config.headers.Authorization = `Bearer ${accessToken}`;
        return adminClient(config);
      } catch {
        clearAdminSession();
        window.dispatchEvent(new Event(ADMIN_AUTH_EXPIRED_EVENT));
      }
    }
    return Promise.reject(error);
  },
);

export const adminAuthApi = {
  login: (payload) =>
    adminClient.post("/admin/auth/login", payload).then((r) => r.data),
  refresh: (refreshToken) =>
    adminClient
      .post("/admin/auth/refresh", { refresh_token: refreshToken })
      .then((r) => r.data),
  logout: (refreshToken) =>
    adminClient
      .post("/admin/auth/logout", { refresh_token: refreshToken })
      .then((r) => r.data),
  me: () => adminClient.get("/admin/auth/me").then((r) => r.data),
};

export const adminAdminsApi = {
  list: () => adminClient.get("/admin/admins").then((r) => r.data),
  create: (payload) =>
    adminClient.post("/admin/admins", payload).then((r) => r.data),
  remove: (id) => adminClient.delete(`/admin/admins/${id}`).then((r) => r.data),
};

export const adminUsersApi = {
  list: (params) =>
    adminClient.get("/admin/users", { params }).then((r) => r.data),
  setStatus: (id, isActive) =>
    adminClient
      .patch(`/admin/users/${id}/status`, { is_active: isActive })
      .then((r) => r.data),
};

export const adminPropertiesApi = {
  list: (params) =>
    adminClient.get("/admin/properties", { params }).then((r) => r.data),
  get: (id) => adminClient.get(`/admin/properties/${id}`).then((r) => r.data),
  setStatus: (id, status) =>
    adminClient
      .patch(`/admin/properties/${id}/status`, { status })
      .then((r) => r.data),
  remove: (id) =>
    adminClient.delete(`/admin/properties/${id}`).then((r) => r.data),
};

export const adminStatsApi = {
  summary: () => adminClient.get("/admin/stats/summary").then((r) => r.data),
};
