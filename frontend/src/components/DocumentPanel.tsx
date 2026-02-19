import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  listDocuments,
  uploadDocument,
  analyzeDocument,
  deleteDocument,
  Document,
} from '../api/documents'
import Spinner from './Spinner'

interface Props {
  caseId: string
}

const STATUS_COLORS: Record<Document['status'], string> = {
  uploaded: 'bg-blue-500/20 text-blue-400',
  analyzing: 'bg-yellow-500/20 text-yellow-400',
  analyzed: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400',
}

function parseKeyPoints(raw: string | null): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
  } catch {
    // plain text fallback
  }
  return raw.split('\n').filter(Boolean)
}

export default function DocumentPanel({ caseId }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const qc = useQueryClient()

  const { data: docs, isLoading } = useQuery<Document[]>({
    queryKey: ['documents', caseId],
    queryFn: () => listDocuments(caseId),
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadDocument(caseId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents', caseId] })
      toast.success('Document uploaded')
    },
    onError: () => toast.error('Upload failed'),
  })

  const analyzeMutation = useMutation({
    mutationFn: (docId: string) => analyzeDocument(caseId, docId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents', caseId] })
      toast.success('Analysis complete')
    },
    onError: () => toast.error('Analysis failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (docId: string) => deleteDocument(caseId, docId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents', caseId] })
      toast.success('Document deleted')
    },
    onError: () => toast.error('Delete failed'),
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadMutation.mutate(file)
      e.target.value = ''
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) uploadMutation.mutate(file)
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden p-4 gap-4">
      {/* Upload zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-700 bg-gray-800/50 py-8 text-center hover:border-indigo-500 hover:bg-gray-800 transition-all"
      >
        {uploadMutation.isPending ? (
          <Spinner />
        ) : (
          <>
            <svg className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm text-gray-400">
              <span className="text-indigo-400 font-medium">Click to upload</span> or drag & drop
            </p>
            <p className="text-xs text-gray-600">PDF, DOCX, TXT supported</p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {isLoading && (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        )}
        {docs?.length === 0 && !isLoading && (
          <p className="text-center text-sm text-gray-500 py-6">No documents uploaded yet</p>
        )}
        {docs?.map((doc) => (
          <div key={doc.id} className="rounded-xl bg-gray-800 border border-gray-700/50">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-700">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-white">{doc.original_filename}</p>
                <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_COLORS[doc.status]}`}>
                  {doc.status}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {doc.status === 'uploaded' && (
                  <button
                    onClick={() => analyzeMutation.mutate(doc.id)}
                    disabled={analyzeMutation.isPending}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {analyzeMutation.isPending && analyzeMutation.variables === doc.id
                      ? <Spinner size="sm" />
                      : 'Analyze'}
                  </button>
                )}
                {doc.status === 'analyzed' && (
                  <button
                    onClick={() => setExpandedId(expandedId === doc.id ? null : doc.id)}
                    className="rounded-lg bg-gray-700 px-3 py-1 text-xs font-medium text-gray-300 hover:bg-gray-600"
                  >
                    {expandedId === doc.id ? 'Hide' : 'View'}
                  </button>
                )}
                <button
                  onClick={() => deleteMutation.mutate(doc.id)}
                  className="text-gray-500 hover:text-red-400 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Expanded analysis */}
            {expandedId === doc.id && doc.ai_summary && (
              <div className="border-t border-gray-700/50 px-4 py-3 space-y-3">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Summary</h4>
                  <p className="text-sm text-gray-300 leading-relaxed">{doc.ai_summary}</p>
                </div>
                {(() => {
                  const points = parseKeyPoints(doc.ai_key_points)
                  return points.length > 0 ? (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Key Points</h4>
                      <ul className="space-y-1">
                        {points.map((point, i) => (
                          <li key={i} className="flex gap-2 text-sm text-gray-300">
                            <span className="text-indigo-400 flex-shrink-0">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null
                })()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
