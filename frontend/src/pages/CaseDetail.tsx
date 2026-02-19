import { useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCase, Case } from '../api/cases'
import ChatWindow from '../components/ChatWindow'
import DocumentPanel from '../components/DocumentPanel'
import Spinner from '../components/Spinner'

type Tab = 'chat' | 'documents'

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('chat')

  if (!id) return <Navigate to="/" replace />

  const { data: caseData, isLoading } = useQuery<Case>({
    queryKey: ['case', id],
    queryFn: () => getCase(id),
  })

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
      <div className="border-b border-gray-700/50 px-6 py-4">
        <h1 className="text-lg font-semibold text-white truncate">{caseData.title}</h1>
        {caseData.description && (
          <p className="text-sm text-gray-400 mt-0.5 truncate">{caseData.description}</p>
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
