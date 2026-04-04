import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
});

API.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (res: AxiosResponse) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// Auth
export const register = (data: any) => API.post('/auth/register', data);
export const login = (data: any) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');

// Onboarding
export const uploadResume = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return API.post('/onboarding/upload-resume', formData);
};
export const savePreferences = (data: any) => API.post('/onboarding/preferences', data);

// Jobs — list supports pagination & filters (returns { items, total, page, per_page })
export const getJobs = (params: any = {}) => API.get('/jobs/', { params });
export const getJob = (id: number) => API.get(`/jobs/${id}`);
export const addJob = (data: any) => API.post('/jobs/', data);
export const patchJob = (id: number, data: any) => API.patch(`/jobs/${id}`, data);
export const parseJobText = (data: { text: string }) => API.post('/jobs/parse-text', data);
export const parseJobUrl = (data: { url: string }) => API.post('/jobs/parse-url', data);
export const updateJobStatus = (id: number, status: string) => API.put(`/jobs/${id}/status`, { status });
export const deleteJob = (id: number) => API.delete(`/jobs/${id}`);
export const syncGmail = () => API.get('/jobs/sync-gmail');
export const snoozeReminder = (id: number, days: number = 7) => API.post(`/jobs/${id}/reminder-snooze`, { days });
export const markReminderContacted = (id: number) => API.post(`/jobs/${id}/reminder-contacted`);

// Insights
export const getStats = () => API.get('/insights/stats');
export const getReminders = () => API.get('/insights/reminders');
export const getPlatforms = () => API.get('/insights/platforms');
export const getKeywords = () => API.get('/insights/keywords');
export const askAgent = (query: string) => API.post('/insights/chat', { query });
export const generateCoverLetter = (jobId: number) => API.post(`/insights/cover-letter/${jobId}`);
export const generateFollowUp = (jobId: number) => API.post(`/insights/follow-up-email/${jobId}`);
