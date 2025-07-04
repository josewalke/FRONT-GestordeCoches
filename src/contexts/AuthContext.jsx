import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Verificar autenticación al cargar
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        const response = await authService.getCurrentUser()
        setUser(response.data.user)
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error)
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials) => {
    try {
      setError('')
      const response = await authService.login(credentials)
      const { token, user } = response.data
      
      localStorage.setItem('token', token)
      setUser(user)
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error al iniciar sesión'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setError('')
  }

  const changePassword = async (passwords) => {
    try {
      setError('')
      await authService.changePassword(passwords)
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error cambiando contraseña'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    changePassword,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 