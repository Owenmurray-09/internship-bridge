import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { embedText } from '@/lib/ai/embeddings'
import { searchInternshipsByVector } from '@/lib/ai/vector-search'
import type { SemanticSearchRequest, SemanticSearchResponse } from '@/types/ai'

export async function POST(req: Request) {
  // Auth check
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await req.json()) as SemanticSearchRequest
  const { query, limit = 10, threshold = 0.2 } = body

  if (!query?.trim()) {
    return NextResponse.json(
      { error: 'query is required' },
      { status: 400 }
    )
  }

  try {
    const queryEmbedding = await embedText(query.trim())
    const results = await searchInternshipsByVector(
      queryEmbedding,
      limit,
      threshold
    )

    const response: SemanticSearchResponse = {
      results,
      source: 'semantic',
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Semantic search error:', error)
    return NextResponse.json(
      { error: 'Search failed', results: [] },
      { status: 500 }
    )
  }
}
