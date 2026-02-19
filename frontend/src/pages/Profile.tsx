import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { updateMe, UpdateMePayload } from '../api/auth'
import { useAuthStore } from '../store/auth'
import Spinner from '../components/Spinner'

const roleLabel: Record<string, string> = {
  admin: 'Admin',
  lawyer: 'Lawyer',
  client: 'Client',
}

export default function Profile() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [newPassword, setNewPassword] = useState('')

  const { mutate: save, isPending } = useMutation({
    mutationFn: (payload: UpdateMePayload) => updateMe(payload),
    onSuccess: (updated) => {
      setUser(updated)
      toast.success('Profile updated')
      setNewPassword('')
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Update failed'
      toast.error(message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword && newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    const payload: UpdateMePayload = {}
    if (fullName !== user?.full_name) payload.full_name = fullName
    if (email !== user?.email) payload.email = email
    if (newPassword) payload.password = newPassword
    if (Object.keys(payload).length === 0) {
      toast('No changes to save')
      return
    }
    save(payload)
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your account details</p>
      </div>

      <div className="max-w-md">
        <form onSubmit={handleSubmit} className="rounded-xl bg-gray-800 border border-gray-700/50 p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-indigo-600/20 text-indigo-400 px-2.5 py-0.5 text-xs font-medium capitalize">
              {user?.role ? roleLabel[user.role] : ''}
            </span>
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-400">Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg bg-gray-700 px-3 py-2 text-white placeholder-gray-500 outline-none ring-1 ring-gray-600 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-gray-700 px-3 py-2 text-white placeholder-gray-500 outline-none ring-1 ring-gray-600 focus:ring-indigo-500"
            />
          </div>

          <hr className="border-gray-700" />

          <div>
            <label className="mb-1 block text-sm text-gray-400">
              New password{' '}
              <span className="text-gray-600">(leave blank to keep current)</span>
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 8 characters"
              className="w-full rounded-lg bg-gray-700 px-3 py-2 text-white placeholder-gray-500 outline-none ring-1 ring-gray-600 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {isPending && <Spinner size="sm" />}
            Save changes
          </button>
        </form>
      </div>
    </div>
  )
}
