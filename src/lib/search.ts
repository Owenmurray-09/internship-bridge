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
