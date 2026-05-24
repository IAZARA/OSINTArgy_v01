import { toolsAPI, categoriesAPI, favoritesAPI, ratingsAPI } from './api'
import { storage, filterToolsByQuery, sortTools } from '@utils/helpers'
import { SEARCH, PAGINATION } from '@utils/constants'

/**
 * Servicio de herramientas para OSINTArgy
 * Maneja todas las operaciones relacionadas con herramientas OSINT
 */
export const toolsService = {
  /**
   * Obtener todas las herramientas
   * @param {Object} params - Parámetros de consulta
   * @returns {Promise<Object>} Lista de herramientas
   */
  getAllTools: async (params = {}) => {
    try {
      // Usar datos locales directamente
      const toolsData = await import('@data/tools/index.js')
      const allToolsData = toolsData.getAllTools()

      return {
        success: true,
        data: allToolsData.tools,
        totalCount: allToolsData.totalCount,
        message: 'Herramientas obtenidas correctamente desde archivos locales'
      }
    } catch (error) {
      console.error('Error al obtener herramientas desde archivos locales:', error)

      // Fallback al archivo tools.json básico
      try {
        const basicToolsData = await import('@data/tools.json')
        return {
          success: true,
          data: basicToolsData.default.tools || [],
          message: 'Herramientas obtenidas desde archivo básico'
        }
      } catch (fallbackError) {
        console.error('Error en fallback:', fallbackError)
        return {
          success: false,
          message: 'Error al cargar herramientas'
        }
      }
    }
  },

  /**
   * Obtener herramienta por ID
   * @param {string} id - ID de la herramienta
   * @returns {Promise<Object>} Datos de la herramienta
   */
  getToolById: async (id) => {
    try {
      if (!id) {
        return {
          success: false,
          message: 'ID de herramienta requerido'
        }
      }

      const response = await toolsAPI.getById(id)
      
      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: 'Herramienta obtenida correctamente'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Herramienta no encontrada'
      }
    } catch (error) {
      console.error('Error al obtener herramienta:', error)
      return {
        success: false,
        message: 'Error de conexión'
      }
    }
  },

  /**
   * Buscar herramientas
   * @param {string} query - Término de búsqueda
   * @param {Object} filters - Filtros adicionales
   * @returns {Promise<Object>} Resultados de búsqueda
   */
  searchTools: async (query, filters = {}) => {
    try {
      if (!query || query.trim().length < SEARCH.MIN_QUERY_LENGTH) {
        return {
          success: false,
          message: `La búsqueda debe tener al menos ${SEARCH.MIN_QUERY_LENGTH} caracteres`
        }
      }

      const searchParams = {
        q: query.trim(),
        limit: Math.min(filters.limit || SEARCH.MAX_RESULTS, SEARCH.MAX_RESULTS),
        ...filters
      }

      const response = await toolsAPI.search(query, searchParams)
      
      if (response.success) {
        return {
          success: true,
          data: response.data.tools || response.data,
          total: response.data.total || 0,
          message: 'Búsqueda completada'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Error en la búsqueda'
      }
    } catch (error) {
      console.error('Error en búsqueda:', error)
      return {
        success: false,
        message: 'Error de conexión'
      }
    }
  },

  /**
   * Obtener herramientas populares
   * @param {number} limit - Límite de resultados
   * @returns {Promise<Object>} Herramientas populares
   */
  getPopularTools: async (limit = 10) => {
    try {
      const response = await toolsAPI.getPopular()
      
      if (response.success) {
        let tools = response.data.tools || response.data
        
        // Limitar resultados si es necesario
        if (limit && tools.length > limit) {
          tools = tools.slice(0, limit)
        }
        
        return {
          success: true,
          data: tools,
          message: 'Herramientas populares obtenidas'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Error al obtener herramientas populares'
      }
    } catch (error) {
      console.error('Error al obtener herramientas populares:', error)
      return {
        success: false,
        message: 'Error de conexión'
      }
    }
  },

  /**
   * Obtener herramientas recientes
   * @param {number} limit - Límite de resultados
   * @returns {Promise<Object>} Herramientas recientes
   */
  getRecentTools: async (limit = 10) => {
    try {
      const response = await toolsAPI.getRecent()
      
      if (response.success) {
        let tools = response.data.tools || response.data
        
        // Limitar resultados si es necesario
        if (limit && tools.length > limit) {
          tools = tools.slice(0, limit)
        }
        
        return {
          success: true,
          data: tools,
          message: 'Herramientas recientes obtenidas'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Error al obtener herramientas recientes'
      }
    } catch (error) {
      console.error('Error al obtener herramientas recientes:', error)
      return {
        success: false,
        message: 'Error de conexión'
      }
    }
  },

  /**
   * Obtener todas las categorías
   * @returns {Promise<Object>} Lista de categorías
   */
  getCategories: async () => {
    try {
      const response = await categoriesAPI.getAll()
      
      if (response.success) {
        return {
          success: true,
          data: response.data.categories || response.data,
          message: 'Categorías obtenidas correctamente'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Error al obtener categorías'
      }
    } catch (error) {
      console.error('Error al obtener categorías:', error)
      return {
        success: false,
        message: 'Error de conexión'
      }
    }
  },

  /**
   * Obtener categoría por ID
   * @param {string} id - ID de la categoría
   * @returns {Promise<Object>} Datos de la categoría
   */
  getCategoryById: async (id) => {
    try {
      if (!id) {
        return {
          success: false,
          message: 'ID de categoría requerido'
        }
      }

      const response = await categoriesAPI.getById(id)
      
      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: 'Categoría obtenida correctamente'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Categoría no encontrada'
      }
    } catch (error) {
      console.error('Error al obtener categoría:', error)
      return {
        success: false,
        message: 'Error de conexión'
      }
    }
  },

  /**
   * Obtener herramientas de una categoría
   * @param {string} categoryId - ID de la categoría
   * @param {Object} params - Parámetros adicionales
   * @returns {Promise<Object>} Herramientas de la categoría
   */
  getToolsByCategory: async (categoryId, params = {}) => {
    try {
      if (!categoryId) {
        return {
          success: false,
          message: 'ID de categoría requerido'
        }
      }

      const response = await categoriesAPI.getTools(categoryId, params)
      
      if (response.success) {
        return {
          success: true,
          data: response.data.tools || response.data,
          category: response.data.category || null,
          message: 'Herramientas de categoría obtenidas'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Error al obtener herramientas de la categoría'
      }
    } catch (error) {
      console.error('Error al obtener herramientas de categoría:', error)
      return {
        success: false,
        message: 'Error de conexión'
      }
    }
  },

  /**
   * Crear nueva herramienta (solo para administradores)
   * @param {Object} toolData - Datos de la herramienta
   * @returns {Promise<Object>} Resultado de la operación
   */
  createTool: async (toolData) => {
    try {
      // Validaciones básicas
      if (!toolData.name || !toolData.url || !toolData.category) {
        return {
          success: false,
          message: 'Nombre, URL y categoría son requeridos'
        }
      }

      if (!toolData.description || !toolData.utility) {
        return {
          success: false,
          message: 'Descripción y utilidad son requeridas'
        }
      }

      const response = await toolsAPI.create(toolData)
      
      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: 'Herramienta creada correctamente'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Error al crear herramienta'
      }
    } catch (error) {
      console.error('Error al crear herramienta:', error)
      return {
        success: false,
        message: 'Error de conexión'
      }
    }
  },

  /**
   * Actualizar herramienta (solo para administradores)
   * @param {string} id - ID de la herramienta
   * @param {Object} toolData - Datos actualizados
   * @returns {Promise<Object>} Resultado de la operación
   */
  updateTool: async (id, toolData) => {
    try {
      if (!id) {
        return {
          success: false,
          message: 'ID de herramienta requerido'
        }
      }

      const response = await toolsAPI.update(id, toolData)
      
      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: 'Herramienta actualizada correctamente'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Error al actualizar herramienta'
      }
    } catch (error) {
      console.error('Error al actualizar herramienta:', error)
      return {
        success: false,
        message: 'Error de conexión'
      }
    }
  },

  /**
   * Eliminar herramienta (solo para administradores)
   * @param {string} id - ID de la herramienta
   * @returns {Promise<Object>} Resultado de la operación
   */
  deleteTool: async (id) => {
    try {
      if (!id) {
        return {
          success: false,
          message: 'ID de herramienta requerido'
        }
      }

      const response = await toolsAPI.delete(id)
      
      if (response.success) {
        return {
          success: true,
          message: 'Herramienta eliminada correctamente'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Error al eliminar herramienta'
      }
    } catch (error) {
      console.error('Error al eliminar herramienta:', error)
      return {
        success: false,
        message: 'Error de conexión'
      }
    }
  },

  /**
   * Obtener favoritos del usuario
   * @returns {Promise<Object>} Lista de favoritos
   */
  getFavorites: async () => {
    try {
      const response = await favoritesAPI.getAll()
      
      if (response.success) {
        return {
          success: true,
          data: response.data.favorites || response.data,
          message: 'Favoritos obtenidos correctamente'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Error al obtener favoritos'
      }
    } catch (error) {
      console.error('Error al obtener favoritos:', error)
      return {
        success: false,
        message: 'Error de conexión'
      }
    }
  },

  /**
   * Agregar herramienta a favoritos
   * @param {string} toolId - ID de la herramienta
   * @returns {Promise<Object>} Resultado de la operación
   */
  addToFavorites: async (toolId) => {
    try {
      if (!toolId) {
        return {
          success: false,
          message: 'ID de herramienta requerido'
        }
      }

      const response = await favoritesAPI.add(toolId)
      
      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: 'Herramienta agregada a favoritos'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Error al agregar a favoritos'
      }
    } catch (error) {
      console.error('Error al agregar a favoritos:', error)
      return {
        success: false,
        message: 'Error de conexión'
      }
    }
  },

  /**
   * Remover herramienta de favoritos
   * @param {string} toolId - ID de la herramienta
   * @returns {Promise<Object>} Resultado de la operación
   */
  removeFromFavorites: async (toolId) => {
    try {
      if (!toolId) {
        return {
          success: false,
          message: 'ID de herramienta requerido'
        }
      }

      const response = await favoritesAPI.remove(toolId)
      
      if (response.success) {
        return {
          success: true,
          message: 'Herramienta removida de favoritos'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Error al remover de favoritos'
      }
    } catch (error) {
      console.error('Error al remover de favoritos:', error)
      return {
        success: false,
        message: 'Error de conexión'
      }
    }
  },

  /**
   * Verificar si una herramienta está en favoritos
   * @param {string} toolId - ID de la herramienta
   * @returns {Promise<Object>} Estado de favorito
   */
  checkFavorite: async (toolId) => {
    try {
      if (!toolId) {
        return {
          success: false,
          message: 'ID de herramienta requerido'
        }
      }

      const response = await favoritesAPI.check(toolId)
      
      if (response.success) {
        return {
          success: true,
          data: { isFavorite: response.data.isFavorite },
          message: 'Estado de favorito verificado'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Error al verificar favorito'
      }
    } catch (error) {
      console.error('Error al verificar favorito:', error)
      return {
        success: false,
        message: 'Error de conexión'
      }
    }
  },

  /**
   * Obtener ratings de una herramienta
   * @param {string} toolId - ID de la herramienta
   * @returns {Promise<Object>} Ratings de la herramienta
   */
  getToolRatings: async (toolId) => {
    try {
      if (!toolId) {
        return {
          success: false,
          message: 'ID de herramienta requerido'
        }
      }

      const response = await ratingsAPI.getByTool(toolId)
      
      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: 'Ratings obtenidos correctamente'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Error al obtener ratings'
      }
    } catch (error) {
      console.error('Error al obtener ratings:', error)
      return {
        success: false,
        message: 'Error de conexión'
      }
    }
  },

  /**
   * Crear rating para una herramienta
   * @param {Object} ratingData - Datos del rating
   * @returns {Promise<Object>} Resultado de la operación
   */
  createRating: async (ratingData) => {
    try {
      const { toolId, rating, comment } = ratingData

      if (!toolId || !rating) {
        return {
          success: false,
          message: 'ID de herramienta y rating son requeridos'
        }
      }

      if (rating < 1 || rating > 5) {
        return {
          success: false,
          message: 'El rating debe estar entre 1 y 5'
        }
      }

      const response = await ratingsAPI.create({
        toolId,
        rating,
        comment: comment?.trim() || null
      })
      
      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: 'Rating creado correctamente'
        }
      }
      
      return {
        success: false,
        message: response.error || 'Error al crear rating'
      }
    } catch (error) {
      console.error('Error al crear rating:', error)
      return {
        success: false,
        message: 'Error de conexión'
      }
    }
  },

  /**
   * Filtrar herramientas localmente (para uso offline)
   * @param {Array} tools - Array de herramientas
   * @param {Object} filters - Filtros a aplicar
   * @returns {Array} Herramientas filtradas
   */
  filterToolsLocally: (tools, filters) => {
    if (!tools || !Array.isArray(tools)) return []

    let filtered = [...tools]

    // Filtro por texto
    if (filters.query) {
      filtered = filterToolsByQuery(filtered, filters.query)
    }

    // Filtro por categoría
    if (filters.category) {
      filtered = filtered.filter(tool => tool.category === filters.category)
    }

    // Filtro por región
    if (filters.region) {
      filtered = filtered.filter(tool => tool.region === filters.region)
    }

    // Filtro por tipo
    if (filters.type) {
      filtered = filtered.filter(tool => tool.type === filters.type)
    }

    // Filtro por gratuito
    if (filters.isFree !== undefined) {
      filtered = filtered.filter(tool => tool.is_free === filters.isFree)
    }

    // Ordenar
    if (filters.sortBy) {
      filtered = sortTools(filtered, filters.sortBy, filters.sortOrder || 'asc')
    }

    return filtered
  },

  /**
   * Guardar herramientas en cache local
   * @param {Array} tools - Herramientas a guardar
   * @param {Array} categories - Categorías a guardar
   */
  saveToCache: (tools, categories) => {
    try {
      const cacheData = {
        tools,
        categories,
        timestamp: Date.now()
      }
      storage.set('tools_cache', cacheData)
    } catch (error) {
      console.error('Error al guardar en cache:', error)
    }
  },

  /**
   * Cargar herramientas desde cache local
   * @returns {Object|null} Datos del cache o null
   */
  loadFromCache: () => {
    try {
      const cacheData = storage.get('tools_cache')
      
      if (cacheData && cacheData.timestamp) {
        // Verificar si el cache no es muy antiguo (24 horas)
        const maxAge = 24 * 60 * 60 * 1000 // 24 horas en ms
        const isExpired = Date.now() - cacheData.timestamp > maxAge
        
        if (!isExpired) {
          return cacheData
        }
      }
      
      return null
    } catch (error) {
      console.error('Error al cargar desde cache:', error)
      return null
    }
  },

  /**
   * Limpiar cache local
   */
  clearCache: () => {
    try {
      storage.remove('tools_cache')
    } catch (error) {
      console.error('Error al limpiar cache:', error)
    }
  }
}

export default toolsService
