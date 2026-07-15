import axios from 'axios'
import type { DashboardData } from '../types'

const API_URL = import.meta.env.VITE_API_URL

export const getDashboardData = async () => {
  const response = await axios.get<{ success: boolean; data: DashboardData }>(`${API_URL}/api/dashboard`)
  return response.data
}
