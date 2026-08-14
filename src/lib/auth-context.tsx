import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { checkAuth, logout as apiLogout } from '../lib/api'
import type { AdminUser } from '../lib/api'
import { getStoredUser } from '../lib/api'

interface AuthContextValue {
  user: AdminUser | null
  checking: boolean
  isAuthenticated: boolean
  logout: () => void
  setUser: (u: AdminUser | null) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(() => getStoredUser())
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      const result = await checkAuth()
      if (!active) return
      setUser(result.success ? (result.user ?? getStoredUser()) : null)
      setChecking(false)
    })()
    return () => {
      active = false
    }
  }, [])

  const logout = () => {
    apiLogout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, checking, isAuthenticated: !!user, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}