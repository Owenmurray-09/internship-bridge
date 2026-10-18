import Fuse from 'fuse.js'
import type { Internship } from '@/types/database'

export interface SearchableInternship {
  internship: Internship
  title: string
  description: string
  location: string
  company_name: string
  industry: string
  skills: string
  requirements: string
  responsibilities: string
}

export function createInternshipSearch(internships: Internship[]) {
  const docs: SearchableInternship[] = internships.map((i) => {
    const company = (i as unknown as Record<string, unknown>).company_profiles as
      | { company_name: string; location?: string; industry?: string }
      | undefined
    return {
      internship: i,
      title: i.title,
      description: i.description,
      location: i.location || '',
      company_name: company?.company_name || '',
      industry: company?.industry || '',
      skills: (i.skills_required || []).join(' '),
      requirements: (i.requirements || []).join(' '),
      responsibilities: (i.responsibilities || []).join(' '),
    }
  })

  return new Fuse(docs, {
    keys: [
      { name: 'title', weight: 1.0 },
      { name: 'skills', weight: 0.8 },
      { name: 'company_name', weight: 0.7 },
      { name: 'location', weight: 0.6 },
      { name: 'industry', weight: 0.5 },
      { name: 'requirements', weight: 0.4 },
      { name: 'responsibilities', weight: 0.4 },
      { name: 'description', weight: 0.3 },
    ],
    threshold: 0.4,
    ignoreLocation: true,
    includeScore: true,
  })
}

export interface InternshipFilters {
  category: string | null
  skills: string[]
}

// Category must match exactly; with skills selected, the internship must have at
// least one of them (case-insensitive) — "any" keeps results useful while data is sparse.
export function filterInternships<T extends Pick<Internship, 'category' | 'skills_required'>>(
  internships: T[],
  { category, skills }: InternshipFilters
): T[] {
  const wanted = new Set(skills.map((s) => s.toLowerCase()))
  return internships.filter((i) => {
    if (category && i.category !== category) return false
    if (wanted.size > 0 && !(i.skills_required || []).some((s) => wanted.has(s.toLowerCase()))) return false
    return true
  })
}

export interface Facet {
  value: string
  count: number
}

// Category and skill counts across the given internships, most common first
export function getInternshipFacets(
  internships: Pick<Internship, 'category' | 'skills_required'>[]
): { categories: Facet[]; skills: Facet[] } {
  const categories = new Map<string, number>()
  const skills = new Map<string, { label: string; count: number }>()
  for (const i of internships) {
    if (i.category) categories.set(i.category, (categories.get(i.category) || 0) + 1)
    const seen = new Set<string>()
    for (const s of i.skills_required || []) {
      const key = s.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      const entry = skills.get(key)
      if (entry) entry.count++
      else skills.set(key, { label: s, count: 1 })
    }
  }
  const byCount = (a: Facet, b: Facet) => b.count - a.count || a.value.localeCompare(b.value)
  return {
    categories: [...categories].map(([value, count]) => ({ value, count })).sort(byCount),
    skills: [...skills.values()].map(({ label, count }) => ({ value: label, count })).sort(byCount),
  }
}
