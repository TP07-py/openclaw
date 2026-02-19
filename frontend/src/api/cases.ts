import client from './client'

export interface Case {
  id: string
  title: string
  description: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface CreateCasePayload {
  title: string
  description?: string
}

export const listCases = () =>
  client.get<Case[]>('/cases').then((r) => r.data)

export const createCase = (payload: CreateCasePayload) =>
  client.post<Case>('/cases', payload).then((r) => r.data)

export const getCase = (id: string) =>
  client.get<Case>(`/cases/${id}`).then((r) => r.data)

export const deleteCase = (id: string) =>
  client.delete(`/cases/${id}`).then((r) => r.data)
