import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api/auth'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (error) {
        console.error('Error parsing user data:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials)
      console.log("Login response:", response);
      const { token, user: userData } = response.data
      
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      
      return { success: true, data: response }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData)
      console.log("Register response:", response);
      const { token, user: newUser } = response.data
      
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(newUser))
      setUser(newUser)
      
      return { success: true, data: response }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      }
    }
  }

  const logout = () => {
    authAPI.logout()
    setUser(null)
  }

  const isAdmin = () => {
    return user?.role === 'admin'
  }

  const value = {
    user,
    login,
    register,
    logout,
    isAdmin,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
