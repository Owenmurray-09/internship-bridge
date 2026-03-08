import { useEffect, useRef, useState } from 'react'
import type { SemanticSearchResult } from '@/types/ai'

interface UseSemanticSearchOptions {
  query: string
  fuseResultCount: number
  enabled?: boolean
  debounceMs?: number
  fuseGateThreshold?: number
}

export function useSemanticSearch({
  query,
  fuseResultCount,
  enabled = true,
  debounceMs = 600,
  fuseGateThreshold = 5,
}: UseSemanticSearchOptions) {
  const [results, setResults] = useState<SemanticSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    setResults([])

    if (!enabled) return
    if (query.trim().length < 3) return
    if (fuseResultCount >= fuseGateThreshold) return // smart gating

    const timer = setTimeout(async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)

      try {
        const res = await fetch('/api/ai/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: query.trim() }),
          signal: controller.signal,
        })

        if (!res.ok) throw new Error(`Search failed: ${res.status}`)

        const data = await res.json()
        setResults(data.results || [])
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          console.error('Semantic search error:', e)
        }
      } finally {
        setLoading(false)
      }
    }, debounceMs)

    return () => {
      clearTimeout(timer)
      abortRef.current?.abort()
    }
  }, [query, fuseResultCount, enabled, debounceMs, fuseGateThreshold])

  return { results, loading }
}
