import { useState, useEffect, useCallback, useMemo } from 'react'
import { toolsService } from '@services/toolsService'
import { filterToolsByQuery, groupToolsByCategory, sortTools, storage } from '@utils/helpers'
import { STORAGE_KEYS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@utils/constants'
import categoriesData from '@data/categories.json'
import toast from 'react-hot-toast'

// Importar todos los archivos de herramientas directamente
import buscadoresGenerales from '@data/tools/buscadores-generales.json'
import redesSociales from '@data/tools/redes-sociales.json'
import email from '@data/tools/email.json'
import dominiosIps from '@data/tools/dominios-ips.json'
import geolocalizacion from '@data/tools/geolocalizacion.json'
import imagenesVideos from '@data/tools/imagenes-videos.json'
import documentosMetadatos from '@data/tools/documentos-metadatos.json'
import darkwebAmenazas from '@data/tools/darkweb-amenazas.json'
import argentinaLatam from '@data/tools/argentina-latam.json'
import telefonos from '@data/tools/telefonos.json'
import archivos from '@data/tools/archivos.json'
import criptomonedas from '@data/tools/criptomonedas.json'
import utilidadesVarios from '@data/tools/utilidades-varios.json'
import analisisVisualizacion from '@data/tools/analisis-visualizacion.json'
import sistemaInfraestructura from '@data/tools/sistema-infraestructura.json'

// Hook principal para manejar herramientas
export const useTools = () => {
  const [tools, setTools] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Cargar herramientas y categorías
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Usar datos locales directamente
      console.log('Cargando herramientas desde archivos locales...')

      // Combinar todas las herramientas de los archivos JSON
      const allTools = [
        ...buscadoresGenerales.tools,
        ...redesSociales.tools,
        ...email.tools,
        ...dominiosIps.tools,
        ...geolocalizacion.tools,
        ...imagenesVideos.tools,
        ...documentosMetadatos.tools,
        ...darkwebAmenazas.tools,
        ...argentinaLatam.tools,
        ...telefonos.tools,
        ...archivos.tools,
        ...criptomonedas.tools,
        ...utilidadesVarios.tools,
        ...analisisVisualizacion.tools,
        ...sistemaInfraestructura.tools
      ]

      console.log('Herramientas cargadas:', allTools.length)

      // Usar categorías locales
      const localCategories = categoriesData.categories
      console.log('Categorías cargadas:', localCategories.length)

      setTools(allTools)
      setCategories(localCategories)
      setLastUpdated(new Date())

      // Guardar en cache local
      storage.set('tools_cache', {
        tools: allTools,
        categories: localCategories,
        timestamp: Date.now()
      })

      console.log('Datos cargados exitosamente:', {
        tools: allTools.length,
        categories: localCategories.length
      })

    } catch (err) {
      console.error('Error al cargar herramientas desde archivos locales:', err)
      setError(err.message || ERROR_MESSAGES.GENERIC_ERROR)

      // Intentar cargar desde cache si hay error
      const cache = storage.get('tools_cache')
      if (cache && cache.tools && cache.categories) {
        setTools(cache.tools)
        setCategories(cache.categories)
        toast.error('Usando datos en cache. Verifica tu conexión.')
      } else {
        // Si no hay cache, usar categorías locales al menos
        setCategories(categoriesData.categories)
        toast.error('Error al cargar herramientas. Usando datos mínimos.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Cargar datos al montar el componente
  useEffect(() => {
    loadData()
  }, [loadData])

  // Recargar datos
  const refresh = useCallback(() => {
    loadData()
  }, [loadData])

  return {
    tools,
    categories,
    isLoading,
    error,
    lastUpdated,
    refresh
  }
}

// Hook para filtrar y buscar herramientas
export const useToolsFilter = (tools, initialFilters = {}) => {
  const [filters, setFilters] = useState({
    query: '',
    category: null,
    subcategory: null,
    region: null,
    type: null,
    difficulty: null,
    requiresRegistration: null,
    isFree: null,
    ...initialFilters
  })

  const [sortConfig, setSortConfig] = useState({
    field: 'name',
    order: 'asc'
  })

  // Filtrar herramientas
  const filteredTools = useMemo(() => {
    if (!tools || tools.length === 0) return []

    let filtered = [...tools]

    // Filtro por texto de búsqueda
    if (filters.query) {
      filtered = filterToolsByQuery(filtered, filters.query)
    }

    // Filtro por categoría
    if (filters.category) {
      filtered = filtered.filter(tool => tool.category === filters.category)
    }

    // Filtro por subcategoría
    if (filters.subcategory) {
      filtered = filtered.filter(tool => tool.subcategory === filters.subcategory)
    }

    // Filtro por región
    if (filters.region) {
      filtered = filtered.filter(tool => tool.region === filters.region)
    }

    // Filtro por tipo
    if (filters.type) {
      filtered = filtered.filter(tool => tool.type === filters.type)
    }

    // Filtro por dificultad
    if (filters.difficulty) {
      filtered = filtered.filter(tool => tool.difficulty_level === filters.difficulty)
    }

    // Filtro por registro requerido
    if (filters.requiresRegistration !== null) {
      filtered = filtered.filter(tool => tool.requires_registration === filters.requiresRegistration)
    }

    // Filtro por gratuito
    if (filters.isFree !== null) {
      filtered = filtered.filter(tool => tool.is_free === filters.isFree)
    }

    // Ordenar resultados
    return sortTools(filtered, sortConfig.field, sortConfig.order)
  }, [tools, filters, sortConfig])

  // Actualizar filtros
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }, [])

  // Limpiar filtros
  const clearFilters = useCallback(() => {
    setFilters({
      query: '',
      category: null,
      subcategory: null,
      region: null,
      type: null,
      difficulty: null,
      requiresRegistration: null,
      isFree: null
    })
  }, [])

  // Actualizar ordenamiento
  const updateSort = useCallback((field, order = 'asc') => {
    setSortConfig({ field, order })
  }, [])

  return {
    filteredTools,
    filters,
    sortConfig,
    updateFilter,
    clearFilters,
    updateSort,
    totalResults: filteredTools.length
  }
}

// Hook para manejar favoritos
export const useFavorites = () => {
  const [favorites, setFavorites] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // Cargar favoritos al inicializar
  useEffect(() => {
    const loadFavorites = () => {
      const savedFavorites = storage.get(STORAGE_KEYS.FAVORITES, [])
      setFavorites(savedFavorites)
    }
    loadFavorites()
  }, [])

  // Agregar a favoritos
  const addFavorite = useCallback(async (toolId) => {
    try {
      setIsLoading(true)
      
      if (!favorites.includes(toolId)) {
        const newFavorites = [...favorites, toolId]
        setFavorites(newFavorites)
        storage.set(STORAGE_KEYS.FAVORITES, newFavorites)
        
        toast.success(SUCCESS_MESSAGES.TOOL_FAVORITED)
        return true
      }
      return false
    } catch (error) {
      console.error('Error al agregar favorito:', error)
      toast.error('Error al agregar a favoritos')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [favorites])

  // Remover de favoritos
  const removeFavorite = useCallback(async (toolId) => {
    try {
      setIsLoading(true)
      
      const newFavorites = favorites.filter(id => id !== toolId)
      setFavorites(newFavorites)
      storage.set(STORAGE_KEYS.FAVORITES, newFavorites)
      
      toast.success(SUCCESS_MESSAGES.TOOL_UNFAVORITED)
      return true
    } catch (error) {
      console.error('Error al remover favorito:', error)
      toast.error('Error al remover de favoritos')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [favorites])

  // Toggle favorito
  const toggleFavorite = useCallback(async (toolId) => {
    if (favorites.includes(toolId)) {
      return await removeFavorite(toolId)
    } else {
      return await addFavorite(toolId)
    }
  }, [favorites, addFavorite, removeFavorite])

  // Verificar si es favorito
  const isFavorite = useCallback((toolId) => {
    return favorites.includes(toolId)
  }, [favorites])

  // Obtener herramientas favoritas
  const getFavoriteTools = useCallback((allTools) => {
    return allTools.filter(tool => favorites.includes(tool.id))
  }, [favorites])

  return {
    favorites,
    isLoading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    getFavoriteTools,
    totalFavorites: favorites.length
  }
}

// Hook para manejar notas de herramientas
export const useToolNotes = () => {
  const [notes, setNotes] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  // Cargar notas al inicializar
  useEffect(() => {
    const loadNotes = () => {
      const savedNotes = storage.get(STORAGE_KEYS.NOTES, {})
      setNotes(savedNotes)
    }
    loadNotes()
  }, [])

  // Guardar nota
  const saveNote = useCallback(async (toolId, noteText) => {
    try {
      setIsLoading(true)
      
      const newNotes = {
        ...notes,
        [toolId]: {
          text: noteText,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
      
      setNotes(newNotes)
      storage.set(STORAGE_KEYS.NOTES, newNotes)
      
      toast.success(SUCCESS_MESSAGES.NOTE_SAVED)
      return true
    } catch (error) {
      console.error('Error al guardar nota:', error)
      toast.error('Error al guardar la nota')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [notes])

  // Eliminar nota
  const deleteNote = useCallback(async (toolId) => {
    try {
      setIsLoading(true)
      
      const newNotes = { ...notes }
      delete newNotes[toolId]
      
      setNotes(newNotes)
      storage.set(STORAGE_KEYS.NOTES, newNotes)
      
      toast.success(SUCCESS_MESSAGES.NOTE_DELETED)
      return true
    } catch (error) {
      console.error('Error al eliminar nota:', error)
      toast.error('Error al eliminar la nota')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [notes])

  // Obtener nota
  const getNote = useCallback((toolId) => {
    return notes[toolId] || null
  }, [notes])

  // Verificar si tiene nota
  const hasNote = useCallback((toolId) => {
    return !!notes[toolId]
  }, [notes])

  return {
    notes,
    isLoading,
    saveNote,
    deleteNote,
    getNote,
    hasNote,
    totalNotes: Object.keys(notes).length
  }
}

// Hook para manejar historial de herramientas visitadas
export const useToolHistory = () => {
  const [history, setHistory] = useState([])

  // Cargar historial al inicializar
  useEffect(() => {
    const loadHistory = () => {
      const savedHistory = storage.get('tool_history', [])
      setHistory(savedHistory)
    }
    loadHistory()
  }, [])

  // Agregar herramienta al historial
  const addToHistory = useCallback((tool) => {
    const newHistory = [
      {
        ...tool,
        visitedAt: new Date().toISOString()
      },
      ...history.filter(item => item.id !== tool.id)
    ].slice(0, 50) // Mantener solo los últimos 50

    setHistory(newHistory)
    storage.set('tool_history', newHistory)
  }, [history])

  // Limpiar historial
  const clearHistory = useCallback(() => {
    setHistory([])
    storage.set('tool_history', [])
  }, [])

  return {
    history,
    addToHistory,
    clearHistory,
    totalHistory: history.length
  }
}

// Hook para estadísticas de herramientas
export const useToolStats = (tools) => {
  const stats = useMemo(() => {
    if (!tools || tools.length === 0) {
      return {
        total: 0,
        byCategory: {},
        byRegion: {},
        byType: {},
        byDifficulty: {},
        freeTools: 0,
        paidTools: 0,
        requiresRegistration: 0
      }
    }

    const byCategory = groupToolsByCategory(tools)
    const byRegion = {}
    const byType = {}
    const byDifficulty = {}
    let freeTools = 0
    let paidTools = 0
    let requiresRegistration = 0

    tools.forEach(tool => {
      // Por región
      const region = tool.region || 'otros'
      byRegion[region] = (byRegion[region] || 0) + 1

      // Por tipo
      const type = tool.type || 'otros'
      byType[type] = (byType[type] || 0) + 1

      // Por dificultad
      const difficulty = tool.difficulty_level || 'otros'
      byDifficulty[difficulty] = (byDifficulty[difficulty] || 0) + 1

      // Contadores
      if (tool.is_free) freeTools++
      else paidTools++

      if (tool.requires_registration) requiresRegistration++
    })

    return {
      total: tools.length,
      byCategory,
      byRegion,
      byType,
      byDifficulty,
      freeTools,
      paidTools,
      requiresRegistration
    }
  }, [tools])

  return stats
}

export default useTools
