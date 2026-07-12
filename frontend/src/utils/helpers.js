// Funciones de utilidad para OSINTArgy

import { VALIDATION, ERROR_MESSAGES, STORAGE_KEYS } from './constants'

/**
 * Formatea una fecha en español argentino
 * @param {Date|string} date - Fecha a formatear
 * @param {Object} options - Opciones de formato
 * @returns {string} Fecha formateada
 */
export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires'
  }
  
  const formatOptions = { ...defaultOptions, ...options }
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return dateObj.toLocaleDateString('es-AR', formatOptions)
}

/**
 * Formatea una fecha con hora en español argentino
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} Fecha y hora formateada
 */
export const formatDateTime = (date) => {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Calcula el tiempo transcurrido desde una fecha
 * @param {Date|string} date - Fecha de referencia
 * @returns {string} Tiempo transcurrido en formato legible
 */
export const timeAgo = (date) => {
  const now = new Date()
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const diffInSeconds = Math.floor((now - dateObj) / 1000)
  
  const intervals = [
    { label: 'año', seconds: 31536000 },
    { label: 'mes', seconds: 2592000 },
    { label: 'semana', seconds: 604800 },
    { label: 'día', seconds: 86400 },
    { label: 'hora', seconds: 3600 },
    { label: 'minuto', seconds: 60 }
  ]
  
  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds)
    if (count > 0) {
      return count === 1 
        ? `hace 1 ${interval.label}`
        : `hace ${count} ${interval.label}s`
    }
  }
  
  return 'hace un momento'
}

/**
 * Valida una dirección de email
 * @param {string} email - Email a validar
 * @returns {boolean} True si es válido
 */
export const isValidEmail = (email) => {
  return VALIDATION.EMAIL_REGEX.test(email)
}

/**
 * Valida una URL
 * @param {string} url - URL a validar
 * @returns {boolean} True si es válida
 */
export const isValidUrl = (url) => {
  return VALIDATION.URL_REGEX.test(url)
}

/**
 * Valida una contraseña
 * @param {string} password - Contraseña a validar
 * @returns {Object} Resultado de validación con errores
 */
export const validatePassword = (password) => {
  const errors = []
  
  if (!password) {
    errors.push('La contraseña es requerida')
  } else {
    if (password.length < VALIDATION.MIN_PASSWORD_LENGTH) {
      errors.push(`La contraseña debe tener al menos ${VALIDATION.MIN_PASSWORD_LENGTH} caracteres`)
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('La contraseña debe contener al menos una mayúscula')
    }
    if (!/[a-z]/.test(password)) {
      errors.push('La contraseña debe contener al menos una minúscula')
    }
    if (!/\d/.test(password)) {
      errors.push('La contraseña debe contener al menos un número')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Debounce function para optimizar búsquedas
 * @param {Function} func - Función a ejecutar
 * @param {number} delay - Delay en milisegundos
 * @returns {Function} Función debounced
 */
export const debounce = (func, delay) => {
  let timeoutId
  const debounced = (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }
  debounced.cancel = () => clearTimeout(timeoutId)
  return debounced
}

/**
 * Throttle function para limitar ejecuciones
 * @param {Function} func - Función a ejecutar
 * @param {number} limit - Límite en milisegundos
 * @returns {Function} Función throttled
 */
export const throttle = (func, limit) => {
  let inThrottle
  return (...args) => {
    if (!inThrottle) {
      func.apply(null, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Capitaliza la primera letra de una cadena
 * @param {string} str - Cadena a capitalizar
 * @returns {string} Cadena capitalizada
 */
export const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Trunca un texto a una longitud específica
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @param {string} suffix - Sufijo a agregar (default: '...')
 * @returns {string} Texto truncado
 */
export const truncateText = (text, maxLength, suffix = '...') => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength - suffix.length) + suffix
}

/**
 * Genera un ID único
 * @returns {string} ID único
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * Copia texto al portapapeles
 * @param {string} text - Texto a copiar
 * @returns {Promise<boolean>} True si se copió exitosamente
 */
export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // Fallback para navegadores más antiguos
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const result = document.execCommand('copy')
      textArea.remove()
      return result
    }
  } catch (error) {
    console.error('Error al copiar al portapapeles:', error)
    return false
  }
}

/**
 * Filtra herramientas por texto de búsqueda
 * @param {Array} tools - Array de herramientas
 * @param {string} query - Texto de búsqueda
 * @returns {Array} Herramientas filtradas
 */
export const filterToolsByQuery = (tools, query) => {
  if (!query || query.trim().length === 0) return tools
  
  const searchTerm = query.toLowerCase().trim()
  
  return tools.filter(tool => {
    const searchableText = [
      tool.name,
      tool.description,
      tool.utility,
      ...(tool.tags || []),
      tool.category,
      tool.subcategory,
      tool.region
    ].join(' ').toLowerCase()
    
    return searchableText.includes(searchTerm)
  })
}

/**
 * Agrupa herramientas por categoría
 * @param {Array} tools - Array de herramientas
 * @returns {Object} Herramientas agrupadas por categoría
 */
export const groupToolsByCategory = (tools) => {
  return tools.reduce((groups, tool) => {
    const category = tool.category || 'otros'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(tool)
    return groups
  }, {})
}

/**
 * Ordena herramientas por criterio
 * @param {Array} tools - Array de herramientas
 * @param {string} sortBy - Criterio de ordenamiento
 * @param {string} order - Orden (asc/desc)
 * @returns {Array} Herramientas ordenadas
 */
export const sortTools = (tools, sortBy = 'name', order = 'asc') => {
  return [...tools].sort((a, b) => {
    let valueA = a[sortBy]
    let valueB = b[sortBy]
    
    // Manejar valores numéricos
    if (sortBy === 'rating' || sortBy === 'usage_count') {
      valueA = Number(valueA) || 0
      valueB = Number(valueB) || 0
    }
    
    // Manejar fechas
    if (sortBy === 'last_updated') {
      valueA = new Date(valueA)
      valueB = new Date(valueB)
    }
    
    // Manejar strings
    if (typeof valueA === 'string') {
      valueA = valueA.toLowerCase()
      valueB = valueB.toLowerCase()
    }
    
    if (valueA < valueB) {
      return order === 'asc' ? -1 : 1
    }
    if (valueA > valueB) {
      return order === 'asc' ? 1 : -1
    }
    return 0
  })
}

/**
 * Manejo de localStorage con manejo de errores
 */
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error(`Error al leer ${key} del localStorage:`, error)
      return defaultValue
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error(`Error al guardar ${key} en localStorage:`, error)
      return false
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error(`Error al eliminar ${key} del localStorage:`, error)
      return false
    }
  },
  
  clear: () => {
    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.error('Error al limpiar localStorage:', error)
      return false
    }
  }
}

/**
 * Manejo de favoritos
 */
export const favorites = {
  get: () => storage.get(STORAGE_KEYS.FAVORITES, []),
  
  add: (toolId) => {
    const currentFavorites = favorites.get()
    if (!currentFavorites.includes(toolId)) {
      const newFavorites = [...currentFavorites, toolId]
      storage.set(STORAGE_KEYS.FAVORITES, newFavorites)
      return true
    }
    return false
  },
  
  remove: (toolId) => {
    const currentFavorites = favorites.get()
    const newFavorites = currentFavorites.filter(id => id !== toolId)
    storage.set(STORAGE_KEYS.FAVORITES, newFavorites)
    return true
  },
  
  toggle: (toolId) => {
    const currentFavorites = favorites.get()
    if (currentFavorites.includes(toolId)) {
      return favorites.remove(toolId)
    } else {
      return favorites.add(toolId)
    }
  },
  
  isFavorite: (toolId) => {
    const currentFavorites = favorites.get()
    return currentFavorites.includes(toolId)
  }
}

/**
 * Manejo de historial de búsqueda
 */
export const searchHistory = {
  get: () => storage.get(STORAGE_KEYS.SEARCH_HISTORY, []),
  
  add: (query) => {
    if (!query || query.trim().length === 0) return
    
    const currentHistory = searchHistory.get()
    const newHistory = [
      query.trim(),
      ...currentHistory.filter(item => item !== query.trim())
    ].slice(0, VALIDATION.MAX_SEARCH_HISTORY)
    
    storage.set(STORAGE_KEYS.SEARCH_HISTORY, newHistory)
  },
  
  clear: () => {
    storage.set(STORAGE_KEYS.SEARCH_HISTORY, [])
  }
}

/**
 * Manejo de errores HTTP
 * @param {Error} error - Error a manejar
 * @returns {string} Mensaje de error legible
 */
export const handleApiError = (error) => {
  if (!error.response) {
    return ERROR_MESSAGES.NETWORK_ERROR
  }
  
  const { status, data } = error.response
  
  switch (status) {
    case 400:
      return data?.message || ERROR_MESSAGES.VALIDATION_ERROR
    case 401:
      return ERROR_MESSAGES.UNAUTHORIZED
    case 404:
      return ERROR_MESSAGES.NOT_FOUND
    case 500:
      return ERROR_MESSAGES.SERVER_ERROR
    default:
      return data?.message || ERROR_MESSAGES.GENERIC_ERROR
  }
}

/**
 * Genera colores para categorías basado en hash
 * @param {string} categoryId - ID de la categoría
 * @returns {string} Color en formato HSL
 */
export const generateCategoryColor = (categoryId) => {
  let hash = 0
  for (let i = 0; i < categoryId.length; i++) {
    hash = categoryId.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 65%, 55%)`
}

/**
 * Convierte un color HSL a formato hexadecimal
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {string} Color en formato hex
 */
export const hslToHex = (h, s, l) => {
  l /= 100
  const a = s * Math.min(l, 1 - l) / 100
  const f = n => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

export default {
  formatDate,
  formatDateTime,
  timeAgo,
  isValidEmail,
  isValidUrl,
  validatePassword,
  debounce,
  throttle,
  capitalize,
  truncateText,
  generateId,
  copyToClipboard,
  filterToolsByQuery,
  groupToolsByCategory,
  sortTools,
  storage,
  favorites,
  searchHistory,
  handleApiError,
  generateCategoryColor,
  hslToHex
}
