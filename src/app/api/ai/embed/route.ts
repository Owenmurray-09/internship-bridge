import { NextResponse } from 'next/server'
import {
  embedText,
  embedTexts,
  buildInternshipEmbeddingText,
  buildStudentProfileEmbeddingText,
  buildCompanyProfileEmbeddingText,
} from '@/lib/ai/embeddings'
import type { EmbedRequest, EmbedResponse } from '@/types/ai'
import { createServerSupabase } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

// Service role client for writing embeddings (bypasses RLS)
function createServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: Request) {
  // Auth check
  const authSupabase = await createServerSupabase()
  const {
    data: { user },
  } = await authSupabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await req.json()) as EmbedRequest
  const { type, id, backfill } = body

  if (!type) {
    return NextResponse.json(
      { error: 'type is required' },
      { status: 400 }
    )
  }

  const supabase = createServiceSupabase()

  try {
    if (backfill) {
      const result = await backfillEmbeddings(supabase, type)
      return NextResponse.json(result)
    }

    if (!id) {
      return NextResponse.json(
        { error: 'id is required when not backfilling' },
        { status: 400 }
      )
    }

    const result = await embedSingleRecord(supabase, type, id)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Embed error:', error)
    return NextResponse.json(
      { success: false, embedded: 0, errors: [(error as Error).message] },
      { status: 500 }
    )
  }
}

async function embedSingleRecord(
  supabase: ReturnType<typeof createServiceSupabase>,
  type: EmbedRequest['type'],
  id: string
): Promise<EmbedResponse> {
  let text: string
  let table: string

  if (type === 'internship') {
    table = 'internships'
    const { data, error } = await supabase
      .from('internships')
      .select('*, company_profiles(company_name, industry)')
      .eq('id', id)
      .single()
    if (error || !data) throw new Error(`Internship ${id} not found`)
    const company = data.company_profiles as
      | { company_name: string; industry?: string }
      | null
    text = buildInternshipEmbeddingText({
      ...data,
      company_name: company?.company_name,
      industry: company?.industry,
    })
  } else if (type === 'student_profile') {
    table = 'student_profiles'
    const { data, error } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('id', id)
      .single()
    if (error || !data) throw new Error(`Student profile ${id} not found`)
    text = buildStudentProfileEmbeddingText(data)
  } else {
    table = 'company_profiles'
    const { data, error } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('id', id)
      .single()
    if (error || !data) throw new Error(`Company profile ${id} not found`)
    text = buildCompanyProfileEmbeddingText(data)
  }

  if (!text.trim()) {
    return { success: true, embedded: 0, errors: ['No text to embed'] }
  }

  const embedding = await embedText(text)

  const { error: updateError } = await supabase
    .from(table)
    .update({ embedding: JSON.stringify(embedding) })
    .eq('id', id)

  if (updateError) throw updateError

  return { success: true, embedded: 1 }
}

async function backfillEmbeddings(
  supabase: ReturnType<typeof createServiceSupabase>,
  type: EmbedRequest['type']
): Promise<EmbedResponse> {
  const errors: string[] = []
  let embedded = 0

  if (type === 'internship') {
    const { data: internships } = await supabase
      .from('internships')
      .select('*, company_profiles(company_name, industry)')
      .is('embedding', null)

    if (!internships?.length) {
      return { success: true, embedded: 0 }
    }

    const texts = internships.map((i) => {
      const company = i.company_profiles as
        | { company_name: string; industry?: string }
        | null
      return buildInternshipEmbeddingText({
        ...i,
        company_name: company?.company_name,
        industry: company?.industry,
      })
    })

    const embeddings = await embedTexts(texts)

    for (let idx = 0; idx < internships.length; idx++) {
      const { error } = await supabase
        .from('internships')
        .update({ embedding: JSON.stringify(embeddings[idx]) })
        .eq('id', internships[idx].id)
      if (error) {
        errors.push(`Failed to update ${internships[idx].id}: ${error.message}`)
      } else {
        embedded++
      }
    }
  } else if (type === 'student_profile') {
    const { data: profiles } = await supabase
      .from('student_profiles')
      .select('*')
      .is('embedding', null)

    if (!profiles?.length) return { success: true, embedded: 0 }

    const texts = profiles.map(buildStudentProfileEmbeddingText)
    const embeddings = await embedTexts(texts)

    for (let idx = 0; idx < profiles.length; idx++) {
      const { error } = await supabase
        .from('student_profiles')
        .update({ embedding: JSON.stringify(embeddings[idx]) })
        .eq('id', profiles[idx].id)
      if (error) errors.push(`Failed: ${profiles[idx].id}`)
      else embedded++
    }
  } else {
    const { data: profiles } = await supabase
      .from('company_profiles')
      .select('*')
      .is('embedding', null)

    if (!profiles?.length) return { success: true, embedded: 0 }

    const texts = profiles.map(buildCompanyProfileEmbeddingText)
    const embeddings = await embedTexts(texts)

    for (let idx = 0; idx < profiles.length; idx++) {
      const { error } = await supabase
        .from('company_profiles')
        .update({ embedding: JSON.stringify(embeddings[idx]) })
        .eq('id', profiles[idx].id)
      if (error) errors.push(`Failed: ${profiles[idx].id}`)
      else embedded++
    }
  }

  return {
    success: errors.length === 0,
    embedded,
    errors: errors.length > 0 ? errors : undefined,
  }
}
