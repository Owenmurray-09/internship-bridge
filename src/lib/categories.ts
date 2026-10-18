// Fixed internship categories. Keys are stored in internships.category (enforced
// by a CHECK constraint); labels live in i18n under internships.categories.<key>.
export const INTERNSHIP_CATEGORIES = [
  'technology',
  'food_hospitality',
  'retail',
  'healthcare',
  'arts_media',
  'sports_recreation',
  'education',
  'trades',
  'business_office',
  'other',
] as const

export type InternshipCategory = (typeof INTERNSHIP_CATEGORIES)[number]

export function isInternshipCategory(value: unknown): value is InternshipCategory {
  return typeof value === 'string' && (INTERNSHIP_CATEGORIES as readonly string[]).includes(value)
}

// Skill tags are short labels ("Customer service", "Excel"), not sentences
export const MAX_SKILL_LENGTH = 40
export const MAX_SKILLS = 10

export function normalizeSkill(raw: string): string | null {
  const s = raw.trim().replace(/\s+/g, ' ').replace(/[.;,]+$/, '')
  if (!s || s.length > MAX_SKILL_LENGTH) return null
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Normalize, drop invalid entries, and de-duplicate case-insensitively (first spelling wins)
export function normalizeSkills(raw: string[], max = MAX_SKILLS): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const r of raw) {
    const s = normalizeSkill(r)
    if (!s || seen.has(s.toLowerCase())) continue
    seen.add(s.toLowerCase())
    out.push(s)
    if (out.length >= max) break
  }
  return out
}
