import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { getJwtSecret } from '../config/security.js'

// Middleware para proteger rutas
export const protect = async (req, res, next) => {
  try {
    let token

    // Verificar si el token está en el header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    // Verificar si no hay token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado, token requerido'
      })
    }

    try {
      // Verificar token
      const decoded = jwt.verify(token, getJwtSecret())

      // Obtener usuario del token
      const user = await User.findById(decoded.id).select('-password')

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado, usuario no encontrado'
        })
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Cuenta desactivada'
        })
      }

      // Agregar usuario a la request
      req.user = user
      next()
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado, token inválido'
      })
    }
  } catch (error) {
    console.error('Error en middleware de autenticación:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

// Middleware para autorizar roles específicos
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado'
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Rol ${req.user.role} no autorizado para acceder a este recurso`
      })
    }

    next()
  }
}

// Middleware opcional para obtener usuario si está autenticado
export const optionalAuth = async (req, res, next) => {
  try {
    let token

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, getJwtSecret())
        const user = await User.findById(decoded.id).select('-password')
        
        if (user && user.isActive) {
          req.user = user
        }
      } catch (error) {
        // Si el token es inválido, simplemente continuar sin usuario
        console.log('Token inválido en optionalAuth:', error.message)
      }
    }

    next()
  } catch (error) {
    console.error('Error en middleware de autenticación opcional:', error)
    next()
  }
}
