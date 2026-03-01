import { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin } from '../api/client.js'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('dk_token')
    const name  = localStorage.getItem('dk_name')
    const role  = localStorage.getItem('dk_role')
    if (token) setUser({ token, name, role })
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const { data } = await apiLogin({ email, password })
    const user = data.data ?? data
    localStorage.setItem('dk_token', user.token)
    localStorage.setItem('dk_name',  user.name)
    localStorage.setItem('dk_role',  user.role)
    setUser(user)
    return user
  }

  const logout = () => {
    localStorage.removeItem('dk_token')
    localStorage.removeItem('dk_name')
    localStorage.removeItem('dk_role')
    setUser(null)
  }

  return <AuthCtx.Provider value={{ user, login, logout, loading }}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)
