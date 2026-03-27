import axios from 'axios'

// In dev, Vite proxies /api → http://localhost:8100
// In production, frontend is served by FastAPI itself (same origin)
const http = axios.create({ baseURL: import.meta.env.PROD ? '/' : '/api' })

export const getStats = (sourceId) =>
  http.get('/stats', { params: sourceId ? { video_source_id: sourceId } : {} })

export const getViolations = (params) =>
  http.get('/violations', { params })

export const acknowledgeViolation = (id) =>
  http.patch(`/violations/${id}/acknowledge`)

export const getSources = () =>
  http.get('/sources')

export const uploadVideo = (formData, params) =>
  http.post('/process-video', formData, { params })

export const processYoutube = (params) =>
  http.post('/process-youtube', null, { params })

export const getJob = (id) =>
  http.get(`/jobs/${id}`)

export const cancelJob = (id) =>
  http.post(`/jobs/${id}/cancel`)

export const getJobs = () =>
  http.get('/jobs')

export const predict = (formData) =>
  http.post('/predict', formData)

export const healthCheck = () =>
  http.get('/health')
