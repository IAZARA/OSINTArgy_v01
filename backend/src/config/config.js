import dotenv from 'dotenv'
import { DEFAULT_DEV_JWT_SECRET } from './security.js'

// Cargar variables de entorno
dotenv.config()

const config = {
  // Configuración del servidor
  server: {
    port: process.env.PORT || 5000,
    host: process.env.HOST || 'localhost',
    env: process.env.NODE_ENV || 'development'
  },

  // Configuración de la base de datos
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/osintargy',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },

  // Configuración de JWT
  jwt: {
    secret: process.env.JWT_SECRET || DEFAULT_DEV_JWT_SECRET,
    expire: process.env.JWT_EXPIRE || '30d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'osintargy_refresh_secret_key_2025',
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d'
  },

  // Configuración de CORS
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    optionsSuccessStatus: 200
  },

  // Configuración de rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // máximo 100 requests por ventana
    message: {
      error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
    }
  },

  // Configuración de archivos
  upload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    destination: process.env.UPLOAD_PATH || 'uploads/'
  },

  // Configuración de email (para futuras implementaciones)
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'noreply@osintargy.online'
  },

  // Configuración de logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
    errorFile: process.env.ERROR_LOG_FILE || 'logs/error.log',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14d'
  },

  // Configuración de cache (para futuras implementaciones)
  cache: {
    ttl: parseInt(process.env.CACHE_TTL) || 300, // 5 minutos
    checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD) || 600 // 10 minutos
  },

  // URLs y endpoints externos
  external: {
    // APIs externas que se puedan integrar en el futuro
    virustotal: {
      apiKey: process.env.VIRUSTOTAL_API_KEY,
      baseUrl: 'https://www.virustotal.com/vtapi/v2'
    },
    shodan: {
      apiKey: process.env.SHODAN_API_KEY,
      baseUrl: 'https://api.shodan.io'
    }
  },

  // Configuración de seguridad
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
    lockoutTime: parseInt(process.env.LOCKOUT_TIME) || 2 * 60 * 60 * 1000, // 2 horas
    passwordResetExpire: parseInt(process.env.PASSWORD_RESET_EXPIRE) || 60 * 60 * 1000 // 1 hora
  },

  // Configuración de la aplicación
  app: {
    name: 'OSINTArgy',
    version: '1.0.0',
    description: 'Framework OSINT mejorado en español argentino',
    author: 'Ivan Agustin Zarate',
    homepage: process.env.APP_HOMEPAGE || '',
    supportEmail: process.env.SUPPORT_EMAIL || 'soporte@osintargy.online'
  },

  // Configuración de desarrollo
  development: {
    seedDatabase: process.env.SEED_DATABASE === 'true',
    enableSwagger: process.env.ENABLE_SWAGGER !== 'false',
    enableCors: process.env.ENABLE_CORS !== 'false',
    logRequests: process.env.LOG_REQUESTS !== 'false'
  }
}

// Validar configuración crítica
const validateConfig = () => {
  const required = [
    'MONGODB_URI',
    'JWT_SECRET'
  ]

  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0 && config.server.env === 'production') {
    console.error('❌ Variables de entorno faltantes:', missing.join(', '))
    process.exit(1)
  }

  if (missing.length > 0) {
    console.warn('⚠️  Variables de entorno faltantes (usando valores por defecto):', missing.join(', '))
  }
}

// Ejecutar validación
validateConfig()

export default config
