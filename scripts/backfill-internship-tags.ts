/**
 * One-time script: AI-tag internships with a category and short skill tags.
 * Fills category where missing and replaces skills_required with normalized tags.
 * Usage: npx tsx scripts/backfill-internship-tags.ts [--dry-run]
 */
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { suggestInternshipTags } from '../src/lib/ai/tagging'

const dryRun = process.argv.includes('--dry-run')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

async function main() {
  const { data: rows, error } = await supabase
    .from('internships')
    .select('id, title, description, requirements, responsibilities, skills_required, category')
    .is('category', null)
  if (error) throw error
  if (!rows?.length) {
    console.log('No internships need tagging.')
    return
  }

  // Tags assigned so far, reused for consistency across internships
  const knownSkills: string[] = []

  for (const row of rows) {
    const result = await suggestInternshipTags(openai, {
      title: row.title,
      description: row.description,
      requirements: row.requirements,
      responsibilities: row.responsibilities,
      skills: row.skills_required,
    }, knownSkills)

    for (const s of result.skills) {
      if (!knownSkills.some((k) => k.toLowerCase() === s.toLowerCase())) knownSkills.push(s)
    }

    console.log(`${row.title}\n  category: ${result.category}\n  skills:   ${result.skills.join(', ')}`)
    if (dryRun) continue

    const { error: updateError } = await supabase
      .from('internships')
      .update({ category: result.category, skills_required: result.skills })
      .eq('id', row.id)
    if (updateError) console.error(`  failed: ${updateError.message}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
