import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
})
// Automatically add token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

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

// Jobs
export const getJobs = () => API.get('/jobs/')
export const addJob = (data) => API.post('/jobs/', data)
export const parseJobText = (data) => API.post('/jobs/parse-text', data)
export const updateJobStatus = (id, status) => API.put(`/jobs/${id}/status`, { status })
export const deleteJob = (id) => API.delete(`/jobs/${id}`)

// Insights
export const getStats = () => API.get('/insights/stats')
export const getPlatforms = () => API.get('/insights/platforms')
export const getKeywords = () => API.get('/insights/keywords')
export const askAgent = (query) => API.post('/insights/chat', { query })
export const generateCoverLetter = (jobId) => API.post(`/insights/cover-letter/${jobId}`)