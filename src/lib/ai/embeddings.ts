import { getOpenAI } from './client'

export async function embedText(text: string): Promise<number[]> {
  const response = await getOpenAI().embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  return response.data[0].embedding
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []
  const response = await getOpenAI().embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  })
  return response.data.map((d) => d.embedding)
}

export function buildInternshipEmbeddingText(internship: {
  title: string
  description: string
  requirements?: string[] | null
  responsibilities?: string[] | null
  skills_required?: string[] | null
  location?: string | null
  company_name?: string | null
  industry?: string | null
}): string {
  return [
    internship.title,
    internship.description,
    internship.company_name,
    internship.industry,
    internship.location,
    ...(internship.skills_required || []),
    ...(internship.requirements || []),
    ...(internship.responsibilities || []),
  ]
    .filter(Boolean)
    .join(' ')
}

export function buildStudentProfileEmbeddingText(profile: {
  bio?: string | null
  email?: string | null
  graduation_year?: number | null
  gender?: string | null
}): string {
  return [profile.bio, profile.email, profile.graduation_year?.toString()]
    .filter(Boolean)
    .join(' ')
}

export function buildCompanyProfileEmbeddingText(profile: {
  company_name: string
  description?: string | null
  industry?: string | null
  location?: string | null
}): string {
  return [
    profile.company_name,
    profile.description,
    profile.industry,
    profile.location,
  ]
    .filter(Boolean)
    .join(' ')
}
