'use client'

/* eslint-disable react-hooks/set-state-in-effect */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { login as authLogin, logout as authLogout, isAuthenticated as checkAuth } from '@/lib/auth'

interface AuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    setIsAuthenticated(checkAuth())
    setIsLoading(false)
  }, [])

  const login = useCallback((username: string, password: string): boolean => {
    const success = authLogin(username, password)
    if (success) {
      setIsAuthenticated(true)
    }
    return success
  }, [])

  const logout = useCallback(() => {
    authLogout()
    setIsAuthenticated(false)
    router.push('/login')
  }, [router])

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
