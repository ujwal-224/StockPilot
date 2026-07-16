import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL
const TOKEN_KEY = 'stockpilot_token'

export interface Session {
  user: { id: string; name: string; email: string }
  shop: { id: string; name: string }
  membership: { id: string; role: 'OWNER' | 'MANAGER' | 'WORKER' }
}

export interface AuthResponse extends Session {
  success: boolean
  token: string
}

export const applyToken = (token: string | null) => {
  if (token) axios.defaults.headers.common.Authorization = `Bearer ${token}`
  else delete axios.defaults.headers.common.Authorization
}

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY)

export const storeToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token)
  applyToken(token)
}

export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY)
  applyToken(null)
}

export const signIn = async (email: string, password: string) =>
  (await axios.post<AuthResponse>(`${API_URL}/api/auth/signin`, { email, password })).data

export const signUp = async (data: {
  name: string
  email: string
  password: string
  shopName?: string
  invitationCode?: string
}) => (await axios.post<AuthResponse>(`${API_URL}/api/auth/signup`, data)).data

export const getSession = async () =>
  (await axios.get<{ success: boolean } & Session>(`${API_URL}/api/auth/me`)).data
