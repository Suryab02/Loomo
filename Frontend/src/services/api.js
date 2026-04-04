import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
})

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// Auth
export const register = (data) => API.post('/auth/register', data)
export const login = (data) => API.post('/auth/login', data)
export const getMe = () => API.get('/auth/me')

// Onboarding
export const uploadResume = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return API.post('/onboarding/upload-resume', formData)
}
export const savePreferences = (data) => API.post('/onboarding/preferences', data)

// Jobs — list supports pagination & filters (returns { items, total, page, per_page })
export const getJobs = (params = {}) => API.get('/jobs/', { params })
export const getJob = (id) => API.get(`/jobs/${id}`)
export const addJob = (data) => API.post('/jobs/', data)
export const patchJob = (id, data) => API.patch(`/jobs/${id}`, data)
export const parseJobText = (data) => API.post('/jobs/parse-text', data)
export const parseJobUrl = (data) => API.post('/jobs/parse-url', data)
export const updateJobStatus = (id, status) => API.put(`/jobs/${id}/status`, { status })
export const deleteJob = (id) => API.delete(`/jobs/${id}`)
export const syncGmail = () => API.get('/jobs/sync-gmail')
export const snoozeReminder = (id, days = 7) => API.post(`/jobs/${id}/reminder-snooze`, { days })
export const markReminderContacted = (id) => API.post(`/jobs/${id}/reminder-contacted`)

// Insights
export const getStats = () => API.get('/insights/stats')
export const getReminders = () => API.get('/insights/reminders')
export const getPlatforms = () => API.get('/insights/platforms')
export const getKeywords = () => API.get('/insights/keywords')
export const askAgent = (query) => API.post('/insights/chat', { query })
export const generateCoverLetter = (jobId) => API.post(`/insights/cover-letter/${jobId}`)
export const generateFollowUp = (jobId) => API.post(`/insights/follow-up-email/${jobId}`)
