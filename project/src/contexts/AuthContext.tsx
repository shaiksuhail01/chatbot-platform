import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { User, AuthState } from '../types'
import { authAPI } from '../lib/api'

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

type AuthAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: { user: User; token: string } }
  | { type: 'CLEAR_USER' }

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_USER':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false
      }
    case 'CLEAR_USER':
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      }
    default:
      return state
  }
}

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    // Check for stored auth data on app load
    const initializeAuth = async () => {
      const token = localStorage.getItem('auth_token')
      
      if (token) {
        try {
          // Verify token with backend
          const user = await authAPI.getCurrentUser()
          dispatch({ type: 'SET_USER', payload: { user, token } })
        } catch (error) {
          // Token is invalid, clear storage
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user_data')
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    initializeAuth()
  }, [])

  const login = async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      const { user, token } = await authAPI.login(email, password)
      
      localStorage.setItem('auth_token', token)
      localStorage.setItem('user_data', JSON.stringify(user))
      
      dispatch({ type: 'SET_USER', payload: { user, token } })
    } catch (error: any) {
      dispatch({ type: 'SET_LOADING', payload: false })
      const message = error.response?.data?.message || 'Login failed'
      throw new Error(message)
    }
  }

  const register = async (email: string, password: string, name?: string) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      const { user, token } = await authAPI.register(email, password, name)
      
      localStorage.setItem('auth_token', token)
      localStorage.setItem('user_data', JSON.stringify(user))
      
      dispatch({ type: 'SET_USER', payload: { user, token } })
    } catch (error: any) {
      dispatch({ type: 'SET_LOADING', payload: false })
      const message = error.response?.data?.message || 'Registration failed'
      throw new Error(message)
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    dispatch({ type: 'CLEAR_USER' })
  }

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}