import { useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getCase, updateCase, Case } from '../api/cases'
import { useAuthStore } from '../store/auth'
import ChatWindow from '../components/ChatWindow'
import DocumentPanel from '../components/DocumentPanel'
import Spinner from '../components/Spinner'

type Tab = 'chat' | 'documents'

const statusStyles: Record<string, string> = {
  open: 'bg-green-500/20 text-green-400',
  in_progress: 'bg-yellow-500/20 text-yellow-400',
  closed: 'bg-gray-500/20 text-gray-400',
}

const statusLabel: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  closed: 'Closed',
}

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('chat')
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  const canEditStatus = user?.role === 'lawyer' || user?.role === 'admin'

  const { data: caseData, isLoading } = useQuery<Case>({
    queryKey: ['case', id ?? ''],
    queryFn: () => getCase(id!),
    enabled: !!id,
  })

  const { mutate: changeStatus } = useMutation({
    mutationFn: (status: string) =>
      updateCase(id!, { status: status as 'open' | 'in_progress' | 'closed' }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['case', id], updated)
      toast.success('Status updated')
    },
    onError: () => toast.error('Failed to update status'),
  })

  if (!id) return <Navigate to="/" replace />

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!caseData) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-500">
        Case not found
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-700/50 px-6 py-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-white truncate">{caseData.title}</h1>
          {caseData.description && (
            <p className="text-sm text-gray-400 mt-0.5 truncate">{caseData.description}</p>
          )}
        </div>

        {canEditStatus ? (
          <select
            value={caseData.status}
            onChange={(e) => changeStatus(e.target.value)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium cursor-pointer border-0 outline-none ${
              statusStyles[caseData.status] ?? 'bg-gray-700 text-gray-400'
            }`}
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>
        ) : (
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              statusStyles[caseData.status] ?? 'bg-gray-700 text-gray-400'
            }`}
          >
            {statusLabel[caseData.status] ?? caseData.status}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700/50 px-6">
        {(['chat', 'documents'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`mr-1 px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'chat' ? 'Chat' : 'Documents'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {activeTab === 'chat' ? (
          <ChatWindow caseId={id} />
        ) : (
          <DocumentPanel caseId={id} />
        )}
      </div>
    </div>
  )
}
