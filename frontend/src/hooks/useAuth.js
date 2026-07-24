import { useState, useEffect, useContext, createContext } from 'react'
import { useNavigate } from '@/lib/router'
import { authService } from '@services/authService'
import { storage } from '@utils/helpers'
import { STORAGE_KEYS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '@utils/constants'
import toast from 'react-hot-toast'

// Contexto de autenticación
const AuthContext = createContext()

// Provider de autenticación
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Verificar si hay un token guardado al inicializar
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = storage.get('auth_token')
        if (token) {
          // Verificar si el token es válido
          const userData = await authService.verifyToken(token)
          if (userData) {
            setUser(userData)
            setIsAuthenticated(true)
          } else {
            // Token inválido, limpiar storage
            storage.remove('auth_token')
          }
        }
      } catch (error) {
        console.error('Error al inicializar autenticación:', error)
        storage.remove('auth_token')
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  // Función de login
  const login = async (email, password) => {
    try {
      setIsLoading(true)
      const response = await authService.login(email, password)
      
      if (response.success) {
        const { user: userData, token } = response.data
        
        // Guardar token y datos del usuario
        storage.set('auth_token', token)
        setUser(userData)
        setIsAuthenticated(true)
        
        toast.success(SUCCESS_MESSAGES.LOGIN_SUCCESS)
        return { success: true, user: userData }
      } else {
        toast.error(response.message || ERROR_MESSAGES.GENERIC_ERROR)
        return { success: false, message: response.message }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || ERROR_MESSAGES.GENERIC_ERROR
      toast.error(errorMessage)
      return { success: false, message: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  // Función de registro
  const register = async (userData) => {
    try {
      setIsLoading(true)
      const response = await authService.register(userData)
      
      if (response.success) {
        const { user: newUser, token } = response.data
        
        // Guardar token y datos del usuario
        storage.set('auth_token', token)
        setUser(newUser)
        setIsAuthenticated(true)
        
        toast.success(SUCCESS_MESSAGES.REGISTER_SUCCESS)
        return { success: true, user: newUser }
      } else {
        toast.error(response.message || ERROR_MESSAGES.GENERIC_ERROR)
        return { success: false, message: response.message }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || ERROR_MESSAGES.GENERIC_ERROR
      toast.error(errorMessage)
      return { success: false, message: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  // Función de logout
  const logout = async () => {
    try {
      setIsLoading(true)
      
      // Llamar al endpoint de logout si existe
      try {
        await authService.logout()
      } catch (error) {
        // Ignorar errores del logout en el servidor
        console.warn('Error al hacer logout en el servidor:', error)
      }
      
      // Limpiar estado local
      storage.remove('auth_token')
      setUser(null)
      setIsAuthenticated(false)
      
      toast.success(SUCCESS_MESSAGES.LOGOUT_SUCCESS)
      return { success: true }
    } catch (error) {
      console.error('Error durante logout:', error)
      return { success: false, message: ERROR_MESSAGES.GENERIC_ERROR }
    } finally {
      setIsLoading(false)
    }
  }

  // Función para actualizar perfil
  const updateProfile = async (profileData) => {
    try {
      setIsLoading(true)
      const response = await authService.updateProfile(profileData)
      
      if (response.success) {
        setUser(response.data.user)
        toast.success(SUCCESS_MESSAGES.PROFILE_UPDATED)
        return { success: true, user: response.data.user }
      } else {
        toast.error(response.message || ERROR_MESSAGES.GENERIC_ERROR)
        return { success: false, message: response.message }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || ERROR_MESSAGES.GENERIC_ERROR
      toast.error(errorMessage)
      return { success: false, message: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  // Función para cambiar contraseña
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setIsLoading(true)
      const response = await authService.changePassword(currentPassword, newPassword)
      
      if (response.success) {
        toast.success('Contraseña actualizada correctamente')
        return { success: true }
      } else {
        toast.error(response.message || ERROR_MESSAGES.GENERIC_ERROR)
        return { success: false, message: response.message }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || ERROR_MESSAGES.GENERIC_ERROR
      toast.error(errorMessage)
      return { success: false, message: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  // Función para recuperar contraseña
  const forgotPassword = async (email) => {
    try {
      setIsLoading(true)
      const response = await authService.forgotPassword(email)
      
      if (response.success) {
        toast.success('Se ha enviado un email con instrucciones para recuperar tu contraseña')
        return { success: true }
      } else {
        toast.error(response.message || ERROR_MESSAGES.GENERIC_ERROR)
        return { success: false, message: response.message }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || ERROR_MESSAGES.GENERIC_ERROR
      toast.error(errorMessage)
      return { success: false, message: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  // Función para resetear contraseña
  const resetPassword = async (token, newPassword) => {
    try {
      setIsLoading(true)
      const response = await authService.resetPassword(token, newPassword)
      
      if (response.success) {
        toast.success('Contraseña restablecida correctamente')
        return { success: true }
      } else {
        toast.error(response.message || ERROR_MESSAGES.GENERIC_ERROR)
        return { success: false, message: response.message }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || ERROR_MESSAGES.GENERIC_ERROR
      toast.error(errorMessage)
      return { success: false, message: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook para usar el contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  
  return context
}

// Hook personalizado para verificar permisos
export const usePermissions = () => {
  const { user, isAuthenticated } = useAuth()
  
  const hasPermission = (permission) => {
    if (!isAuthenticated || !user) return false
    
    // Si el usuario es admin, tiene todos los permisos
    if (user.role === 'admin') return true
    
    // Verificar permisos específicos
    return user.permissions?.includes(permission) || false
  }
  
  const isAdmin = () => {
    return isAuthenticated && user?.role === 'admin'
  }
  
  const isModerator = () => {
    return isAuthenticated && (user?.role === 'admin' || user?.role === 'moderator')
  }
  
  const canEditTools = () => {
    return hasPermission('edit_tools') || isAdmin()
  }
  
  const canDeleteTools = () => {
    return hasPermission('delete_tools') || isAdmin()
  }
  
  const canModerateComments = () => {
    return hasPermission('moderate_comments') || isModerator()
  }
  
  return {
    hasPermission,
    isAdmin,
    isModerator,
    canEditTools,
    canDeleteTools,
    canModerateComments
  }
}

// Hook para manejar el estado de carga de autenticación
export const useAuthLoading = () => {
  const { isLoading } = useAuth()
  return isLoading
}

// Hook para redireccionar si no está autenticado
export const useRequireAuth = (redirectTo = '/auth') => {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate(redirectTo)
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo])
  
  return { isAuthenticated, isLoading }
}

export default useAuth
