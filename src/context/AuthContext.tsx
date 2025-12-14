import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface User {
  type: 'admin' | 'school'
  schoolName?: string
  principalId?: string
  schoolId?: number
}

interface AuthContextType {
  user: User | null
  login: (userData: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)

  const login = (userData: User) => {
    setUser(userData)
    // Store in localStorage for persistence
    localStorage.setItem('bcApp_user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('bcApp_user')
  }

  // Restore user from localStorage on mount
  React.useEffect(() => {
    const stored = localStorage.getItem('bcApp_user')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to restore user session', e)
      }
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
