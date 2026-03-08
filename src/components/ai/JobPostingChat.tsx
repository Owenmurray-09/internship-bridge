'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Bot, Send, Sparkles, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useTranslations } from '@/lib/i18n'

export interface GeneratedPosting {
  title: string
  description: string
  responsibilities?: string[]
  requirements?: string[]
  skills_required?: string[]
  location?: string
  remote_allowed?: boolean
  duration_months?: string | null
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface JobPostingChatProps {
  companyName?: string
  industry?: string
  onApplyPosting: (posting: GeneratedPosting) => void
}

function parsePostingFromMessage(content: string): GeneratedPosting | null {
  const match = content.match(/```json\s*([\s\S]*?)```/)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[1])
    if (parsed.title && parsed.description) return parsed as GeneratedPosting
    return null
  } catch {
    return null
  }
}

export default function JobPostingChat({
  companyName,
  industry,
  onApplyPosting,
}: JobPostingChatProps) {
  const { t } = useTranslations('ai.jobPosting')
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [applied, setApplied] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || streaming) return

    const userMessage: ChatMessage = { role: 'user', content: text }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setStreaming(true)
    setApplied(false)

    try {
      const res = await fetch('/api/ai/chat/job-posting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          companyName,
          industry,
        }),
      })

      if (!res.ok) throw new Error(`Chat failed: ${res.status}`)

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response stream')

      const decoder = new TextDecoder()
      let assistantContent = ''

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break
            try {
              const parsed = JSON.parse(data)
              assistantContent += parsed.text
              setMessages((prev) => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: assistantContent,
                }
                return updated
              })
            } catch {
              // skip malformed chunks
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: t('error') },
      ])
    } finally {
      setStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Find the latest generated posting in messages
  const latestPosting = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') {
        const posting = parsePostingFromMessage(messages[i].content)
        if (posting) return posting
      }
    }
    return null
  })()

  const handleApply = () => {
    if (latestPosting) {
      onApplyPosting(latestPosting)
      setApplied(true)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 flex items-center gap-2 bg-purple-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors z-50"
      >
        <Sparkles className="h-5 w-5" />
        <span className="font-medium">{t('toggle')}</span>
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 max-h-[600px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-purple-50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-purple-600" />
          <span className="font-semibold text-purple-900">{t('title')}</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[400px]">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm mt-8">
            <Bot className="h-10 w-10 mx-auto mb-3 text-purple-300" />
            <p>{t('welcome')}</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {msg.role === 'assistant'
                ? msg.content.replace(/```json[\s\S]*?```/g, t('postingGenerated'))
                : msg.content}
            </div>
          </div>
        ))}
        {streaming && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-400">
              {t('thinking')}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Apply button */}
      {latestPosting && !streaming && (
        <div className="px-4 py-2 border-t bg-purple-50">
          <Button
            type="button"
            onClick={handleApply}
            disabled={applied}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {applied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                {t('applied')}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {t('applyToForm')}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('placeholder')}
            rows={2}
            className="resize-none text-sm"
            disabled={streaming}
          />
          <Button
            type="button"
            size="icon"
            onClick={sendMessage}
            disabled={!input.trim() || streaming}
            className="shrink-0 bg-purple-600 hover:bg-purple-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
