import axios from "axios";
import { useAuthStore } from "@/store/authStore";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Inject the JWT access token into every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Silent refresh — on 401, try to exchange the refresh token for a new
// access token, then replay the original request. If refresh fails, log out.
let isRefreshing = false;
let queue: Array<(token: string) => void> = [];

function drainQueue(token: string) {
  queue.forEach((cb) => cb(token));
  queue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // Only attempt refresh on 401s that haven't already been retried,
    // and skip the refresh endpoint itself to avoid infinite loops.
    if (
      error?.response?.status !== 401 ||
      original._retry ||
      original.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    original._retry = true;

    const { refreshToken, user, clearAuth, setAuth } = useAuthStore.getState();

    if (!refreshToken) {
      clearAuth();
      if (typeof window !== "undefined") window.location.href = "/login";
      return Promise.reject(error);
    }

    // If a refresh is already in flight, queue this request until it resolves.
    if (isRefreshing) {
      return new Promise((resolve) => {
        queue.push((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(api(original));
        });
      });
    }

    isRefreshing = true;

    try {
      const { data } = await api.post("/auth/refresh", { refreshToken });
      const { accessToken: newToken, refreshToken: newRefresh } = data;

      setAuth(newToken, newRefresh, user!);
      drainQueue(newToken);

      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch {
      clearAuth();
      if (typeof window !== "undefined") window.location.href = "/login";
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
