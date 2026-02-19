import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { listMessages, sendMessage, Message } from '../api/chat'
import ChatMessage from './ChatMessage'
import Spinner from './Spinner'

interface Props {
  caseId: string
}

export default function ChatWindow({ caseId }: Props) {
  const [input, setInput] = useState('')
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const qc = useQueryClient()

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ['messages', caseId],
    queryFn: () => listMessages(caseId),
  })

  const allMessages = [...(messages ?? []), ...optimisticMessages]

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [allMessages.length])

  const mutation = useMutation({
    mutationFn: (content: string) => sendMessage(caseId, { content }),
    onSuccess: () => {
      setOptimisticMessages([])
      qc.invalidateQueries({ queryKey: ['messages', caseId] })
    },
    onError: () => {
      setOptimisticMessages([])
      toast.error('Failed to send message')
    },
  })

  const handleSend = () => {
    const text = input.trim()
    if (!text || mutation.isPending) return
    setInput('')

    const optimistic: Message = {
      id: `optimistic-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    }
    setOptimisticMessages([optimistic])

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = '36px'
    }

    mutation.mutate(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading && (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        )}
        {!isLoading && allMessages.length === 0 && (
          <div className="flex h-full items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-lg font-medium">Start a conversation</p>
              <p className="text-sm mt-1">Ask a question about this case</p>
            </div>
          </div>
        )}
        {allMessages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {mutation.isPending && (
          <div className="flex justify-start mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-700 text-xs font-bold text-white mr-2 mt-1">
              AI
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-gray-800 px-4 py-3">
              <Spinner size="sm" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-700/50 px-4 py-3">
        <div className="flex items-end gap-2 rounded-xl bg-gray-800 px-3 py-2 ring-1 ring-gray-700 focus-within:ring-indigo-500 transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask a legal question… (Enter to send, Shift+Enter for newline)"
            className="flex-1 resize-none bg-transparent py-1 text-sm text-white placeholder-gray-500 outline-none"
            style={{ height: '36px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || mutation.isPending}
            className="flex-shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-40 transition-colors"
          >
            Send
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-600">Enter to send · Shift+Enter for newline</p>
      </div>
    </div>
  )
}
