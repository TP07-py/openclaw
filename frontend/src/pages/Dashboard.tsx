import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { listCases, Case } from '../api/cases'
import { useAuthStore } from '../store/auth'
import Spinner from '../components/Spinner'

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

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  const { data: cases, isLoading } = useQuery<Case[]>({
    queryKey: ['cases'],
    queryFn: listCases,
  })

  const stats = {
    total: cases?.length ?? 0,
    open: cases?.filter((c) => c.status === 'open').length ?? 0,
    in_progress: cases?.filter((c) => c.status === 'in_progress').length ?? 0,
    closed: cases?.filter((c) => c.status === 'closed').length ?? 0,
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Welcome back, {user?.full_name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
        {[
          { label: 'Total Cases', value: stats.total, color: 'text-white' },
          { label: 'Open', value: stats.open, color: 'text-green-400' },
          { label: 'In Progress', value: stats.in_progress, color: 'text-yellow-400' },
          { label: 'Closed', value: stats.closed, color: 'text-gray-400' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl bg-gray-800 border border-gray-700/50 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Cases list */}
      <div className="rounded-xl bg-gray-800 border border-gray-700/50">
        <div className="px-4 py-3 border-b border-gray-700/50">
          <h2 className="text-sm font-semibold text-white">All Cases</h2>
        </div>

        {isLoading && (
          <div className="flex justify-center py-10">
            <Spinner size="lg" />
          </div>
        )}

        {!isLoading && (!cases || cases.length === 0) && (
          <p className="py-10 text-center text-sm text-gray-500">
            No cases yet. Create your first case using the sidebar.
          </p>
        )}

        {cases?.map((c) => (
          <button
            key={c.id}
            onClick={() => navigate(`/cases/${c.id}`)}
            className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-700/50 last:border-0 hover:bg-gray-700/50 transition-colors text-left"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{c.title}</p>
              {c.description && (
                <p className="text-xs text-gray-500 truncate mt-0.5">{c.description}</p>
              )}
            </div>
            <span
              className={`ml-4 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                statusStyles[c.status] ?? 'bg-gray-700 text-gray-400'
              }`}
            >
              {statusLabel[c.status] ?? c.status}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
