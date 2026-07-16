import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

export const getAIInsights = async (): Promise<string[]> => {
  const response = await axios.get<{ success: boolean; insights: string[] }>(
    `${API_URL}/api/ai/insights`,
  )

  return response.data.insights
}
