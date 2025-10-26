'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sun, Moon, Send } from 'lucide-react'

interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
  sources?: string[]
  confidence?: number
  suggestedFollowup?: string
}

interface AgentResponse {
  response: string
  confidence: number
  sources: string[]
  metadata: {
    conversation_context: string
    suggested_followup: string
  }
}

function TypingAnimation() {
  return (
    <div className="flex gap-1 items-center">
      <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  )
}

function BotBubble({ message }: { message: Message }) {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl rounded-tl-none px-4 py-3 max-w-xs md:max-w-md lg:max-w-lg shadow-sm dark:shadow-md backdrop-blur-sm bg-opacity-80 dark:bg-opacity-80">
        <p className="text-sm leading-relaxed">{message.content}</p>
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 border-t border-gray-300 dark:border-gray-600 pt-2">
            <span className="font-semibold">Source:</span> {message.sources.join(', ')}
          </div>
        )}
        {message.suggestedFollowup && (
          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 border-t border-gray-300 dark:border-gray-600 pt-2">
            <span className="font-semibold">Try asking:</span> {message.suggestedFollowup}
          </div>
        )}
      </div>
    </div>
  )
}

function UserBubble({ message }: { message: Message }) {
  return (
    <div className="flex justify-end mb-4">
      <div className="bg-blue-600 dark:bg-blue-700 text-white rounded-2xl rounded-tr-none px-4 py-3 max-w-xs md:max-w-md lg:max-w-lg shadow-sm dark:shadow-md">
        <p className="text-sm leading-relaxed">{message.content}</p>
      </div>
    </div>
  )
}

function ErrorNotification({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-sm bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-100 rounded-lg px-4 py-3 shadow-lg animation-slide-up">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className="text-red-700 dark:text-red-200 hover:text-red-900 dark:hover:text-red-50 flex-shrink-0"
          aria-label="Close error notification"
        >
          ×
        </button>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
      <div className="mb-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">L</div>
        </div>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Welcome to Lyzr Website Chatbot</h2>
      <p className="text-gray-600 dark:text-gray-400 max-w-sm mb-6">
        Ask me anything about Lyzr.ai, our features, pricing, documentation, and more. I'll provide accurate answers from our knowledge base.
      </p>
      <div className="flex flex-col gap-2 text-sm text-gray-500 dark:text-gray-500">
        <div className="flex items-center gap-2">
          <span className="text-blue-600 dark:text-blue-400">→</span>
          <span>Type your question below to get started</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-blue-600 dark:text-blue-400">→</span>
          <span>Press Enter or click Send to submit</span>
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    setError(null)

    try {
      const conversationContext = messages
        .map(msg => `${msg.type === 'user' ? 'User' : 'Bot'}: ${msg.content}`)
        .join('\n')

      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputValue,
          agent_id: '68fdffcaa39d463331e03b9c',
          conversation_context: conversationContext,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response from chatbot')
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to get response')
      }

      const agentResponse = data.response as AgentResponse

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: agentResponse.response || 'I could not generate a response.',
        timestamp: new Date(),
        sources: agentResponse.sources || [],
        confidence: agentResponse.confidence,
        suggestedFollowup: agentResponse.metadata?.suggested_followup,
      }

      setMessages(prev => [...prev, botMessage])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)

      const errorBotMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorBotMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'dark' : ''}`}>
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${isDark ? 'bg-gradient-to-br from-gray-950 via-blue-950 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'}`}>
        <div className="w-full max-w-2xl flex flex-col h-[90vh] md:h-[85vh]">
          {/* Header */}
          <div className={`flex items-center justify-between p-4 md:p-6 rounded-t-2xl shadow-lg backdrop-blur-xl border ${isDark ? 'bg-gray-900/90 border-gray-800' : 'bg-white/90 border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                L
              </div>
              <div>
                <h1 className={`text-lg font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  Lyzr Chatbot
                </h1>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Powered by knowledge base
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isDark ? (
                <Sun size={20} />
              ) : (
                <Moon size={20} />
              )}
            </button>
          </div>

          {/* Chat Area */}
          <ScrollArea
            className={`flex-1 p-4 md:p-6 shadow-lg overflow-hidden backdrop-blur-xl ${isDark ? 'bg-gray-900/90' : 'bg-white/90'}`}
            ref={scrollRef}
          >
            <div className="space-y-4">
              {messages.length === 0 && !isLoading ? (
                <EmptyState />
              ) : (
                <>
                  {messages.map(message => (
                    message.type === 'bot' ? (
                      <BotBubble key={message.id} message={message} />
                    ) : (
                      <UserBubble key={message.id} message={message} />
                    )
                  ))}
                  {isLoading && (
                    <div className="flex justify-start mb-4">
                      <div className={`rounded-2xl rounded-tl-none px-4 py-3 shadow-sm ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                        <TypingAnimation />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <form
            onSubmit={handleSendMessage}
            className={`p-4 md:p-6 rounded-b-2xl shadow-lg border-t backdrop-blur-xl ${isDark ? 'bg-gray-900/90 border-gray-800' : 'bg-white/90 border-gray-200'}`}
          >
            <div className="flex gap-3">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Ask me about Lyzr..."
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                disabled={isLoading}
                className={`flex-1 rounded-full px-4 py-2 text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500' : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'}`}
                aria-label="Type your question"
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className={`p-2 rounded-full transition-colors ${isLoading || !inputValue.trim() ? isDark ? 'bg-gray-800 text-gray-600' : 'bg-gray-200 text-gray-400' : isDark ? 'bg-blue-700 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                aria-label="Send message"
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </div>
      </div>

      {error && (
        <ErrorNotification
          message={error}
          onClose={() => setError(null)}
        />
      )}
    </div>
  )
}
