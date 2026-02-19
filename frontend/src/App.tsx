import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import CaseDetail from './pages/CaseDetail'
import { useAuthStore } from './store/auth'
import { listCases } from './api/cases'
import Spinner from './components/Spinner'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

function HomeRedirect() {
  const token = useAuthStore((s) => s.token)
  const navigate = useNavigate()

  const { data: cases, isLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: listCases,
    enabled: !!token,
  })

  useEffect(() => {
    if (!isLoading && cases) {
      if (cases.length > 0) {
        navigate(`/cases/${cases[0].id}`, { replace: true })
      }
    }
  }, [cases, isLoading, navigate])

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!cases || cases.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium text-white">Welcome to OpenClaw</p>
          <p className="text-sm mt-1">Create your first case using the sidebar</p>
        </div>
      </div>
    )
  }

  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<HomeRedirect />} />
              <Route path="/cases/:id" element={<CaseDetail />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            border: '1px solid #374151',
          },
        }}
      />
    </QueryClientProvider>
  )
}
