import axios from 'axios'

const API_BASE = '/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000, // 2 minutes for inference
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('[API] Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response: ${response.status}`)
    return response
  },
  (error) => {
    console.error('[API] Response error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// API functions
export const getModels = () => api.get('/models')

export const getChips = () => api.get('/chips')

export const predict = (data) => api.post('/predict', data)

export const predictFromUpload = (formData, params = {}) => {
  const queryString = new URLSearchParams(params).toString()
  return api.post(`/predict/upload${queryString ? '?' + queryString : ''}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const getResults = () => api.get('/results')

export const getResult = (id) => api.get(`/results/${id}`)

export const deleteResult = (id) => api.delete(`/results/${id}`)

export const downloadPrediction = (resultId, modelName) => 
  api.get(`/results/${resultId}/download/${modelName}`, {
    responseType: 'blob',
  })

export const getGroundTruth = (chipId) => api.get(`/ground-truth/${chipId}`)

export default api
