import React, { createContext, useContext, useState, ReactNode } from 'react'

// User session is managed in sessionStorage (clears on browser close)
// This is more secure than localStorage for session management
// All data storage uses SharePoint ONLY for security compliance

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
    // Store in sessionStorage for session persistence (clears on browser close)
    sessionStorage.setItem('bcApp_user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    sessionStorage.removeItem('bcApp_user')
  }

  // Restore user from sessionStorage on mount
  React.useEffect(() => {
    const stored = sessionStorage.getItem('bcApp_user')
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
