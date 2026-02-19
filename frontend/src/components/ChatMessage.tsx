import ReactMarkdown from 'react-markdown'
import { Message } from '../api/chat'

interface Props {
  message: Message
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="mr-2 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-indigo-700 text-xs font-bold text-white mt-1">
          AI
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'rounded-tr-sm bg-indigo-600 text-white'
            : 'rounded-tl-sm bg-gray-800 text-gray-100'
        }`}
      >
        {isUser ? (
          <span className="whitespace-pre-wrap">{message.content}</span>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
      {isUser && (
        <div className="ml-2 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-600 text-xs font-bold text-white mt-1">
          You
        </div>
      )}
    </div>
  )
}
