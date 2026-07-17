import axios from 'axios'
import type { TransactionRecord, CreateTransactionData } from '../types'

const API_URL = import.meta.env.VITE_API_URL

export interface TransactionPage {
  success: boolean
  data: TransactionRecord[]
  total: number
  page: number
  pages: number
  counts: Partial<Record<TransactionRecord['type'], number>>
}

export const getTransactions = async (page = 1, limit = 50) => {
  const response = await axios.get<TransactionPage>(`${API_URL}/api/transactions`, { params: { page, limit } })
  return response.data
}

export const createTransaction = async (transactionData: CreateTransactionData) => {
  const response = await axios.post(`${API_URL}/api/transactions`, transactionData)
  return response.data
}
