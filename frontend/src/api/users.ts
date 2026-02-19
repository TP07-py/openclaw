import client from './client'

export interface UserPublic {
  id: string
  full_name: string
  email: string
  role: 'admin' | 'lawyer' | 'client'
  is_active: boolean
}

export interface UpdateUserPayload {
  full_name?: string
  email?: string
  role?: 'admin' | 'lawyer' | 'client'
  is_active?: boolean
}

export const getUser = (id: string) =>
  client.get<UserPublic>(`/users/${id}`).then((r) => r.data)

export const listUsers = () =>
  client.get<UserPublic[]>('/users').then((r) => r.data)

export const updateUser = (id: string, payload: UpdateUserPayload) =>
  client.put<UserPublic>(`/users/${id}`, payload).then((r) => r.data)
