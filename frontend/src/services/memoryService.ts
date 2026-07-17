import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

export interface BusinessMemory {
  id: string
  memory: string
  category: string
  createdAt: string
  userId: string | null
}

export const getMemories = async (): Promise<BusinessMemory[]> => {
  const response = await axios.get<{ success: boolean; memories: BusinessMemory[] }>(
    `${API_URL}/api/memory`
  )
  return response.data.memories
}

export const deleteMemory = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/api/memory/${id}`)
}
