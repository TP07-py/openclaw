import client from './client'

export interface UserPublic {
  id: string
  full_name: string
  email: string
  role: 'admin' | 'lawyer' | 'client'
}

export const getUser = (id: string) =>
  client.get<UserPublic>(`/users/${id}`).then((r) => r.data)
