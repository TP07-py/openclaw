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
            EL
          </div>
          <span className="font-semibold text-white">EasyLAW</span>
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

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 pb-4">
          {/* Dashboard link */}
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors mb-1 ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-400'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </NavLink>

          {/* Admin link (admin only) */}
          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors mb-2 ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Admin
            </NavLink>
          )}

          {/* Cases section */}
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
        <div className="border-t border-gray-700/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `min-w-0 text-sm truncate transition-colors ${
                  isActive ? 'text-indigo-400' : 'text-gray-400 hover:text-white'
                }`
              }
            >
              {user?.full_name || user?.email}
            </NavLink>
            <button
              onClick={logout}
              className="ml-2 shrink-0 text-xs text-gray-500 hover:text-red-400 transition-colors"
            >
              Logout
            </button>
          </div>
          <p className="text-xs text-gray-600 truncate mt-0.5">{user?.email}</p>
        </div>
      </aside>

      {showModal && (
        <NewCaseModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}
    </>
  )
}
