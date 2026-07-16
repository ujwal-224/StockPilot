import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

export const sendChatMessage = async (message: string): Promise<string> => {
  const response = await axios.post<{ success: boolean; reply: string }>(
    `${API_URL}/api/ai/chat`,
    { message }
  )
  return response.data.reply
}
