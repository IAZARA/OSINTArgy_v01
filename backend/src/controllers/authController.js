import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { getJwtSecret } from '../config/security.js'

// Generar JWT
const generateToken = (id) => {
  return jwt.sign({ id }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  })
}

// @desc    Registrar usuario
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body

    // Validar campos requeridos
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email y password son requeridos'
      })
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    })

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email 
          ? 'Ya existe un usuario con ese email' 
          : 'Ya existe un usuario con ese username'
      })
    }

    // Crear usuario
    const user = new User({
      username,
      email,
      password,
      profile: {
        firstName: firstName || '',
        lastName: lastName || ''
      }
    })

    await user.save()

    // Generar token
    const token = generateToken(user._id)

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profile: user.profile,
          role: user.role,
          preferences: user.preferences
        },
        token
      },
      message: 'Usuario registrado exitosamente'
    })
  } catch (error) {
    console.error('Error en registro:', error)
    
    // Manejar errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      })
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

// @desc    Iniciar sesión
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { login, password } = req.body

    // Validar campos requeridos
    if (!login || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/username y password son requeridos'
      })
    }

    // Buscar usuario por email o username
    const user = await User.findOne({
      $or: [
        { email: login.toLowerCase() },
        { username: login }
      ],
      isActive: true
    }).select('+password')

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      })
    }

    // Verificar si la cuenta está bloqueada
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Cuenta temporalmente bloqueada por múltiples intentos fallidos'
      })
    }

    // Verificar password
    const isPasswordValid = await user.comparePassword(password)

    if (!isPasswordValid) {
      // Incrementar intentos fallidos
      await user.incLoginAttempts()
      
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      })
    }

    // Reset intentos de login si el login es exitoso
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts()
    }

    // Actualizar último login
    user.lastLogin = new Date()
    user.stats.lastActivity = new Date()
    await user.save()

    // Generar token
    const token = generateToken(user._id)

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profile: user.profile,
          role: user.role,
          preferences: user.preferences,
          stats: user.stats
        },
        token
      },
      message: 'Inicio de sesión exitoso'
    })
  } catch (error) {
    console.error('Error en login:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

// @desc    Obtener perfil del usuario actual
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('favorites.toolId', 'name description url category')

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
    console.error('Error obteniendo perfil:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

// @desc    Actualizar perfil
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      bio,
      location,
      website,
      occupation,
      preferences
    } = req.body

    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      })
    }

    // Actualizar campos del perfil
    if (firstName !== undefined) user.profile.firstName = firstName
    if (lastName !== undefined) user.profile.lastName = lastName
    if (bio !== undefined) user.profile.bio = bio
    if (location !== undefined) user.profile.location = location
    if (website !== undefined) user.profile.website = website
    if (occupation !== undefined) user.profile.occupation = occupation

    // Actualizar preferencias
    if (preferences) {
      if (preferences.language) user.preferences.language = preferences.language
      if (preferences.theme) user.preferences.theme = preferences.theme
      if (preferences.defaultView) user.preferences.defaultView = preferences.defaultView
      if (preferences.emailNotifications !== undefined) {
        user.preferences.emailNotifications = preferences.emailNotifications
      }
      if (preferences.publicProfile !== undefined) {
        user.preferences.publicProfile = preferences.publicProfile
      }
    }

    await user.save()

    res.json({
      success: true,
      data: user,
      message: 'Perfil actualizado exitosamente'
    })
  } catch (error) {
    console.error('Error actualizando perfil:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

// @desc    Cambiar password
// @route   PUT /api/auth/password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password actual y nuevo password son requeridos'
      })
    }

    const user = await User.findById(req.user._id).select('+password')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      })
    }

    // Verificar password actual
    const isCurrentPasswordValid = await user.comparePassword(currentPassword)

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Password actual incorrecto'
      })
    }

    // Validar nuevo password
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'El nuevo password debe tener al menos 8 caracteres'
      })
    }

    // Actualizar password
    user.password = newPassword
    await user.save()

    res.json({
      success: true,
      message: 'Password actualizado exitosamente'
    })
  } catch (error) {
    console.error('Error cambiando password:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

// @desc    Cerrar sesión
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  try {
    // En una implementación más completa, aquí se podría:
    // - Invalidar el token en una blacklist
    // - Limpiar cookies si se usan
    // - Registrar el logout en logs de auditoría

    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    })
  } catch (error) {
    console.error('Error en logout:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

// @desc    Solicitar reset de password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email es requerido'
      })
    }

    const user = await User.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    })

    if (!user) {
      // Por seguridad, no revelar si el email existe o no
      return res.json({
        success: true,
        message: 'Si el email existe, recibirás instrucciones para resetear tu password'
      })
    }

    // Generar token de reset
    const resetToken = jwt.sign(
      { id: user._id, purpose: 'password-reset' },
      getJwtSecret(),
      { expiresIn: '1h' }
    )

    user.resetPasswordToken = resetToken
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hora
    await user.save()

    // TODO: Enviar email con el token de reset
    // En una implementación completa, aquí se enviaría un email

    res.json({
      success: true,
      message: 'Si el email existe, recibirás instrucciones para resetear tu password'
    })
  } catch (error) {
    console.error('Error en forgot password:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

// @desc    Resetear password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token y nuevo password son requeridos'
      })
    }

    // Verificar token
    let decoded
    try {
      decoded = jwt.verify(token, getJwtSecret())
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido o expirado'
      })
    }

    if (decoded.purpose !== 'password-reset') {
      return res.status(400).json({
        success: false,
        message: 'Token inválido'
      })
    }

    const user = await User.findOne({
      _id: decoded.id,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
      isActive: true
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido o expirado'
      })
    }

    // Validar nuevo password
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'El password debe tener al menos 8 caracteres'
      })
    }

    // Actualizar password y limpiar tokens
    user.password = newPassword
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    res.json({
      success: true,
      message: 'Password reseteado exitosamente'
    })
  } catch (error) {
    console.error('Error en reset password:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}
