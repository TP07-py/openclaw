import { Navigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { listUsers, updateUser, UserPublic, UpdateUserPayload } from '../api/users'
import { useAuthStore } from '../store/auth'
import Spinner from '../components/Spinner'

export default function Admin() {
  const currentUser = useAuthStore((s) => s.user)
  const qc = useQueryClient()

  if (currentUser?.role !== 'admin') return <Navigate to="/dashboard" replace />

  const { data: users, isLoading } = useQuery<UserPublic[]>({
    queryKey: ['users'],
    queryFn: listUsers,
  })

  const { mutate: save, isPending } = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      updateUser(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('User updated')
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Update failed'
      toast.error(message)
      qc.invalidateQueries({ queryKey: ['users'] })
    },
  })

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Admin</h1>
        <p className="text-sm text-gray-400 mt-1">Manage users and roles</p>
      </div>

      <div className="rounded-xl bg-gray-800 border border-gray-700/50">
        <div className="px-4 py-3 border-b border-gray-700/50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Users</h2>
          {users && (
            <span className="text-xs text-gray-500">{users.length} total</span>
          )}
        </div>

        {isLoading && (
          <div className="flex justify-center py-10">
            <Spinner size="lg" />
          </div>
        )}

        {users?.map((u) => {
          const isSelf = u.id === currentUser?.id
          return (
            <div
              key={u.id}
              className="flex items-center gap-3 px-4 py-3 border-b border-gray-700/50 last:border-0"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600/30 text-indigo-400 text-xs font-bold">
                {u.full_name.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">
                  {u.full_name}
                  {isSelf && <span className="ml-1 text-xs text-gray-500">(you)</span>}
                </p>
                <p className="text-xs text-gray-500 truncate">{u.email}</p>
              </div>

              <select
                value={u.role}
                disabled={isSelf || isPending}
                onChange={(e) =>
                  save({ id: u.id, payload: { role: e.target.value as UserPublic['role'] } })
                }
                className="shrink-0 rounded-lg bg-gray-700 px-2 py-1 text-xs text-white outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="client">Client</option>
                <option value="lawyer">Lawyer</option>
                <option value="admin">Admin</option>
              </select>

              <button
                disabled={isSelf || isPending}
                onClick={() => save({ id: u.id, payload: { is_active: !u.is_active } })}
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  u.is_active
                    ? 'bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400'
                    : 'bg-red-500/20 text-red-400 hover:bg-green-500/20 hover:text-green-400'
                }`}
              >
                {u.is_active ? 'Active' : 'Inactive'}
              </button>
            </div>
          )
        })}
      </div>

      <p className="mt-4 text-xs text-gray-500">
        To assign a lawyer or client to a case, open the case → Details tab.
      </p>
    </div>
  )
}
