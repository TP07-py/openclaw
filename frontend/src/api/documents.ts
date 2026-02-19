import client from './client'

export interface Document {
  id: string
  filename: string
  original_filename: string
  mime_type: string
  status: 'uploaded' | 'analyzing' | 'analyzed' | 'failed'
  ai_summary: string | null
  ai_key_points: string | null   // JSON-encoded string array from backend
  created_at: string
}

export const uploadDocument = (caseId: string, file: File) => {
  const form = new FormData()
  form.append('file', file)
  return client
    .post<Document>(`/cases/${caseId}/documents/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data)
}

export const listDocuments = (caseId: string) =>
  client.get<Document[]>(`/cases/${caseId}/documents`).then((r) => r.data)

export const analyzeDocument = (caseId: string, docId: string) =>
  client
    .post<Document>(`/cases/${caseId}/documents/${docId}/analyze`)
    .then((r) => r.data)

export const deleteDocument = (caseId: string, docId: string) =>
  client.delete(`/cases/${caseId}/documents/${docId}`).then((r) => r.data)
