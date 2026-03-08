export interface EmbedRequest {
  type: 'internship' | 'student_profile' | 'company_profile'
  id?: string
  backfill?: boolean
}

export interface EmbedResponse {
  success: boolean
  embedded: number
  errors?: string[]
}

export interface SemanticSearchRequest {
  query: string
  limit?: number
  threshold?: number
}

export interface SemanticSearchResult {
  id: string
  title: string
  similarity: number
}

export interface SemanticSearchResponse {
  results: SemanticSearchResult[]
  source: 'semantic'
}
