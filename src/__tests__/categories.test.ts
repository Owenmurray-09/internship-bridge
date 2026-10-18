import { describe, it, expect } from 'vitest'
import { INTERNSHIP_CATEGORIES, isInternshipCategory, normalizeSkill, normalizeSkills, MAX_SKILLS } from '@/lib/categories'
import { filterInternships, getInternshipFacets } from '@/lib/search'
import en from '@/lib/i18n/messages/en.json'
import es from '@/lib/i18n/messages/es.json'

describe('internship categories', () => {
  it('recognizes valid category keys only', () => {
    expect(isInternshipCategory('technology')).toBe(true)
    expect(isInternshipCategory('Technology')).toBe(false)
    expect(isInternshipCategory('tech')).toBe(false)
    expect(isInternshipCategory(null)).toBe(false)
  })

  it('has EN and ES labels for every category', () => {
    for (const c of INTERNSHIP_CATEGORIES) {
      expect(en.internships.categories[c]).toBeTruthy()
      expect(es.internships.categories[c]).toBeTruthy()
    }
  })
})

describe('normalizeSkill', () => {
  it('trims, collapses spaces, drops trailing punctuation, and capitalizes', () => {
    expect(normalizeSkill('  customer   service. ')).toBe('Customer service')
  })

  it('rejects empty and overly long tags', () => {
    expect(normalizeSkill('   ')).toBeNull()
    expect(normalizeSkill('Strong interpersonal and communication skills')).toBeNull()
  })
})

describe('normalizeSkills', () => {
  it('de-duplicates case-insensitively, keeping the first spelling', () => {
    expect(normalizeSkills(['Excel', 'excel', 'Cooking'])).toEqual(['Excel', 'Cooking'])
  })

  it('caps the number of tags', () => {
    const many = Array.from({ length: 20 }, (_, i) => `Skill ${i}`)
    expect(normalizeSkills(many)).toHaveLength(MAX_SKILLS)
  })
})

describe('filterInternships', () => {
  const list = [
    { id: 'a', category: 'technology', skills_required: ['Python', 'Teamwork'] },
    { id: 'b', category: 'food_hospitality', skills_required: ['Cooking', 'Teamwork'] },
    { id: 'c', category: null, skills_required: [] },
  ]

  it('returns everything with no filters', () => {
    expect(filterInternships(list, { category: null, skills: [] })).toHaveLength(3)
  })

  it('filters by category', () => {
    expect(filterInternships(list, { category: 'technology', skills: [] }).map((i) => i.id)).toEqual(['a'])
  })

  it('matches any selected skill, case-insensitively', () => {
    expect(filterInternships(list, { category: null, skills: ['python', 'Cooking'] }).map((i) => i.id)).toEqual(['a', 'b'])
  })

  it('combines category and skills', () => {
    expect(filterInternships(list, { category: 'food_hospitality', skills: ['Teamwork'] }).map((i) => i.id)).toEqual(['b'])
  })
})

describe('getInternshipFacets', () => {
  it('counts categories and skills, most common first', () => {
    const facets = getInternshipFacets([
      { category: 'technology', skills_required: ['Python', 'Teamwork'] },
      { category: 'technology', skills_required: ['teamwork'] },
      { category: 'retail', skills_required: null as unknown as string[] },
    ])
    expect(facets.categories).toEqual([
      { value: 'technology', count: 2 },
      { value: 'retail', count: 1 },
    ])
    expect(facets.skills).toEqual([
      { value: 'Teamwork', count: 2 },
      { value: 'Python', count: 1 },
    ])
  })
})
