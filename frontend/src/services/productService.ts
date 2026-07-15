import axios from 'axios'
import type { BackendProduct } from '../types'

const API_URL = import.meta.env.VITE_API_URL

export const getProducts = async () => {
  const response = await axios.get<{ success: boolean; data: BackendProduct[] }>(`${API_URL}/api/products`)
  return response.data
}

export const createProduct = async (productData: {
  name: string
  category: string
  price: number
  stock: number
  unit: string
  threshold: number
  image?: string
}) => {
  const response = await axios.post(`${API_URL}/api/products`, productData)
  return response.data
}

export const updateProduct = async (
  id: string,
  productData: {
    name: string
    category: string
    price: number
    stock: number
    unit: string
    threshold: number
    image?: string
  }
) => {
  const response = await axios.put(`${API_URL}/api/products/${id}`, productData)
  return response.data
}

export const deleteProduct = async (id: string) => {
  const response = await axios.delete(`${API_URL}/api/products/${id}`)
  return response.data
}
