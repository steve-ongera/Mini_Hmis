import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const ACCESS_TOKEN_KEY = "hms_access_token";
const REFRESH_TOKEN_KEY = "hms_refresh_token";

export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (access, refresh) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach the access token to every outgoing request.
api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On a 401, try exactly once to refresh the access token and replay the
// original request. If refresh fails, clear tokens and force a re-login.
let isRefreshing = false;
let pendingQueue = [];

const processQueue = (error, token = null) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  pendingQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const refreshToken = tokenStorage.getRefresh();
    if (!refreshToken) {
      tokenStorage.clear();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
        refresh: refreshToken,
      });
      tokenStorage.setTokens(data.access, data.refresh);
      processQueue(null, data.access);
      originalRequest.headers.Authorization = `Bearer ${data.access}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      tokenStorage.clear();
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const login = (username, password) =>
  api.post("/auth/login/", { username, password });

export const refreshToken = (refresh) => api.post("/auth/refresh/", { refresh });

export const logout = (refresh) => api.post("/auth/logout/", { refresh });

// ---------------------------------------------------------------------------
// Doctors
// ---------------------------------------------------------------------------
export const getDoctors = (params = {}) => api.get("/doctors/", { params });
export const getDoctor = (id) => api.get(`/doctors/${id}/`);
export const createDoctor = (payload) => api.post("/doctors/", payload);
export const updateDoctor = (id, payload) => api.patch(`/doctors/${id}/`, payload);
export const deleteDoctor = (id) => api.delete(`/doctors/${id}/`);
export const getDoctorSchedule = (id, date) =>
  api.get(`/doctors/${id}/schedule/`, { params: date ? { date } : {} });

// ---------------------------------------------------------------------------
// Patients
// ---------------------------------------------------------------------------
export const getPatients = (params = {}) => api.get("/patients/", { params });
export const getPatient = (id) => api.get(`/patients/${id}/`);
export const createPatient = (payload) => api.post("/patients/", payload);
export const updatePatient = (id, payload) => api.patch(`/patients/${id}/`, payload);
export const deletePatient = (id) => api.delete(`/patients/${id}/`);
export const assignDoctorToPatient = (patientId, doctorId) =>
  api.patch(`/patients/${patientId}/assign-doctor/`, { doctor_id: doctorId });

// ---------------------------------------------------------------------------
// Appointments
// ---------------------------------------------------------------------------
export const getAppointments = (params = {}) => api.get("/appointments/", { params });
export const getAppointment = (id) => api.get(`/appointments/${id}/`);
export const createAppointment = (payload) => api.post("/appointments/", payload);
export const updateAppointment = (id, payload) => api.patch(`/appointments/${id}/`, payload);
export const deleteAppointment = (id) => api.delete(`/appointments/${id}/`);

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export const getDashboardStats = () => api.get("/dashboard/stats/");

export default api;