import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { register, login, getMe } from '../api/auth'
import { useAuthStore } from '../store/auth'
import Spinner from '../components/Spinner'

export default function Register() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'lawyer' | 'client'>('lawyer')
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      await register({ email, password, full_name: fullName, role })
      const tokenData = await login({ username: email, password })
      const user = await getMe()
      setAuth(tokenData.access_token, user)
      toast.success('Account created!')
      navigate('/')
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Registration failed'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-lg">
            OC
          </div>
          <h1 className="text-2xl font-bold text-white">OpenClaw</h1>
          <p className="mt-1 text-sm text-gray-400">Legal AI Assistant</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-gray-800 p-6 shadow-2xl space-y-4">
          <h2 className="text-lg font-semibold text-white">Create account</h2>

          <div>
            <label className="mb-1 block text-sm text-gray-400">Full name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg bg-gray-700 px-3 py-2 text-white placeholder-gray-500 outline-none ring-1 ring-gray-600 focus:ring-indigo-500"
              placeholder="Jane Smith"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-400">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-gray-700 px-3 py-2 text-white placeholder-gray-500 outline-none ring-1 ring-gray-600 focus:ring-indigo-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-400">I am a</label>
            <div className="flex gap-2">
              {(['lawyer', 'client'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors capitalize ${
                    role === r
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            {role === 'client' && (
              <p className="mt-1 text-xs text-yellow-500">Clients cannot create cases — only lawyers can.</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-400">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-gray-700 px-3 py-2 text-white placeholder-gray-500 outline-none ring-1 ring-gray-600 focus:ring-indigo-500"
              placeholder="Min 8 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {loading && <Spinner size="sm" />}
            Create account
          </button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
