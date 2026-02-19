import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listCases, Case } from '../api/cases'
import { useAuthStore } from '../store/auth'
import NewCaseModal from './NewCaseModal'
import Spinner from './Spinner'

export default function Sidebar() {
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)

  const { data: cases, isLoading } = useQuery<Case[]>({
    queryKey: ['cases'],
    queryFn: listCases,
  })

  const handleCreated = (id: string) => {
    setShowModal(false)
    navigate(`/cases/${id}`)
  }

  return (
    <>
      <aside className="flex h-screen w-64 flex-col bg-gray-900 border-r border-gray-700/50">
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-700/50">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm">
            OC
          </div>
          <span className="font-semibold text-white">OpenClaw</span>
        </div>

        {/* New Case button */}
        <div className="px-4 py-3">
          <button
            onClick={() => setShowModal(true)}
            className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            + New Case
          </button>
        </div>

        {/* Cases list */}
        <nav className="flex-1 overflow-y-auto px-2 pb-4">
          <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
            Cases
          </p>
          {isLoading && (
            <div className="flex justify-center py-6">
              <Spinner size="sm" />
            </div>
          )}
          {cases?.length === 0 && (
            <p className="px-3 py-2 text-sm text-gray-500">No cases yet</p>
          )}
          {cases?.map((c) => (
            <NavLink
              key={c.id}
              to={`/cases/${c.id}`}
              className={({ isActive }) =>
                `block truncate rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              {c.title}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-gray-700/50 px-4 py-3 flex items-center justify-between">
          <span className="truncate text-sm text-gray-400">{user?.email}</span>
          <button
            onClick={logout}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {showModal && (
        <NewCaseModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}
    </>
  )
}
