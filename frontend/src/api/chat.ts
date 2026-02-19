import client from './client'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface SendMessagePayload {
  content: string
}

// POST returns [userMessage, assistantMessage]
export const sendMessage = (caseId: string, payload: SendMessagePayload) =>
  client
    .post<Message[]>(`/cases/${caseId}/chat`, payload)
    .then((r) => r.data)

export const listMessages = (caseId: string) =>
  client.get<Message[]>(`/cases/${caseId}/chat`).then((r) => r.data)

export const deleteMessage = (caseId: string, messageId: string) =>
  client
    .delete(`/cases/${caseId}/chat/${messageId}`)
    .then((r) => r.data)
