import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

// Configuración de axios
axios.defaults.baseURL = 'http://localhost:3002'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loginForm, setLoginForm] = useState({
    nickname: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [dashboardData, setDashboardData] = useState({
    vehiculos: [],
    estadisticas: {}
  })

  // Estados para filtros y paginación
  const [filtros, setFiltros] = useState({
    estado: 'todos',
    marca: 'todos',
    transmision: 'todos',
    condicion: 'todos'
  })
  const [paginaActual, setPaginaActual] = useState(1)
  const [vehiculosPorPagina] = useState(12)


  // Verificar si hay un token guardado al cargar la app
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      checkAuthStatus()
    } else {
      setLoading(false)
    }
  }, [])

  // Cargar datos del dashboard cuando el usuario esté autenticado
  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData()
    }
  }, [isAuthenticated])

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get('/api/auth/me')
      setUser(response.data.user)
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Error verificando autenticación:', error)
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardData = async () => {
    try {
      // Cargar vehículos
      const vehiculosResponse = await axios.get('/api/vehiculos')
      
      // Cargar estadísticas
      const estadisticas = {
        totalVehiculos: vehiculosResponse.data.length,
        disponibles: vehiculosResponse.data.filter(v => v.estado === 'disponible').length,
        alquilados: vehiculosResponse.data.filter(v => v.estado === 'alquilado').length,
        reservados: vehiculosResponse.data.filter(v => v.estado === 'reservado').length,
        enMantenimiento: vehiculosResponse.data.filter(v => v.estado === 'taller').length,
        vendidos: vehiculosResponse.data.filter(v => v.estado === 'vendido').length
      }

      setDashboardData({
        vehiculos: vehiculosResponse.data,
        estadisticas
      })
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await axios.post('/api/auth/login', loginForm)
      const { token, user } = response.data
      
      localStorage.setItem('token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      setUser(user)
      setIsAuthenticated(true)
      setLoginForm({ nickname: '', password: '' })
    } catch (error) {
      console.error('Error en login:', error)
      setError(error.response?.data?.error || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    setIsAuthenticated(false)
  }

  const handleInputChange = (e) => {
    setLoginForm({
      ...loginForm,
      [e.target.name]: e.target.value
    })
  }

  const handleFiltroChange = (e) => {
    const { name, value } = e.target
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }))
    setPaginaActual(1) // Resetear a la primera página al cambiar filtros
  }

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'disponible': return 'success'
      case 'alquilado': return 'warning'
      case 'reservado': return 'info'
      case 'taller': return 'error'
      case 'vendido': return 'secondary'
      default: return 'secondary'
    }
  }

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'disponible': return '✅'
      case 'alquilado': return '🚗'
      case 'reservado': return '📅'
      case 'taller': return '🔧'
      case 'vendido': return '💰'
      default: return '❓'
    }
  }

  // Función para formatear fechas
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Filtrar vehículos
  const vehiculosFiltrados = dashboardData.vehiculos.filter(vehiculo => {
    const cumpleEstado = filtros.estado === 'todos' || vehiculo.estado === filtros.estado
    const cumpleMarca = filtros.marca === 'todos' || vehiculo.marca === filtros.marca
    const cumpleTransmision = filtros.transmision === 'todos' || vehiculo.transmision === filtros.transmision
    const cumpleCondicion = filtros.condicion === 'todos' || vehiculo.condicion === filtros.condicion
    
    return cumpleEstado && cumpleMarca && cumpleTransmision && cumpleCondicion
  })

  // Calcular paginación
  const indiceInicial = (paginaActual - 1) * vehiculosPorPagina
  const vehiculosPaginados = vehiculosFiltrados.slice(indiceInicial, indiceInicial + vehiculosPorPagina)
  const totalPaginas = Math.ceil(vehiculosFiltrados.length / vehiculosPorPagina)

  // Obtener marcas únicas para el filtro
  const marcasUnicas = [...new Set(dashboardData.vehiculos.map(v => v.marca))].sort()

  // Componente para mostrar información contextual según el estado
  const InfoReservaAlquiler = ({ vehiculo }) => {
    if (vehiculo.estado === 'alquilado' && vehiculo.alquiler_activo) {
      const a = vehiculo.alquiler_activo;
      return (
        <div className="reservation-info alquiler">
          <div className="reservation-header">
            <span className="reservation-icon">🚗</span>
            <span className="reservation-title">Alquilado</span>
          </div>
          <div className="reservation-details">
            <div className="reservation-item"><span className="label">Cliente:</span><span className="value">{a.cliente_nombre}</span></div>
            <div className="reservation-item"><span className="label">Recogida real:</span><span className="value">{formatDate(a.fecha_recogida_real)}</span></div>
            <div className="reservation-item"><span className="label">Devolución real:</span><span className="value">{formatDate(a.fecha_devolucion_real)}</span></div>
            <div className="reservation-item"><span className="label">Ubicación recogida:</span><span className="value">{a.pickup_ubicacion_id}</span></div>
            <div className="reservation-item"><span className="label">Ubicación devolución:</span><span className="value">{a.dropoff_ubicacion_id}</span></div>
            <div className="reservation-item"><span className="label">Km salida:</span><span className="value">{a.km_salida}</span></div>
            <div className="reservation-item"><span className="label">Nivel combustible salida:</span><span className="value">{a.nivel_combustible_salida}</span></div>
            <div className="reservation-item"><span className="label">Km entrada:</span><span className="value">{a.km_entrada ?? 'N/A'}</span></div>
            <div className="reservation-item"><span className="label">Nivel combustible entrada:</span><span className="value">{a.nivel_combustible_entrada ?? 'N/A'}</span></div>
          </div>
        </div>
      )
    }
    if (vehiculo.estado === 'reservado' && vehiculo.reserva_activa) {
      const r = vehiculo.reserva_activa;
      return (
        <div className="reservation-info reserva">
          <div className="reservation-header">
            <span className="reservation-icon">📅</span>
            <span className="reservation-title">Reservado</span>
          </div>
          <div className="reservation-details">
            <div className="reservation-item"><span className="label">Cliente:</span><span className="value">{r.cliente_nombre}</span></div>
            <div className="reservation-item"><span className="label">Categoría:</span><span className="value">{r.categoria_nombre}</span></div>
            <div className="reservation-item"><span className="label">Recogida prevista:</span><span className="value">{formatDate(r.fecha_recogida_prevista)}</span></div>
            <div className="reservation-item"><span className="label">Devolución prevista:</span><span className="value">{formatDate(r.fecha_devolucion_prevista)}</span></div>
            <div className="reservation-item"><span className="label">Ubicación recogida:</span><span className="value">{r.pickup_ubicacion_id}</span></div>
            <div className="reservation-item"><span className="label">Ubicación devolución:</span><span className="value">{r.dropoff_ubicacion_id}</span></div>
            <div className="reservation-item"><span className="label">Estado entrega:</span><span className="value">{r.estado_entrega}</span></div>
            <div className="reservation-item"><span className="label">Estado devolución:</span><span className="value">{r.estado_devolucion}</span></div>
          </div>
        </div>
      )
    }
    if (vehiculo.estado === 'taller' && vehiculo.mantenimiento_activo) {
      const m = vehiculo.mantenimiento_activo;
      return (
        <div className="reservation-info mantenimiento">
          <div className="reservation-header">
            <span className="reservation-icon">🔧</span>
            <span className="reservation-title">En Mantenimiento</span>
          </div>
          <div className="reservation-details">
            <div className="reservation-item"><span className="label">Fecha servicio:</span><span className="value">{formatDate(m.fecha_servicio)}</span></div>
            <div className="reservation-item"><span className="label">Km servicio:</span><span className="value">{m.km_servicio}</span></div>
            <div className="reservation-item"><span className="label">Descripción:</span><span className="value">{m.descripcion}</span></div>
            <div className="reservation-item"><span className="label">Coste:</span><span className="value">{m.coste ? `€${m.coste}` : 'N/A'}</span></div>
            <div className="reservation-item"><span className="label">Proveedor:</span><span className="value">{m.proveedor || 'N/A'}</span></div>
            <div className="reservation-item"><span className="label">Próximo servicio (km):</span><span className="value">{m.proximo_servicio_km || 'N/A'}</span></div>
          </div>
        </div>
      )
    }
    if (vehiculo.estado === 'vendido') {
      return (
        <div className="reservation-info vendido">
          <div className="reservation-header">
            <span className="reservation-icon">💰</span>
            <span className="reservation-title">Vendido</span>
          </div>
          <div className="reservation-details">
            <div className="reservation-item"><span className="label">Precio venta:</span><span className="value">{vehiculo.precio_venta_total ? `€${vehiculo.precio_venta_total.toLocaleString()}` : 'N/A'}</span></div>
            <div className="reservation-item"><span className="label">Fecha compra:</span><span className="value">{formatDate(vehiculo.fecha_compra)}</span></div>
            <div className="reservation-item"><span className="label">Fecha matriculación:</span><span className="value">{formatDate(vehiculo.fecha_matricula)}</span></div>
          </div>
        </div>
      )
    }
    if (vehiculo.estado === 'disponible') {
      return (
        <div className="reservation-info disponible">
          <div className="reservation-header">
            <span className="reservation-icon">✅</span>
            <span className="reservation-title">Disponible</span>
          </div>
          <div className="reservation-details">
            <div className="reservation-item"><span className="label">Fecha compra:</span><span className="value">{formatDate(vehiculo.fecha_compra)}</span></div>
            <div className="reservation-item"><span className="label">Fecha matriculación:</span><span className="value">{formatDate(vehiculo.fecha_matricula)}</span></div>
          </div>
        </div>
      )
    }
    return null;
  }

  // Componente para vista de lista mejorada
  const VistaLista = () => (
    <div className="vehicles-list">
      {vehiculosPaginados.map(vehiculo => (
        <div key={vehiculo.vehiculo_id} className={`list-item ${getEstadoColor(vehiculo.estado)}`}>
          <div className="list-item-header">
            <div className="list-item-main">
              <h4>{vehiculo.marca} {vehiculo.modelo}</h4>
              <div className="list-item-subtitle">
                <span className="matricula">{vehiculo.matricula}</span>
                <span className="year-badge">{vehiculo.anio}</span>
                <span className={`condition-badge ${vehiculo.condicion === 'NUEVO' ? 'new' : 'used'}`}>
                  {vehiculo.condicion}
                </span>
              </div>
            </div>
            <div className="list-item-status">
              <span className={`estado-badge ${getEstadoColor(vehiculo.estado)}`}>
                {getEstadoIcon(vehiculo.estado)} {vehiculo.estado}
              </span>
              <span className="price-display">€{vehiculo.precio_venta_total?.toLocaleString() || 'N/A'}</span>
            </div>
          </div>
          <div className="list-item-details">
            <div className="detail-group">
              <span className="detail-label">Kilómetros</span>
              <span className="detail-value">{vehiculo.km_actuales?.toLocaleString() || 'N/A'} km</span>
            </div>
            <div className="detail-group">
              <span className="detail-label">Transmisión</span>
              <span className="detail-value">{vehiculo.transmision}</span>
            </div>
            <div className="detail-group">
              <span className="detail-label">Categoría</span>
              <span className="detail-value">{vehiculo.categoria_nombre || 'N/A'}</span>
            </div>
            <div className="detail-group">
              <span className="detail-label">Ubicación</span>
              <span className="detail-value">{vehiculo.ubicacion_nombre || 'N/A'}</span>
            </div>
          </div>
          {/* Información de reserva/alquiler */}
          <InfoReservaAlquiler vehiculo={vehiculo} />
        </div>
      ))}
    </div>
  )

  // Renderizar vista de lista
  const renderVista = () => {
    return <VistaLista />
  }

  if (loading) {
  return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>🚗 GestorDeCoches</h1>
            <p>Sistema de Gestión de Alquiler de Vehículos</p>
          </div>
          
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="nickname">Usuario:</label>
              <input
                type="text"
                id="nickname"
                name="nickname"
                value={loginForm.nickname}
                onChange={handleInputChange}
                required
                placeholder="Ingresa tu usuario"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Contraseña:</label>
              <input
                type="password"
                id="password"
                name="password"
                value={loginForm.password}
                onChange={handleInputChange}
                required
                placeholder="Ingresa tu contraseña"
              />
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </button>
          </form>
          
          <div className="login-footer">
            <p>Usuarios de prueba:</p>
            <ul>
              <li><strong>admin</strong> - admin123</li>
              <li><strong>manager</strong> - manager123</li>
              <li><strong>user1</strong> - user123</li>
              <li><strong>user2</strong> - user123</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1>🚗 GestorDeCoches</h1>
          <div className="user-info">
            <span>Bienvenido, <strong>{user?.nickname}</strong></span>
            <button onClick={handleLogout} className="logout-button">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>
      
      <main className="app-main">
        <div className="dashboard">
          <h2>Panel de Control - Gestión de Vehículos</h2>
          
          {/* Estadísticas Generales */}
          <div className="stats-grid">
            <div className="stat-card">
              <h3>📊 Estadísticas Generales</h3>
              <div className="stat-items">
                <div className="stat-item">
                  <span className="stat-number">{dashboardData.estadisticas.totalVehiculos || 0}</span>
                  <span className="stat-label">Total Vehículos</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number success">{dashboardData.estadisticas.disponibles || 0}</span>
                  <span className="stat-label">Disponibles</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number warning">{dashboardData.estadisticas.alquilados || 0}</span>
                  <span className="stat-label">Alquilados</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number info">{dashboardData.estadisticas.reservados || 0}</span>
                  <span className="stat-label">Reservados</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number error">{dashboardData.estadisticas.enMantenimiento || 0}</span>
                  <span className="stat-label">En Mantenimiento</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number secondary">{dashboardData.estadisticas.vendidos || 0}</span>
                  <span className="stat-label">Vendidos</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros de Búsqueda */}
          <div className="filtros-section">
            <h3>🔍 Filtros de Búsqueda</h3>
            <div className="filtros-grid">
              <div className="filtro-item">
                <label htmlFor="estado">Estado:</label>
                <select 
                  id="estado" 
                  name="estado" 
                  value={filtros.estado} 
                  onChange={handleFiltroChange}
                >
                  <option value="todos">Todos los estados</option>
                  <option value="disponible">Disponible</option>
                  <option value="alquilado">Alquilado</option>
                  <option value="reservado">Reservado</option>
                  <option value="taller">En Mantenimiento</option>
                  <option value="vendido">Vendido</option>
                </select>
              </div>

              <div className="filtro-item">
                <label htmlFor="marca">Marca:</label>
                <select 
                  id="marca" 
                  name="marca" 
                  value={filtros.marca} 
                  onChange={handleFiltroChange}
                >
                  <option value="todos">Todas las marcas</option>
                  {marcasUnicas.map(marca => (
                    <option key={marca} value={marca}>{marca}</option>
                  ))}
                </select>
              </div>

              <div className="filtro-item">
                <label htmlFor="transmision">Transmisión:</label>
                <select 
                  id="transmision" 
                  name="transmision" 
                  value={filtros.transmision} 
                  onChange={handleFiltroChange}
                >
                  <option value="todos">Todas</option>
                  <option value="MANUAL">Manual</option>
                  <option value="AUTOMATICO">Automático</option>
                </select>
              </div>

              <div className="filtro-item">
                <label htmlFor="condicion">Condición:</label>
                <select 
                  id="condicion" 
                  name="condicion" 
                  value={filtros.condicion} 
                  onChange={handleFiltroChange}
                >
                  <option value="todos">Todas</option>
                  <option value="NUEVO">Nuevo</option>
                  <option value="USADO">Usado</option>
                </select>
              </div>
            </div>

            <div className="filtros-info">
              <span>Mostrando {vehiculosFiltrados.length} de {dashboardData.vehiculos.length} vehículos</span>
            </div>
          </div>



          {/* Lista de Vehículos */}
          <div className="vehicles-section">
            <h3>🚗 Flota de Vehículos</h3>
            
            {vehiculosFiltrados.length === 0 ? (
              <div className="no-results">
                <p>No se encontraron vehículos con los filtros seleccionados</p>
              </div>
            ) : (
              <>
                {renderVista()}

                {/* Paginación */}
                {totalPaginas > 1 && (
                  <div className="paginacion">
                    <button 
                      onClick={() => setPaginaActual(paginaActual - 1)}
                      disabled={paginaActual === 1}
                      className="paginacion-btn"
                    >
                      ← Anterior
                    </button>
                    
                    <div className="paginacion-info">
                      Página {paginaActual} de {totalPaginas}
                    </div>
                    
                    <button 
                      onClick={() => setPaginaActual(paginaActual + 1)}
                      disabled={paginaActual === totalPaginas}
                      className="paginacion-btn"
                    >
                      Siguiente →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
