import client from './client'

export interface Case {
  id: string
  title: string
  description: string | null
  status: 'open' | 'in_progress' | 'closed'
  lawyer_id: string | null
  client_id: string | null
  created_at: string
  updated_at: string
}

export interface CreateCasePayload {
  title: string
  description?: string
}

export interface UpdateCasePayload {
  title?: string
  description?: string
  status?: 'open' | 'in_progress' | 'closed'
}

export const listCases = () =>
  client.get<Case[]>('/cases').then((r) => r.data)

export const createCase = (payload: CreateCasePayload) =>
  client.post<Case>('/cases', payload).then((r) => r.data)

export const getCase = (id: string) =>
  client.get<Case>(`/cases/${id}`).then((r) => r.data)

export const updateCase = (id: string, payload: UpdateCasePayload) =>
  client.put<Case>(`/cases/${id}`, payload).then((r) => r.data)

export interface AssignCasePayload {
  lawyer_id?: string | null
  client_id?: string | null
}

export const assignCase = (id: string, payload: AssignCasePayload) =>
  client.post<Case>(`/cases/${id}/assign`, payload).then((r) => r.data)

export const deleteCase = (id: string) =>
  client.delete(`/cases/${id}`).then((r) => r.data)
