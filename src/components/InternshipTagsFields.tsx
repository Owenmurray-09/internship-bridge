'use client'

import { useEffect, useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClientSupabase } from '@/lib/supabase'
import { useTranslations } from '@/lib/i18n'
import { INTERNSHIP_CATEGORIES, MAX_SKILLS, normalizeSkill, normalizeSkills } from '@/lib/categories'
import type { TaggingInput, TaggingResult } from '@/lib/ai/tagging'

export async function fetchTagSuggestions(posting: TaggingInput): Promise<TaggingResult | null> {
  try {
    const res = await fetch('/api/ai/tag-internship', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(posting),
    })
    if (!res.ok) return null
    return (await res.json()) as TaggingResult
  } catch {
    return null
  }
}

interface InternshipTagsFieldsProps {
  category: string
  onCategoryChange: (category: string) => void
  skills: string[]
  onSkillsChange: (skills: string[]) => void
  // Current posting content, read when the employer asks for AI suggestions
  getPosting: () => TaggingInput
  disabled?: boolean
  categoryError?: string
  suggesting?: boolean
  onSuggestingChange?: (suggesting: boolean) => void
}

export default function InternshipTagsFields({
  category,
  onCategoryChange,
  skills,
  onSkillsChange,
  getPosting,
  disabled,
  categoryError,
  suggesting = false,
  onSuggestingChange,
}: InternshipTagsFieldsProps) {
  const { t } = useTranslations('internships.create.tags')
  const { t: tCategories } = useTranslations('internships.categories')
  const [skillInput, setSkillInput] = useState('')
  const [knownSkills, setKnownSkills] = useState<string[]>([])
  const [suggestError, setSuggestError] = useState('')

  // Tags already used on other internships, offered as autocomplete
  useEffect(() => {
    async function loadKnownSkills() {
      const supabase = createClientSupabase()
      const { data } = await supabase
        .from('internships')
        .select('skills_required')
        .eq('status', 'active')
      setKnownSkills(normalizeSkills((data || []).flatMap((r) => r.skills_required || []), 500))
    }
    loadKnownSkills()
  }, [])

  const addSkill = () => {
    const s = normalizeSkill(skillInput)
    setSkillInput('')
    if (!s || skills.length >= MAX_SKILLS) return
    // Reuse an existing tag's spelling so filters group them together
    const existing = knownSkills.find((k) => k.toLowerCase() === s.toLowerCase())
    onSkillsChange(normalizeSkills([...skills, existing || s]))
  }

  const suggest = async () => {
    const posting = getPosting()
    if (!posting.title?.trim() || !posting.description?.trim()) {
      setSuggestError(t('suggestNeedsContent'))
      return
    }
    setSuggestError('')
    onSuggestingChange?.(true)
    const result = await fetchTagSuggestions(posting)
    onSuggestingChange?.(false)
    if (!result) {
      setSuggestError(t('suggestError'))
      return
    }
    onCategoryChange(result.category)
    onSkillsChange(normalizeSkills([...skills, ...result.skills]))
  }

  return (
    <div className="space-y-4 border-t pt-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-gray-600">{t('intro')}</p>
        <Button type="button" variant="outline" size="sm" onClick={suggest} disabled={disabled || suggesting}>
          <Sparkles className="h-4 w-4" />
          {suggesting ? t('suggesting') : t('suggest')}
        </Button>
      </div>
      {suggestError && <p className="text-red-500 text-sm">{suggestError}</p>}

      <div className="space-y-2">
        <Label htmlFor="category">{t('category')}</Label>
        <select
          id="category"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={disabled}
          aria-invalid={!!categoryError}
        >
          <option value="">{t('categoryPlaceholder')}</option>
          {INTERNSHIP_CATEGORIES.map((c) => (
            <option key={c} value={c}>{tCategories(c)}</option>
          ))}
        </select>
        {categoryError && <p className="text-red-500 text-sm">{categoryError}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="skillInput">{t('skills')}</Label>
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 bg-green-50 text-green-800 text-xs px-2 py-1 rounded-md">
                {s}
                <button
                  type="button"
                  onClick={() => onSkillsChange(skills.filter((x) => x !== s))}
                  className="text-green-400 hover:text-green-600"
                  aria-label={t('removeSkill', { skill: s })}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            id="skillInput"
            list="known-skills"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault()
                addSkill()
              }
            }}
            placeholder={t('skillsPlaceholder')}
            maxLength={40}
            disabled={disabled || skills.length >= MAX_SKILLS}
          />
          <Button type="button" variant="outline" onClick={addSkill} disabled={disabled || !skillInput.trim() || skills.length >= MAX_SKILLS}>
            {t('add')}
          </Button>
        </div>
        <datalist id="known-skills">
          {knownSkills.filter((k) => !skills.includes(k)).map((k) => (
            <option key={k} value={k} />
          ))}
        </datalist>
        <p className="text-gray-500 text-xs">{t('skillsHint', { max: MAX_SKILLS })}</p>
      </div>
    </div>
  )
}
