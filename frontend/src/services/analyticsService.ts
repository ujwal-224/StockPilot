import axios from 'axios'
import type { AnalyticsData } from '../types'

const API_URL = import.meta.env.VITE_API_URL

export const getAnalyticsData = async () => {
  const response = await axios.get<{ success: boolean; data: AnalyticsData }>(`${API_URL}/api/analytics`)
  return response.data
}
