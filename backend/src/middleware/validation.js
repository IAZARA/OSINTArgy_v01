import Joi from 'joi'

// Esquema de validación para registro de usuario
const registerSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'Username solo puede contener letras y números',
      'string.min': 'Username debe tener al menos 3 caracteres',
      'string.max': 'Username no puede tener más de 30 caracteres',
      'any.required': 'Username es requerido'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email debe ser válido',
      'any.required': 'Email es requerido'
    }),
  password: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min': 'Password debe tener al menos 8 caracteres',
      'any.required': 'Password es requerido'
    }),
  firstName: Joi.string()
    .max(50)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Nombre no puede tener más de 50 caracteres'
    }),
  lastName: Joi.string()
    .max(50)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Apellido no puede tener más de 50 caracteres'
    })
})

// Esquema de validación para login
const loginSchema = Joi.object({
  login: Joi.string()
    .required()
    .messages({
      'any.required': 'Email o username es requerido'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password es requerido'
    })
})

// Esquema de validación para herramientas
const toolSchema = Joi.object({
  id: Joi.string()
    .required()
    .pattern(/^[a-z0-9-]+$/)
    .messages({
      'string.pattern.base': 'ID debe contener solo letras minúsculas, números y guiones',
      'any.required': 'ID es requerido'
    }),
  name: Joi.string()
    .max(200)
    .required()
    .messages({
      'string.max': 'Nombre no puede tener más de 200 caracteres',
      'any.required': 'Nombre es requerido'
    }),
  description: Joi.string()
    .max(1000)
    .required()
    .messages({
      'string.max': 'Descripción no puede tener más de 1000 caracteres',
      'any.required': 'Descripción es requerida'
    }),
  utility: Joi.string()
    .max(1000)
    .required()
    .messages({
      'string.max': 'Utilidad no puede tener más de 1000 caracteres',
      'any.required': 'Utilidad es requerida'
    }),
  url: Joi.string()
    .uri()
    .required()
    .messages({
      'string.uri': 'URL debe ser válida',
      'any.required': 'URL es requerida'
    }),
  category: Joi.string()
    .required()
    .messages({
      'any.required': 'Categoría es requerida'
    }),
  subcategory: Joi.string()
    .required()
    .messages({
      'any.required': 'Subcategoría es requerida'
    }),
  tags: Joi.array()
    .items(Joi.string().max(50))
    .optional()
    .messages({
      'array.base': 'Tags debe ser un array',
      'string.max': 'Cada tag no puede tener más de 50 caracteres'
    }),
  type: Joi.string()
    .valid('web', 'desktop', 'mobile', 'api', 'browser-extension')
    .default('web')
    .messages({
      'any.only': 'Tipo debe ser: web, desktop, mobile, api o browser-extension'
    }),
  indicators: Joi.array()
    .items(Joi.string().valid('D', 'R', 'F', 'P', 'A'))
    .optional()
    .messages({
      'any.only': 'Indicadores deben ser: D, R, F, P o A'
    }),
  region: Joi.string()
    .valid('internacional', 'argentina', 'latam', 'europa', 'norteamerica', 'asia')
    .default('internacional')
    .messages({
      'any.only': 'Región debe ser: internacional, argentina, latam, europa, norteamerica o asia'
    }),
  language: Joi.string()
    .valid('es', 'en', 'pt', 'fr', 'de', 'it', 'ru', 'zh', 'ja', 'multi')
    .default('es')
    .messages({
      'any.only': 'Idioma debe ser: es, en, pt, fr, de, it, ru, zh, ja o multi'
    }),
  requires_registration: Joi.boolean()
    .default(false),
  is_free: Joi.boolean()
    .default(true),
  difficulty_level: Joi.string()
    .valid('beginner', 'intermediate', 'advanced', 'expert')
    .default('beginner')
    .messages({
      'any.only': 'Nivel de dificultad debe ser: beginner, intermediate, advanced o expert'
    }),
  screenshot_url: Joi.string()
    .uri()
    .optional()
    .allow('')
    .messages({
      'string.uri': 'URL de screenshot debe ser válida'
    }),
  tutorial_url: Joi.string()
    .uri()
    .optional()
    .allow('')
    .messages({
      'string.uri': 'URL de tutorial debe ser válida'
    }),
  api_documentation: Joi.string()
    .uri()
    .optional()
    .allow('')
    .messages({
      'string.uri': 'URL de documentación API debe ser válida'
    })
})

// Middleware de validación genérico
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    })

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))

      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors
      })
    }

    // Reemplazar req.body con los datos validados y limpiados
    req.body = value
    next()
  }
}

// Middleware específicos
export const validateRegister = validate(registerSchema)
export const validateLogin = validate(loginSchema)
export const validateTool = validate(toolSchema)

// Middleware para validar parámetros de consulta
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    })

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))

      return res.status(400).json({
        success: false,
        message: 'Errores de validación en parámetros',
        errors
      })
    }

    req.query = value
    next()
  }
}

// Esquemas para validación de query parameters
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
})

export const toolsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
  category: Joi.string().optional(),
  subcategory: Joi.string().optional(),
  region: Joi.string().valid('internacional', 'argentina', 'latam', 'europa', 'norteamerica', 'asia').optional(),
  language: Joi.string().valid('es', 'en', 'pt', 'fr', 'de', 'it', 'ru', 'zh', 'ja', 'multi').optional(),
  type: Joi.string().valid('web', 'desktop', 'mobile', 'api', 'browser-extension').optional(),
  difficulty_level: Joi.string().valid('beginner', 'intermediate', 'advanced', 'expert').optional(),
  is_free: Joi.boolean().optional(),
  requires_registration: Joi.boolean().optional(),
  min_rating: Joi.number().min(0).max(5).optional(),
  search: Joi.string().min(2).optional(),
  sort: Joi.string().valid('name', 'rating', 'usage', 'recent').default('rating')
})
