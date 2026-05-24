import express from 'express'
import User from '../models/User.js'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const toPositiveInt = (value, fallback, max) => {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.min(parsed, max)
}

// @desc    Obtener todos los usuarios (Admin)
// @route   GET /api/users
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const page = toPositiveInt(req.query.page, 1, 1000)
    const limit = toPositiveInt(req.query.limit, 20, 100)
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : ''
    
    let query = {}
    if (search) {
      const safeSearch = escapeRegex(search)
      query = {
        $or: [
          { username: { $regex: safeSearch, $options: 'i' } },
          { email: { $regex: safeSearch, $options: 'i' } },
          { 'profile.firstName': { $regex: safeSearch, $options: 'i' } },
          { 'profile.lastName': { $regex: safeSearch, $options: 'i' } }
        ]
      }
    }

    const users = await User.find(query)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)

    const total = await User.countDocuments(query)

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error obteniendo usuarios:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// @desc    Agregar herramienta a favoritos
// @route   POST /api/users/favorites/:toolId
// @access  Private
router.post('/favorites/:toolId', protect, async (req, res) => {
  try {
    const { toolId } = req.params
    const { notes = '' } = req.body

    await req.user.addToFavorites(toolId, notes)

    res.json({
      success: true,
      message: 'Herramienta agregada a favoritos'
    })
  } catch (error) {
    console.error('Error agregando a favoritos:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// @desc    Remover herramienta de favoritos
// @route   DELETE /api/users/favorites/:toolId
// @access  Private
router.delete('/favorites/:toolId', protect, async (req, res) => {
  try {
    const { toolId } = req.params

    await req.user.removeFromFavorites(toolId)

    res.json({
      success: true,
      message: 'Herramienta removida de favoritos'
    })
  } catch (error) {
    console.error('Error removiendo de favoritos:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// @desc    Obtener favoritos del usuario
// @route   GET /api/users/favorites
// @access  Private
router.get('/favorites', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    res.json({
      success: true,
      data: user.favorites
    })
  } catch (error) {
    console.error('Error obteniendo favoritos:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// @desc    Obtener historial del usuario
// @route   GET /api/users/history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const { limit = 50 } = req.query
    
    const user = await User.findById(req.user._id)
    const history = user.history.slice(0, parseInt(limit))

    res.json({
      success: true,
      data: history
    })
  } catch (error) {
    console.error('Error obteniendo historial:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// @desc    Agregar nota personal
// @route   POST /api/users/notes
// @access  Private
router.post('/notes', protect, async (req, res) => {
  try {
    const { title, content, tags = [], relatedTools = [], isPrivate = true } = req.body

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Título y contenido son requeridos'
      })
    }

    const note = {
      id: Date.now().toString(),
      title,
      content,
      tags,
      relatedTools,
      isPrivate,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    req.user.notes.unshift(note)
    await req.user.save()

    res.status(201).json({
      success: true,
      data: note,
      message: 'Nota creada exitosamente'
    })
  } catch (error) {
    console.error('Error creando nota:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// @desc    Actualizar nota personal
// @route   PUT /api/users/notes/:noteId
// @access  Private
router.put('/notes/:noteId', protect, async (req, res) => {
  try {
    const { noteId } = req.params
    const { title, content, tags, relatedTools, isPrivate } = req.body

    const noteIndex = req.user.notes.findIndex(note => note.id === noteId)
    
    if (noteIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Nota no encontrada'
      })
    }

    const note = req.user.notes[noteIndex]
    
    if (title !== undefined) note.title = title
    if (content !== undefined) note.content = content
    if (tags !== undefined) note.tags = tags
    if (relatedTools !== undefined) note.relatedTools = relatedTools
    if (isPrivate !== undefined) note.isPrivate = isPrivate
    note.updatedAt = new Date()

    await req.user.save()

    res.json({
      success: true,
      data: note,
      message: 'Nota actualizada exitosamente'
    })
  } catch (error) {
    console.error('Error actualizando nota:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// @desc    Eliminar nota personal
// @route   DELETE /api/users/notes/:noteId
// @access  Private
router.delete('/notes/:noteId', protect, async (req, res) => {
  try {
    const { noteId } = req.params

    req.user.notes = req.user.notes.filter(note => note.id !== noteId)
    await req.user.save()

    res.json({
      success: true,
      message: 'Nota eliminada exitosamente'
    })
  } catch (error) {
    console.error('Error eliminando nota:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// @desc    Obtener notas del usuario
// @route   GET /api/users/notes
// @access  Private
router.get('/notes', protect, async (req, res) => {
  try {
    const page = toPositiveInt(req.query.page, 1, 1000)
    const limit = toPositiveInt(req.query.limit, 20, 100)
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : ''
    const tags = typeof req.query.tags === 'string' ? req.query.tags.slice(0, 300) : ''
    
    let notes = req.user.notes || []
    
    // Filtrar por búsqueda
    if (search) {
      const searchLower = search.toLowerCase()
      notes = notes.filter(note =>
        note.title.toLowerCase().includes(searchLower) ||
        note.content.toLowerCase().includes(searchLower)
      )
    }
    
    // Filtrar por tags
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase())
      notes = notes.filter(note =>
        note.tags.some(tag => tagArray.includes(tag.toLowerCase()))
      )
    }
    
    // Ordenar por fecha de actualización
    notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    
    // Paginación
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedNotes = notes.slice(startIndex, endIndex)
    
    res.json({
      success: true,
      data: paginatedNotes,
      pagination: {
        page,
        limit,
        total: notes.length,
        pages: Math.ceil(notes.length / limit)
      }
    })
  } catch (error) {
    console.error('Error obteniendo notas:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// @desc    Obtener nota específica
// @route   GET /api/users/notes/:noteId
// @access  Private
router.get('/notes/:noteId', protect, async (req, res) => {
  try {
    const { noteId } = req.params
    
    const note = req.user.notes.find(note => note.id === noteId)
    
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Nota no encontrada'
      })
    }
    
    res.json({
      success: true,
      data: note
    })
  } catch (error) {
    console.error('Error obteniendo nota:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// @desc    Limpiar historial
// @route   DELETE /api/users/history
// @access  Private
router.delete('/history', protect, async (req, res) => {
  try {
    req.user.history = []
    await req.user.save()

    res.json({
      success: true,
      message: 'Historial limpiado exitosamente'
    })
  } catch (error) {
    console.error('Error limpiando historial:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// @desc    Actualizar preferencias del usuario
// @route   PUT /api/users/preferences
// @access  Private
router.put('/preferences', protect, async (req, res) => {
  try {
    const { language, theme, defaultView, emailNotifications, publicProfile } = req.body

    if (language !== undefined) req.user.preferences.language = language
    if (theme !== undefined) req.user.preferences.theme = theme
    if (defaultView !== undefined) req.user.preferences.defaultView = defaultView
    if (emailNotifications !== undefined) req.user.preferences.emailNotifications = emailNotifications
    if (publicProfile !== undefined) req.user.preferences.publicProfile = publicProfile

    await req.user.save()

    res.json({
      success: true,
      data: req.user.preferences,
      message: 'Preferencias actualizadas exitosamente'
    })
  } catch (error) {
    console.error('Error actualizando preferencias:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// @desc    Actualizar perfil del usuario
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { firstName, lastName, bio, location, website, occupation } = req.body

    if (firstName !== undefined) req.user.profile.firstName = firstName
    if (lastName !== undefined) req.user.profile.lastName = lastName
    if (bio !== undefined) req.user.profile.bio = bio
    if (location !== undefined) req.user.profile.location = location
    if (website !== undefined) req.user.profile.website = website
    if (occupation !== undefined) req.user.profile.occupation = occupation

    await req.user.save()

    res.json({
      success: true,
      data: req.user.profile,
      message: 'Perfil actualizado exitosamente'
    })
  } catch (error) {
    console.error('Error actualizando perfil:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// @desc    Obtener usuario por ID
// @route   GET /api/users/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params

    // Solo admins pueden ver otros usuarios, usuarios normales solo pueden verse a sí mismos
    if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para ver este usuario'
      })
    }

    const user = await User.findById(id).select('-password -resetPasswordToken -resetPasswordExpires')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      })
    }

    res.json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('Error obteniendo usuario:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

export default router
