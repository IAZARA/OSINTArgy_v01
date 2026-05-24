import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    validate: {
      validator: function(v) {
        return /^[a-zA-Z0-9_-]+$/.test(v)
      },
      message: 'Username solo puede contener letras, números, guiones y guiones bajos'
    }
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
      },
      message: 'Email debe ser válido'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  profile: {
    firstName: {
      type: String,
      trim: true,
      maxlength: 50
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: 50
    },
    avatar: {
      type: String,
      trim: true
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500
    },
    location: {
      type: String,
      trim: true,
      maxlength: 100
    },
    website: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/.+/.test(v)
        },
        message: 'Website debe ser una URL válida'
      }
    },
    occupation: {
      type: String,
      trim: true,
      maxlength: 100
    }
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
  },
  preferences: {
    language: {
      type: String,
      enum: ['es', 'en'],
      default: 'es'
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    defaultView: {
      type: String,
      enum: ['tree', 'cards'],
      default: 'tree'
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    publicProfile: {
      type: Boolean,
      default: false
    }
  },
  // Favoritos
  favorites: [{
    toolId: {
      type: String,
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      maxlength: 1000
    }
  }],
  // Historial de herramientas visitadas
  history: [{
    toolId: {
      type: String,
      required: true
    },
    visitedAt: {
      type: Date,
      default: Date.now
    },
    visitCount: {
      type: Number,
      default: 1
    }
  }],
  // Notas personales
  notes: [{
    id: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true,
      maxlength: 200
    },
    content: {
      type: String,
      required: true,
      maxlength: 10000
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    relatedTools: [{
      type: String
    }],
    isPrivate: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Historial de búsquedas
  searchHistory: [{
    query: {
      type: String,
      required: true,
      maxlength: 200
    },
    filters: {
      type: Object,
      default: {}
    },
    resultsCount: {
      type: Number,
      default: 0
    },
    searchedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Estadísticas del usuario
  stats: {
    toolsUsed: {
      type: Number,
      default: 0
    },
    favoritesCount: {
      type: Number,
      default: 0
    },
    notesCount: {
      type: Number,
      default: 0
    },
    ratingsGiven: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  // Configuración de cuenta
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password
      delete ret.verificationToken
      delete ret.resetPasswordToken
      delete ret.resetPasswordExpires
      return ret
    }
  },
  toObject: { virtuals: true }
})

// Índices
// email y username ya tienen índices únicos definidos en el schema
userSchema.index({ 'favorites.toolId': 1 })
userSchema.index({ 'history.toolId': 1 })
userSchema.index({ isActive: 1, role: 1 })

// Virtual para nombre completo
userSchema.virtual('fullName').get(function() {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`
  }
  return this.profile.firstName || this.profile.lastName || this.username
})

// Virtual para verificar si la cuenta está bloqueada
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now())
})

// Middleware para hashear password antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Middleware para actualizar estadísticas
userSchema.pre('save', function(next) {
  if (this.isModified('favorites')) {
    this.stats.favoritesCount = this.favorites.length
  }
  if (this.isModified('notes')) {
    this.stats.notesCount = this.notes.length
  }
  next()
})

// Método para comparar passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Método para agregar herramienta a favoritos
userSchema.methods.addToFavorites = function(toolId, notes = '') {
  const existingFavorite = this.favorites.find(fav => fav.toolId === toolId)
  if (existingFavorite) {
    existingFavorite.notes = notes
    existingFavorite.addedAt = new Date()
  } else {
    this.favorites.push({ toolId, notes })
  }
  return this.save()
}

// Método para remover de favoritos
userSchema.methods.removeFromFavorites = function(toolId) {
  this.favorites = this.favorites.filter(fav => fav.toolId !== toolId)
  return this.save()
}

// Método para agregar al historial
userSchema.methods.addToHistory = function(toolId) {
  const existingHistory = this.history.find(hist => hist.toolId === toolId)
  if (existingHistory) {
    existingHistory.visitedAt = new Date()
    existingHistory.visitCount += 1
  } else {
    this.history.unshift({ toolId })
  }
  
  // Mantener solo los últimos 100 elementos del historial
  if (this.history.length > 100) {
    this.history = this.history.slice(0, 100)
  }
  
  this.stats.lastActivity = new Date()
  return this.save()
}

// Método para incrementar intentos de login
userSchema.methods.incLoginAttempts = function() {
  // Si ya tenemos un lock previo y ha expirado, reiniciar
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    })
  }
  
  const updates = { $inc: { loginAttempts: 1 } }
  
  // Si llegamos al máximo de intentos y no estamos bloqueados, bloquear cuenta
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 } // 2 horas
  }
  
  return this.updateOne(updates)
}

// Método para resetear intentos de login
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  })
}

const User = mongoose.model('User', userSchema)

export default User
