import axios from 'axios'

const resolvedBase = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : import.meta.env.DEV
    ? 'http://localhost:5000/api'
    : '/api'

const api = axios.create({
  baseURL: resolvedBase
})

// Attach token
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('dk_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Auto-logout on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = data => api.post('/auth/login', data)

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getDashboard = () => api.get('/dashboard')

// ── Plants ────────────────────────────────────────────────────────────────────
export const getPlants    = (inc) => api.get('/plants', { params: { includeInactive: inc } })
export const getPlant     = id    => api.get(`/plants/${id}`)
export const createPlant  = data  => api.post('/plants', data)
export const updatePlant  = (id, data) => api.put(`/plants/${id}`, data)
export const togglePlant  = id    => api.patch(`/plants/${id}/toggle`)

// ── Locations ─────────────────────────────────────────────────────────────────
export const getLocations   = ()       => api.get('/locations')
export const createLocation = data     => api.post('/locations', data)
export const updateLocation = (id, d)  => api.put(`/locations/${id}`, d)

// ── Stock ─────────────────────────────────────────────────────────────────────
export const getStock    = f    => api.get('/stock', { params: { filter: f } })
export const upsertStock = data => api.post('/stock/upsert', data)
export const refillStock = data => api.post('/stock/refill', data)

// ── Orders ────────────────────────────────────────────────────────────────────
export const getOrders = () => api.get('/orders')
export const getOrder  = id => api.get(`/orders/${id}`)

// ── QR ────────────────────────────────────────────────────────────────────────
export const getPlantInfo  = (plantId, locationId) => api.get('/qr/plant-info', { params: { plantId, locationId } })
export const getQRImageUrl = (plantId, locationId) => {
  const token = localStorage.getItem('dk_token')
  const base  = import.meta.env.VITE_API_BASE_URL || ''
  return `${base}/api/qr/generate?plantId=${plantId}&locationId=${locationId}&token=${token}`
}

// ── Payment ───────────────────────────────────────────────────────────────────
export const createPaymentOrder = data => api.post('/payment/create-order', data)
export const verifyPayment      = data => api.post('/payment/verify', data)

export default api
