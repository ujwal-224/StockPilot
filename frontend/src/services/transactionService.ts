import axios from 'axios'
import type { TransactionRecord, CreateTransactionData } from '../types'

const API_URL = import.meta.env.VITE_API_URL

export const getTransactions = async () => {
  const response = await axios.get<{ success: boolean; data: TransactionRecord[] }>(`${API_URL}/api/transactions`)
  return response.data
}

export const createTransaction = async (transactionData: CreateTransactionData) => {
  const response = await axios.post(`${API_URL}/api/transactions`, transactionData)
  return response.data
}
