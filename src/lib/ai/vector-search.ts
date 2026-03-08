import { createClient } from '@supabase/supabase-js'
import type { SemanticSearchResult } from '@/types/ai'

// Use service role for vector search to bypass RLS
// (search results are filtered by status='active' in the SQL function)
function createServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function searchInternshipsByVector(
  queryEmbedding: number[],
  limit = 10,
  threshold = 0.2
): Promise<SemanticSearchResult[]> {
  const supabase = createServiceSupabase()
  const { data, error } = await supabase.rpc('match_internships', {
    query_embedding: JSON.stringify(queryEmbedding),
    match_threshold: threshold,
    match_count: limit,
  })
  if (error) throw error
  return (data || []) as SemanticSearchResult[]
}
