import { createContext, useContext, useEffect, useState } from 'react'
import {
  applyToken,
  clearToken,
  getSession,
  getStoredToken,
  signIn as requestSignIn,
  signUp as requestSignUp,
  storeToken,
  type Session,
} from '../services/authService'

interface AuthContextValue {
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (data: Parameters<typeof requestSignUp>[0]) => Promise<void>
  signOut: () => void
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(() => Boolean(getStoredToken()))

  useEffect(() => {
    const token = getStoredToken()
    if (!token) return

    applyToken(token)
    getSession()
      .then((data) => setSession(data))
      .catch(() => { clearToken(); setSession(null) })
      .finally(() => setLoading(false))
  }, [])

  const signIn = async (email: string, password: string) => {
    const response = await requestSignIn(email, password)
    localStorage.removeItem('app_notifications')
    storeToken(response.token)
    setSession(response)
  }

  const signUp = async (data: Parameters<typeof requestSignUp>[0]) => {
    const response = await requestSignUp(data)
    localStorage.removeItem('app_notifications')
    storeToken(response.token)
    setSession(response)
  }

  const signOut = () => {
    clearToken()
    localStorage.removeItem('app_notifications')
    setSession(null)
    window.history.replaceState(null, '', '/signin')
  }

  const refreshSession = async () => {
    try {
      const data = await getSession()
      setSession(data)
    } catch (err) {
      console.error('Failed to refresh session:', err)
    }
  }

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signUp, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
