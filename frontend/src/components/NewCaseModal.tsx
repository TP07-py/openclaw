import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { createCase } from '../api/cases'
import Spinner from './Spinner'

interface Props {
  onClose: () => void
  onCreated: (id: string) => void
}

export default function NewCaseModal({ onClose, onCreated }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => createCase({ title: title.trim(), description: description.trim() || undefined }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['cases'] })
      toast.success('Case created')
      onCreated(data.id)
    },
    onError: () => toast.error('Failed to create case'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    mutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-gray-800 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-xl font-semibold text-white">New Case</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-gray-400">Title *</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg bg-gray-700 px-3 py-2 text-white placeholder-gray-500 outline-none ring-1 ring-gray-600 focus:ring-indigo-500"
              placeholder="e.g. Smith v. Jones 2024"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-400">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg bg-gray-700 px-3 py-2 text-white placeholder-gray-500 outline-none ring-1 ring-gray-600 focus:ring-indigo-500"
              placeholder="Brief case description (optional)"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || mutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {mutation.isPending && <Spinner size="sm" />}
              Create Case
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
