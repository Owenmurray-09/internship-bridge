'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClientSupabase } from '@/lib/supabase'
import { useTranslations } from '@/lib/i18n'
import DashboardNav from '@/components/DashboardNav'
import type { Internship, UserRole } from '@/types/database'
import { createInternshipSearch, filterInternships, getInternshipFacets } from '@/lib/search'
import { useSemanticSearch } from '@/hooks/useSemanticSearch'

const SKILL_CHIP_LIMIT = 12
const CARD_SKILL_LIMIT = 4

function FilterChip({ label, count, selected, onClick }: {
  label: string
  count: number
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border transition-colors ${
        selected
          ? 'bg-blue-600 border-blue-600 text-white'
          : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
      }`}
    >
      {label}
      <span className={`text-xs ${selected ? 'text-blue-100' : 'text-gray-400'}`}>{count}</span>
    </button>
  )
}

export default function BrowseInternshipsPage() {
  const router = useRouter()
  const { t } = useTranslations('internships.browse')
  const { t: tCommon } = useTranslations('common')
  const { t: tAi } = useTranslations('ai.search')
  const { t: tCategories } = useTranslations('internships.categories')

  const [internships, setInternships] = useState<Internship[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [userName, setUserName] = useState('')
  const [userRole, setUserRole] = useState<UserRole>('student')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [showAllSkills, setShowAllSkills] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClientSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('full_name, role')
        .eq('id', user.id)
        .single()

      setUserName(userData?.full_name || user.email || '')
      setUserRole(userData?.role || 'student')

      const { data } = await supabase
        .from('internships')
        .select('*, company_profiles(company_name, location, industry)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      setInternships((data as Internship[]) || [])
      setLoading(false)
    }
    load()
  }, [router])

  // Tier 1: Fuse.js (instant, client-side)
  const fuse = useMemo(() => createInternshipSearch(internships), [internships])
  const fuseResults = useMemo(() => {
    if (!search.trim()) return []
    return fuse.search(search).map((r) => r.item.internship)
  }, [search, fuse])

  // Tier 2: Semantic search (debounced, server-side)
  const { results: semanticResults, loading: semanticLoading } = useSemanticSearch({
    query: search,
    fuseResultCount: fuseResults.length,
  })

  // Track which IDs came from semantic search (for badge display)
  const semanticIds = useMemo(
    () => new Set(semanticResults.map((r) => r.id)),
    [semanticResults]
  )

  // Merge: fuzzy first, then semantic-only (deduplicated)
  const filtered = useMemo(() => {
    if (!search.trim()) return internships

    const fuseIds = new Set(fuseResults.map((i) => i.id))
    const semanticOnly = semanticResults
      .filter((r) => !fuseIds.has(r.id))
      .map((r) => internships.find((i) => i.id === r.id))
      .filter(Boolean) as Internship[]

    return [...fuseResults, ...semanticOnly]
  }, [search, internships, fuseResults, semanticResults])

  // Filter chips: counts come from all active internships so the chip list stays stable while typing
  const facets = useMemo(() => getInternshipFacets(internships), [internships])
  const visibleSkills = showAllSkills ? facets.skills : facets.skills.slice(0, SKILL_CHIP_LIMIT)
  const hasFilters = !!selectedCategory || selectedSkills.length > 0
  const displayed = useMemo(
    () => filterInternships(filtered, { category: selectedCategory, skills: selectedSkills }),
    [filtered, selectedCategory, selectedSkills]
  )

  const toggleSkill = (skill: string) => {
    const key = skill.toLowerCase()
    setSelectedSkills((current) =>
      current.some((s) => s.toLowerCase() === key)
        ? current.filter((s) => s.toLowerCase() !== key)
        : [...current, skill]
    )
  }
  const isSkillSelected = (skill: string) => selectedSkills.some((s) => s.toLowerCase() === skill.toLowerCase())
  const clearFilters = () => {
    setSelectedCategory(null)
    setSelectedSkills([])
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">{tCommon('loading')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav userName={userName} userRole={userRole} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">{t('title')}</h2>
          <p className="text-gray-600 mt-1">{t('description')}</p>
        </div>

        <div className="mb-6">
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md focus:max-w-full transition-all duration-300 ease-in-out"
          />
          {semanticLoading && (
            <p className="text-xs text-gray-400 mt-1">
              {tAi('finding')}
            </p>
          )}

          {(facets.categories.length > 0 || facets.skills.length > 0) && (
            <div className="mt-4 space-y-3">
              {facets.categories.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 mr-1">{t('filters.category')}</span>
                  {facets.categories.map((c) => (
                    <FilterChip
                      key={c.value}
                      label={tCategories(c.value)}
                      count={c.count}
                      selected={selectedCategory === c.value}
                      onClick={() => setSelectedCategory(selectedCategory === c.value ? null : c.value)}
                    />
                  ))}
                </div>
              )}
              {facets.skills.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 mr-1">{t('filters.skills')}</span>
                  {visibleSkills.map((sk) => (
                    <FilterChip
                      key={sk.value}
                      label={sk.value}
                      count={sk.count}
                      selected={isSkillSelected(sk.value)}
                      onClick={() => toggleSkill(sk.value)}
                    />
                  ))}
                  {facets.skills.length > SKILL_CHIP_LIMIT && (
                    <button
                      type="button"
                      onClick={() => setShowAllSkills(!showAllSkills)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {showAllSkills ? t('filters.showFewer') : t('filters.showAll', { count: facets.skills.length })}
                    </button>
                  )}
                </div>
              )}
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                >
                  <X className="h-3.5 w-3.5" />
                  {t('filters.clear')}
                </button>
              )}
            </div>
          )}
        </div>

        {displayed.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500 text-lg">
                {hasFilters && filtered.length > 0
                  ? t('filters.noMatches')
                  : !search
                  ? t('noInternships')
                  : semanticLoading
                    ? tAi('noDirectMatches')
                    : tAi('noResults')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayed.map((internship) => {
              const company = (internship as unknown as Record<string, unknown>).company_profiles as
                | { company_name: string; location?: string; industry?: string }
                | undefined
              const isSemanticMatch = semanticIds.has(internship.id) && !fuseResults.some((f) => f.id === internship.id)
              return (
                <Card key={internship.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-lg">{internship.title}</CardTitle>
                    <CardDescription>
                      {company?.company_name}
                      {company?.location && ` - ${company.location}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                      {internship.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {internship.category && (
                        <button
                          type="button"
                          onClick={() => setSelectedCategory(internship.category!)}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-900 text-white hover:bg-gray-700"
                        >
                          {tCategories(internship.category)}
                        </button>
                      )}
                      {internship.location && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {internship.location}
                        </span>
                      )}
                      {internship.remote_allowed && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {t('remote')}
                        </span>
                      )}
                      {isSemanticMatch && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <Sparkles className="h-3 w-3" />
                          {tAi('semanticMatch')}
                        </span>
                      )}
                    </div>

                    {(internship.skills_required || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {(internship.skills_required || []).slice(0, CARD_SKILL_LIMIT).map((sk) => (
                          <button
                            key={sk}
                            type="button"
                            onClick={() => { if (!isSkillSelected(sk)) toggleSkill(sk) }}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-green-50 text-green-800 hover:bg-green-100"
                          >
                            {sk}
                          </button>
                        ))}
                        {(internship.skills_required || []).length > CARD_SKILL_LIMIT && (
                          <span className="text-xs text-gray-500 self-center">
                            +{(internship.skills_required || []).length - CARD_SKILL_LIMIT}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-auto">
                      <Link href={`/internships/${internship.id}`}>
                        <Button className="w-full">{t('viewDetails')}</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
