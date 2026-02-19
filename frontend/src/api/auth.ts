import client from './client'

export interface RegisterPayload {
  email: string
  password: string
  full_name: string
  role?: 'lawyer' | 'client'
}

export interface LoginPayload {
  username: string
  password: string
}

export interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'lawyer' | 'client'
  is_active: boolean
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface UpdateMePayload {
  full_name?: string
  email?: string
  password?: string
}

export const register = (payload: RegisterPayload) =>
  client.post<User>('/auth/register', payload).then((r) => r.data)

export const login = (payload: LoginPayload) => {
  const form = new URLSearchParams()
  form.append('username', payload.username)
  form.append('password', payload.password)
  return client
    .post<TokenResponse>('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    .then((r) => r.data)
}

export const getMe = (token?: string) =>
  client
    .get<User>('/auth/me', token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
    .then((r) => r.data)

export const updateMe = (payload: UpdateMePayload) =>
  client.put<User>('/auth/me', payload).then((r) => r.data)
