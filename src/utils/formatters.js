// Utilidades para formatear datos

// Formatear fechas
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Formatear precios
export const formatPrice = (price) => {
  if (!price) return 'N/A'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(price)
}

// Formatear kilómetros
export const formatKm = (km) => {
  if (!km) return 'N/A'
  return new Intl.NumberFormat('es-ES').format(km) + ' km'
}

// Obtener color del estado
export const getEstadoColor = (estado) => {
  switch (estado) {
    case 'disponible': return 'success'
    case 'alquilado': return 'warning'
    case 'reservado': return 'info'
    case 'taller': return 'error'
    case 'vendido': return 'secondary'
    default: return 'secondary'
  }
}

// Obtener icono del estado
export const getEstadoIcon = (estado) => {
  switch (estado) {
    case 'disponible': return '✅'
    case 'alquilado': return '🚗'
    case 'reservado': return '📅'
    case 'taller': return '🔧'
    case 'vendido': return '💰'
    default: return '❓'
  }
}

// Capitalizar primera letra
export const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
} 