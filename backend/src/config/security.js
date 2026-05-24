export const DEFAULT_DEV_JWT_SECRET = 'dev-only-osintargy-jwt-secret-change-me'

const INSECURE_JWT_SECRETS = new Set([
  DEFAULT_DEV_JWT_SECRET,
  'fallback_secret',
  'osintargy_jwt_secret_key_2025',
  'osintargy_jwt_secret_key_2025_change_in_production',
  'your-super-secret-jwt-key-change-in-production'
])

export const getJwtSecret = () => process.env.JWT_SECRET || DEFAULT_DEV_JWT_SECRET

export const getAllowedOrigins = () => {
  const configuredOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)

  if (process.env.NODE_ENV === 'production') {
    return [...new Set(configuredOrigins)]
  }

  return [...new Set([
    'http://localhost:5173',
    'http://localhost:5174',
    ...configuredOrigins
  ])]
}

export const validateSecurityConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production'
  const jwtSecret = process.env.JWT_SECRET

  if (!isProduction) {
    if (!jwtSecret) {
      console.warn('JWT_SECRET no está definido; usando secreto local solo para desarrollo.')
    }
    return
  }

  const missing = ['MONGODB_URI', 'JWT_SECRET', 'FRONTEND_URL']
    .filter(key => !process.env[key])

  if (missing.length > 0) {
    throw new Error(`Variables de entorno requeridas en producción: ${missing.join(', ')}`)
  }

  if (jwtSecret.length < 32 || INSECURE_JWT_SECRETS.has(jwtSecret)) {
    throw new Error('JWT_SECRET debe ser único, fuerte y tener al menos 32 caracteres en producción.')
  }
}
