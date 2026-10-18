import type OpenAI from 'openai'
import { INTERNSHIP_CATEGORIES, isInternshipCategory, normalizeSkills, type InternshipCategory } from '@/lib/categories'
import { INTERNSHIP_TAGGING_PROMPT } from '@/lib/ai/prompts'

export interface TaggingInput {
  title: string
  description: string
  requirements?: string[] | null
  responsibilities?: string[] | null
  skills?: string[] | null
}

export interface TaggingResult {
  category: InternshipCategory
  skills: string[]
}

// Suggest a category and short skill tags for an internship. knownSkills are the
// tags already used on the platform, which the model is asked to reuse.
export async function suggestInternshipTags(
  openai: OpenAI,
  input: TaggingInput,
  knownSkills: string[] = []
): Promise<TaggingResult> {
  const posting = [
    `Title: ${input.title}`,
    `Description: ${input.description}`,
    input.responsibilities?.length ? `Responsibilities: ${input.responsibilities.join('; ')}` : '',
    input.requirements?.length ? `Requirements: ${input.requirements.join('; ')}` : '',
    input.skills?.length ? `Skills mentioned: ${input.skills.join('; ')}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_tokens: 300,
    messages: [
      { role: 'system', content: INTERNSHIP_TAGGING_PROMPT(INTERNSHIP_CATEGORIES, knownSkills.slice(0, 150)) },
      { role: 'user', content: posting.slice(0, 8000) },
    ],
  })

  let parsed: { category?: unknown; skills?: unknown } = {}
  try {
    parsed = JSON.parse(res.choices[0]?.message?.content || '{}')
  } catch {
    // fall through to defaults
  }

  return {
    category: isInternshipCategory(parsed.category) ? parsed.category : 'other',
    skills: normalizeSkills(Array.isArray(parsed.skills) ? parsed.skills.filter((s): s is string => typeof s === 'string') : [], 8),
  }
}
