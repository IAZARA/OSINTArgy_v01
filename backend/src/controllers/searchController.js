import Tool from '../models/Tool.js'

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const toPositiveInt = (value, fallback, max) => {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.min(parsed, max)
}

// @desc    Búsqueda avanzada de herramientas
// @route   GET /api/search/tools
// @access  Public
export const searchTools = async (req, res) => {
  try {
    const {
      q = '',
      category,
      subcategory,
      region,
      type,
      difficulty,
      isFree,
      requiresRegistration,
      minRating,
      tags,
      sortBy = 'relevance',
      page = 1,
      limit = 20
    } = req.query

    const safePage = toPositiveInt(page, 1, 1000)
    const safeLimit = toPositiveInt(limit, 20, 100)
    const searchTerm = typeof q === 'string' ? q.trim().slice(0, 100) : ''
    const safeSearchTerm = escapeRegex(searchTerm)

    // Construir query de búsqueda
    let searchQuery = {}

    // Búsqueda por texto
    if (searchTerm) {
      searchQuery.$or = [
        { name: { $regex: safeSearchTerm, $options: 'i' } },
        { description: { $regex: safeSearchTerm, $options: 'i' } },
        { utility: { $regex: safeSearchTerm, $options: 'i' } },
        { tags: { $in: [new RegExp(safeSearchTerm, 'i')] } }
      ]
    }

    // Filtros específicos
    if (category) {
      searchQuery.category = category
    }

    if (subcategory) {
      searchQuery.subcategory = subcategory
    }

    if (region) {
      searchQuery.region = region
    }

    if (type) {
      searchQuery.type = type
    }

    if (difficulty) {
      searchQuery.difficulty_level = difficulty
    }

    if (isFree !== undefined) {
      searchQuery.is_free = isFree === 'true'
    }

    if (requiresRegistration !== undefined) {
      searchQuery.requires_registration = requiresRegistration === 'true'
    }

    if (minRating) {
      searchQuery.rating = { $gte: parseFloat(minRating) }
    }

    if (tags) {
      const tagArray = String(tags)
        .slice(0, 300)
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean)
      searchQuery.tags = { $in: tagArray.map(tag => new RegExp(escapeRegex(tag), 'i')) }
    }

    // Solo herramientas activas
    searchQuery.status = 'active'

    // Configurar ordenamiento
    let sortOptions = {}
    switch (sortBy) {
      case 'name':
        sortOptions = { name: 1 }
        break
      case 'rating':
        sortOptions = { rating: -1, usage_count: -1 }
        break
      case 'popularity':
        sortOptions = { usage_count: -1, rating: -1 }
        break
      case 'recent':
        sortOptions = { last_updated: -1 }
        break
      case 'relevance':
      default:
        // Para relevancia, usar score de texto si hay búsqueda, sino por rating
        if (searchTerm) {
          searchQuery.$text = { $search: searchTerm }
          sortOptions = { score: { $meta: 'textScore' }, rating: -1 }
        } else {
          sortOptions = { rating: -1, usage_count: -1 }
        }
        break
    }

    // Ejecutar búsqueda
    const tools = await Tool.find(searchQuery)
      .sort(sortOptions)
      .limit(safeLimit)
      .skip((safePage - 1) * safeLimit)
      .lean()

    // Contar total de resultados
    const total = await Tool.countDocuments(searchQuery)

    // Obtener estadísticas de la búsqueda
    const stats = await Tool.aggregate([
      { $match: searchQuery },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          categories: { $addToSet: '$category' },
          regions: { $addToSet: '$region' },
          types: { $addToSet: '$type' },
          freeTools: {
            $sum: { $cond: [{ $eq: ['$is_free', true] }, 1, 0] }
          },
          paidTools: {
            $sum: { $cond: [{ $eq: ['$is_free', false] }, 1, 0] }
          }
        }
      }
    ])

    res.json({
      success: true,
      data: tools,
      stats: stats[0] || null,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit)
      },
      filters: {
        q: searchTerm,
        category,
        subcategory,
        region,
        type,
        difficulty,
        isFree,
        requiresRegistration,
        minRating,
        tags,
        sortBy
      }
    })
  } catch (error) {
    console.error('Error en búsqueda avanzada:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

// @desc    Obtener sugerencias de búsqueda
// @route   GET /api/search/suggestions
// @access  Public
export const getSearchSuggestions = async (req, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : ''

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: []
      })
    }

    const safeQ = escapeRegex(q)

    // Buscar herramientas que coincidan
    const toolSuggestions = await Tool.find({
      $or: [
        { name: { $regex: safeQ, $options: 'i' } },
        { tags: { $in: [new RegExp(safeQ, 'i')] } }
      ],
      status: 'active'
    })
      .select('name category tags')
      .limit(10)
      .lean()

    // Buscar categorías que coincidan
    const categorySuggestions = await Tool.distinct('category', {
      category: { $regex: safeQ, $options: 'i' },
      status: 'active'
    })

    // Buscar tags que coincidan
    const tagSuggestions = await Tool.aggregate([
      { $match: { status: 'active' } },
      { $unwind: '$tags' },
      { $match: { tags: { $regex: safeQ, $options: 'i' } } },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ])

    const suggestions = {
      tools: toolSuggestions.map(tool => ({
        type: 'tool',
        value: tool.name,
        category: tool.category,
        id: tool.id
      })),
      categories: categorySuggestions.map(cat => ({
        type: 'category',
        value: cat
      })),
      tags: tagSuggestions.map(tag => ({
        type: 'tag',
        value: tag._id,
        count: tag.count
      }))
    }

    res.json({
      success: true,
      data: suggestions
    })
  } catch (error) {
    console.error('Error obteniendo sugerencias:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

// @desc    Obtener filtros disponibles
// @route   GET /api/search/filters
// @access  Public
export const getAvailableFilters = async (req, res) => {
  try {
    const filters = await Tool.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: null,
          categories: { $addToSet: '$category' },
          subcategories: { $addToSet: '$subcategory' },
          regions: { $addToSet: '$region' },
          types: { $addToSet: '$type' },
          difficulties: { $addToSet: '$difficulty_level' },
          tags: { $push: '$tags' }
        }
      },
      {
        $project: {
          categories: 1,
          subcategories: 1,
          regions: 1,
          types: 1,
          difficulties: 1,
          tags: {
            $reduce: {
              input: '$tags',
              initialValue: [],
              in: { $setUnion: ['$$value', '$$this'] }
            }
          }
        }
      }
    ])

    const result = filters[0] || {
      categories: [],
      subcategories: [],
      regions: [],
      types: [],
      difficulties: [],
      tags: []
    }

    // Obtener conteos de tags más populares
    const popularTags = await Tool.aggregate([
      { $match: { status: 'active' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ])

    result.popularTags = popularTags.map(tag => ({
      name: tag._id,
      count: tag.count
    }))

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error obteniendo filtros:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

// @desc    Guardar búsqueda en historial (usuario autenticado)
// @route   POST /api/search/history
// @access  Private
export const saveSearchHistory = async (req, res) => {
  try {
    const { query, filters, resultsCount } = req.body

    if (!query.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Query de búsqueda es requerido'
      })
    }

    // Agregar al historial de búsqueda del usuario
    const searchEntry = {
      query,
      filters: filters || {},
      resultsCount: resultsCount || 0,
      searchedAt: new Date()
    }

    // Si el usuario no tiene historial de búsqueda, crearlo
    if (!req.user.searchHistory) {
      req.user.searchHistory = []
    }

    // Agregar al inicio del array
    req.user.searchHistory.unshift(searchEntry)

    // Mantener solo las últimas 50 búsquedas
    if (req.user.searchHistory.length > 50) {
      req.user.searchHistory = req.user.searchHistory.slice(0, 50)
    }

    await req.user.save()

    res.json({
      success: true,
      message: 'Búsqueda guardada en historial'
    })
  } catch (error) {
    console.error('Error guardando historial de búsqueda:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

// @desc    Obtener historial de búsquedas del usuario
// @route   GET /api/search/history
// @access  Private
export const getSearchHistory = async (req, res) => {
  try {
    const limit = toPositiveInt(req.query.limit, 20, 100)

    const searchHistory = req.user.searchHistory || []
    const limitedHistory = searchHistory.slice(0, limit)

    res.json({
      success: true,
      data: limitedHistory
    })
  } catch (error) {
    console.error('Error obteniendo historial de búsqueda:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

// @desc    Limpiar historial de búsquedas
// @route   DELETE /api/search/history
// @access  Private
export const clearSearchHistory = async (req, res) => {
  try {
    req.user.searchHistory = []
    await req.user.save()

    res.json({
      success: true,
      message: 'Historial de búsqueda limpiado'
    })
  } catch (error) {
    console.error('Error limpiando historial de búsqueda:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}
