import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

export interface WhatsAppStatus {
  configured: boolean
  businessNumber: string
  linked: boolean
  phoneNumber: string
  lowStockAlertsEnabled: boolean
  linkedAt: string | null
}

export const getWhatsAppStatus = async () =>
  (await axios.get<{ data: WhatsAppStatus }>(`${API_URL}/api/whatsapp/status`)).data.data

export const createWhatsAppLinkCode = async () =>
  (await axios.post<{ data: { code: string; expiresAt: string; businessNumber: string } }>(`${API_URL}/api/whatsapp/link-code`)).data.data

export const updateWhatsAppSettings = async (lowStockAlertsEnabled: boolean) =>
  (await axios.patch(`${API_URL}/api/whatsapp/settings`, { lowStockAlertsEnabled })).data

export const disconnectWhatsApp = async () =>
  (await axios.delete(`${API_URL}/api/whatsapp/connection`)).data
