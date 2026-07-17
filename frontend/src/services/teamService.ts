import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

export interface TeamMember {
  _id: string
  user: { _id: string; name: string; email: string }
  role: 'OWNER' | 'MANAGER' | 'WORKER'
  status: 'ACTIVE' | 'INACTIVE'
}

export interface Invitation {
  _id: string
  email: string
  role: 'MANAGER' | 'WORKER'
  expiresAt: string
}

export const getTeam = async () =>
  (await axios.get<{ data: { members: TeamMember[]; invitations: Invitation[] } }>(`${API_URL}/api/team`)).data.data

export const inviteWorker = async (email: string, role: 'MANAGER' | 'WORKER') =>
  (await axios.post<{ data: Invitation & { code: string } }>(`${API_URL}/api/team/invitations`, { email, role })).data.data

export const updateMember = async (id: string, data: { role?: 'MANAGER' | 'WORKER'; status?: 'ACTIVE' | 'INACTIVE' }) =>
  (await axios.patch(`${API_URL}/api/team/members/${id}`, data)).data
