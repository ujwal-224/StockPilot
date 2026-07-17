import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

export interface ShopProfile {
  _id: string
  name: string
  owner: string
  phone: string
  businessType: string
  address?: string
  city?: string
  state?: string
  country?: string
  pincode?: string
  currency: string
  timezone: string
  preferredLanguage: string
  shopLogo?: string
  profileCompleted: boolean
  createdAt?: string
  updatedAt?: string
}

export const getShopProfile = async () => {
  const response = await axios.get<{ success: boolean; data: ShopProfile }>(`${API_URL}/api/shop/profile`)
  return response.data
}

export const updateShopProfile = async (data: Partial<ShopProfile>) => {
  const response = await axios.put<{ success: boolean; data: ShopProfile }>(`${API_URL}/api/shop/profile`, data)
  return response.data
}
