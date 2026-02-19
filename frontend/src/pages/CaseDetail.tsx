import { useEffect, useState } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getCase, updateCase, assignCase, deleteCase as deleteCaseApi, AssignCasePayload, Case } from '../api/cases'
import { listUsers, UserPublic } from '../api/users'
import { useAuthStore } from '../store/auth'
import ChatWindow from '../components/ChatWindow'
import DocumentPanel from '../components/DocumentPanel'
import Spinner from '../components/Spinner'

type Tab = 'chat' | 'documents' | 'details'

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

const roleLabel: Record<string, string> = {
  admin: 'Admin',
  lawyer: 'Lawyer',
  client: 'Client',
}

function UserCard({ userId, label }: { userId: string | null; label: string }) {
  const { data: user, isLoading } = useQuery<UserPublic>({
    queryKey: ['user', userId],
    queryFn: () => listUsers().then((u) => u.find((x) => x.id === userId)!),
    enabled: !!userId,
  })

  return (
    <div className="rounded-lg bg-gray-700/50 px-4 py-3">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      {!userId && <p className="text-sm text-gray-500 italic">Not assigned</p>}
      {userId && isLoading && <Spinner size="sm" />}
      {userId && user && (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600/30 text-indigo-400 text-xs font-bold">
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user.full_name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          <span className="ml-auto shrink-0 rounded-full bg-indigo-600/20 text-indigo-400 px-2 py-0.5 text-xs font-medium">
            {roleLabel[user.role] ?? user.role}
          </span>
        </div>
      )}
    </div>
  )
}

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('chat')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [selectedLawyerId, setSelectedLawyerId] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  const isAdmin = user?.role === 'admin'
  const canEditStatus = user?.role === 'lawyer' || isAdmin

  const { data: caseData, isLoading } = useQuery<Case>({
    queryKey: ['case', id ?? ''],
    queryFn: () => getCase(id!),
    enabled: !!id,
  })

  const { data: users } = useQuery<UserPublic[]>({
    queryKey: ['users'],
    queryFn: listUsers,
    enabled: isAdmin,
  })

  // Sync assignment selects when caseData loads
  useEffect(() => {
    if (caseData) {
      setSelectedLawyerId(caseData.lawyer_id ?? '')
      setSelectedClientId(caseData.client_id ?? '')
    }
  }, [caseData?.lawyer_id, caseData?.client_id])

  const { mutate: changeStatus } = useMutation({
    mutationFn: (status: string) =>
      updateCase(id!, { status: status as 'open' | 'in_progress' | 'closed' }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['case', id], updated)
      toast.success('Status updated')
    },
    onError: () => toast.error('Failed to update status'),
  })

  const { mutate: doDelete, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteCaseApi(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] })
      toast.success('Case deleted')
      navigate('/dashboard')
    },
    onError: () => toast.error('Failed to delete case'),
  })

  const { mutate: assign, isPending: isAssigning } = useMutation({
    mutationFn: (payload: AssignCasePayload) => assignCase(id!, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(['case', id], updated)
      queryClient.invalidateQueries({ queryKey: ['user'] })
      toast.success('Assignment updated')
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Assignment failed'
      toast.error(message)
    },
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

  const lawyers = users?.filter((u) => u.role === 'lawyer') ?? []
  const clients = users?.filter((u) => u.role === 'client') ?? []

  const tabs: { key: Tab; label: string }[] = [
    { key: 'chat', label: 'Chat' },
    { key: 'documents', label: 'Documents' },
    { key: 'details', label: 'Details' },
  ]

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

        <div className="flex items-center gap-2 shrink-0">
          {/* Custom status select */}
          {canEditStatus ? (
            <div className={`relative rounded-full ${statusStyles[caseData.status] ?? 'bg-gray-700 text-gray-400'}`}>
              <select
                value={caseData.status}
                onChange={(e) => changeStatus(e.target.value)}
                className="appearance-none cursor-pointer bg-transparent pl-3 pr-7 py-1 text-xs font-medium outline-none"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="closed">Closed</option>
              </select>
              <svg
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 opacity-70"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          ) : (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[caseData.status] ?? 'bg-gray-700 text-gray-400'}`}>
              {statusLabel[caseData.status] ?? caseData.status}
            </span>
          )}

          {/* Delete button (admin only) */}
          {isAdmin && (
            confirmDelete ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => doDelete()}
                  disabled={isDeleting}
                  className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50"
                >
                  {isDeleting ? <Spinner size="sm" /> : 'Confirm'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg bg-gray-700 px-2.5 py-1 text-xs font-medium text-gray-300 hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                title="Delete case"
                className="text-gray-500 hover:text-red-400 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700/50 px-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`mr-1 px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 ${
              activeTab === tab.key
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {activeTab === 'chat' && <ChatWindow caseId={id} />}
        {activeTab === 'documents' && <DocumentPanel caseId={id} />}
        {activeTab === 'details' && (
          <div className="overflow-y-auto p-6 space-y-6">
            {/* Case info */}
            <div className="rounded-xl bg-gray-800 border border-gray-700/50 p-5 space-y-4">
              <h2 className="text-sm font-semibold text-white">Case Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[caseData.status] ?? 'bg-gray-700 text-gray-400'}`}>
                    {statusLabel[caseData.status] ?? caseData.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Created</p>
                  <p className="text-sm text-white">
                    {new Date(caseData.created_at).toLocaleDateString(undefined, {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Last updated</p>
                  <p className="text-sm text-white">
                    {new Date(caseData.updated_at).toLocaleDateString(undefined, {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Case ID</p>
                  <p className="text-xs text-gray-500 font-mono truncate">{caseData.id}</p>
                </div>
              </div>
              {caseData.description && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Description</p>
                  <p className="text-sm text-gray-300">{caseData.description}</p>
                </div>
              )}
            </div>

            {/* People */}
            <div className="rounded-xl bg-gray-800 border border-gray-700/50 p-5 space-y-3">
              <h2 className="text-sm font-semibold text-white">People</h2>
              <UserCard userId={caseData.lawyer_id} label="Lawyer" />
              <UserCard userId={caseData.client_id} label="Client" />
            </div>

            {/* Assignment (admin only) */}
            {isAdmin && (
              <div className="rounded-xl bg-gray-800 border border-gray-700/50 p-5 space-y-4">
                <h2 className="text-sm font-semibold text-white">Assign</h2>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Lawyer</label>
                    <div className="flex gap-2">
                      <select
                        value={selectedLawyerId}
                        onChange={(e) => setSelectedLawyerId(e.target.value)}
                        className="flex-1 rounded-lg bg-gray-700 px-3 py-2 text-sm text-white outline-none"
                      >
                        <option value="">— Not assigned —</option>
                        {lawyers.map((u) => (
                          <option key={u.id} value={u.id}>{u.full_name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => assign({ lawyer_id: selectedLawyerId || undefined })}
                        disabled={isAssigning || !selectedLawyerId}
                        className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                      >
                        Assign
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Client</label>
                    <div className="flex gap-2">
                      <select
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                        className="flex-1 rounded-lg bg-gray-700 px-3 py-2 text-sm text-white outline-none"
                      >
                        <option value="">— Not assigned —</option>
                        {clients.map((u) => (
                          <option key={u.id} value={u.id}>{u.full_name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => assign({ client_id: selectedClientId || undefined })}
                        disabled={isAssigning || !selectedClientId}
                        className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                      >
                        Assign
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
