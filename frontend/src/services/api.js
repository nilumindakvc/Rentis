import axios from "axios";
import {
  AUTH_EXPIRED_EVENT,
  clearSession,
  getAccessToken,
  getRefreshToken,
  setSession,
} from "./authStorage";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const refreshURL = `${baseURL.replace(/\/+$/, "")}/auth/refresh`;

export const client = axios.create({ baseURL });

const AUTH_ENDPOINTS = ["/auth/login", "/auth/signup", "/auth/refresh"];

client.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise = null;

function doRefresh() {
  if (!refreshPromise) {
    const refreshToken = getRefreshToken();
    refreshPromise = (
      refreshToken
        ? axios.post(refreshURL, { refresh_token: refreshToken })
        : Promise.reject(new Error("No refresh token"))
    )
      .then((res) => {
        setSession(res.data);
        return res.data.access_token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

client.interceptors.response.use(
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
        return client(config);
      } catch {
        clearSession();
        window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
      }
    }
    return Promise.reject(error);
  },
);

export const authApi = {
  signup: (payload) => client.post("/auth/signup", payload).then((r) => r.data),
  login: (payload) => client.post("/auth/login", payload).then((r) => r.data),
  refresh: (refreshToken) =>
    client
      .post("/auth/refresh", { refresh_token: refreshToken })
      .then((r) => r.data),
  logout: (refreshToken) =>
    client
      .post("/auth/logout", { refresh_token: refreshToken })
      .then((r) => r.data),
  me: () => client.get("/auth/me").then((r) => r.data),
};

export const taxonomyApi = {
  getPrimaryCategories: () =>
    client.get("/taxonomy/primary-categories").then((r) => r.data),
  getCategories: (params) =>
    client.get("/taxonomy/categories", { params }).then((r) => r.data),
};

export const partnersApi = {
  list: () => client.get("/partners").then((r) => r.data),
};

export const propertiesApi = {
  search: (params) => client.get("/properties", { params }).then((r) => r.data),
  getById: (id) => client.get(`/properties/${id}`).then((r) => r.data),
  getMine: () => client.get("/properties/mine").then((r) => r.data),
  create: (payload) => client.post("/properties", payload).then((r) => r.data),
  update: (id, payload) =>
    client.put(`/properties/${id}`, payload).then((r) => r.data),
  updateStatus: (id, payload) =>
    client.patch(`/properties/${id}/status`, payload).then((r) => r.data),
  remove: (id) => client.delete(`/properties/${id}`).then((r) => r.data),
};

export const favoritesApi = {
  list: () => client.get("/favorites").then((r) => r.data),
  add: (propertyId) =>
    client.post("/favorites", { property_id: propertyId }).then((r) => r.data),
  remove: (propertyId) =>
    client.delete(`/favorites/${propertyId}`).then((r) => r.data),
};

export const conversationsApi = {
  start: (payload) =>
    client.post("/conversations", payload).then((r) => r.data),
  list: () => client.get("/conversations").then((r) => r.data),
  messages: (id, params) =>
    client.get(`/conversations/${id}/messages`, { params }).then((r) => r.data),
  send: (id, body) =>
    client.post(`/conversations/${id}/messages`, { body }).then((r) => r.data),
  markRead: (id) =>
    client.patch(`/conversations/${id}/read`).then((r) => r.data),
};

export const notificationsApi = {
  list: (params) =>
    client.get("/notifications", { params }).then((r) => r.data),
  unreadCount: () =>
    client.get("/notifications/unread-count").then((r) => r.data),
  markRead: (id) =>
    client.patch(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () =>
    client.patch("/notifications/read-all").then((r) => r.data),
};

export const ownerStatsApi = {
  summary: () => client.get("/owner/stats/summary").then((r) => r.data),
};

export const uploadsApi = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return client.post("/uploads/image", formData).then((r) => r.data);
  },
};

export const availabilityApi = {
  list: (propertyId) =>
    client.get(`/properties/${propertyId}/availability`).then((r) => r.data),
  create: (propertyId, payload) =>
    client
      .post(`/properties/${propertyId}/availability`, payload)
      .then((r) => r.data),
  remove: (propertyId, blockId) =>
    client
      .delete(`/properties/${propertyId}/availability/${blockId}`)
      .then((r) => r.data),
};

export const bookingsApi = {
  create: (payload) => client.post("/bookings", payload).then((r) => r.data),
  mine: () => client.get("/bookings/mine").then((r) => r.data),
  forOwner: (params) =>
    client.get("/bookings/owner", { params }).then((r) => r.data),
  accept: (id) => client.patch(`/bookings/${id}/accept`).then((r) => r.data),
  reject: (id) => client.patch(`/bookings/${id}/reject`).then((r) => r.data),
  cancel: (id) => client.patch(`/bookings/${id}/cancel`).then((r) => r.data),
  checkout: (id) => client.post(`/bookings/${id}/checkout`).then((r) => r.data),
};

export const reviewsApi = {
  listForProperty: (propertyId) =>
    client.get(`/properties/${propertyId}/reviews`).then((r) => r.data),
  mine: () => client.get("/reviews/mine").then((r) => r.data),
  create: (payload) => client.post("/reviews", payload).then((r) => r.data),
  update: (id, payload) =>
    client.put(`/reviews/${id}`, payload).then((r) => r.data),
};

export const paymentsApi = {
  connectOnboard: (country) =>
    client.post("/payments/connect/onboard", { country }).then((r) => r.data),
  connectStatus: () =>
    client.get("/payments/connect/status").then((r) => r.data),
};
