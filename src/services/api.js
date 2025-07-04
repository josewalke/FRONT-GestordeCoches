import axios from 'axios'

// Configuración base de axios
const api = axios.create({
  baseURL: 'http://localhost:3002',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para añadir token a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

// Servicios de autenticación
export const authService = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  getCurrentUser: () => api.get('/api/auth/me'),
  changePassword: (passwords) => api.post('/api/auth/change-password', passwords)
}

// Servicios de vehículos
export const vehicleService = {
  getAllVehicles: () => api.get('/api/vehiculos'),
  getVehicleById: (id) => api.get(`/api/vehiculos/${id}`),
  createVehicle: (vehicleData) => api.post('/api/vehiculos', vehicleData),
  updateVehicle: (id, vehicleData) => api.put(`/api/vehiculos/${id}`, vehicleData),
  deleteVehicle: (id) => api.delete(`/api/vehiculos/${id}`)
}

// Servicio de prueba de conexión
export const testService = {
  testConnection: () => api.get('/api/test')
}

export default api 