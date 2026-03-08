/**
 * One-time script to backfill embeddings for all records missing them.
 * Usage: npx tsx scripts/backfill-embeddings.ts
 */
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!texts.length) return []
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  })
  return res.data.map((d) => d.embedding)
}

async function backfillInternships() {
  const { data: rows } = await supabase
    .from('internships')
    .select('id, title, description, requirements, responsibilities, skills_required, location, company_profiles(company_name, industry)')
    .is('embedding', null)

  if (!rows?.length) {
    console.log('Internships: nothing to backfill')
    return
  }

  const texts = rows.map((r) => {
    const co = r.company_profiles as unknown as { company_name: string; industry?: string } | null
    return [r.title, r.description, co?.company_name, co?.industry, r.location,
      ...(r.skills_required || []), ...(r.requirements || []), ...(r.responsibilities || [])
    ].filter(Boolean).join(' ')
  })

  const embeddings = await embedTexts(texts)
  let ok = 0
  for (let i = 0; i < rows.length; i++) {
    const { error } = await supabase
      .from('internships')
      .update({ embedding: JSON.stringify(embeddings[i]) })
      .eq('id', rows[i].id)
    if (error) console.error(`  Failed ${rows[i].id}:`, error.message)
    else ok++
  }
  console.log(`Internships: embedded ${ok}/${rows.length}`)
}

async function backfillStudentProfiles() {
  const { data: rows } = await supabase
    .from('student_profiles')
    .select('id, bio, email, graduation_year')
    .is('embedding', null)

  if (!rows?.length) {
    console.log('Student profiles: nothing to backfill')
    return
  }

  const texts = rows.map((r) =>
    [r.bio, r.email, r.graduation_year?.toString()].filter(Boolean).join(' ')
  )

  const embeddings = await embedTexts(texts)
  let ok = 0
  for (let i = 0; i < rows.length; i++) {
    const { error } = await supabase
      .from('student_profiles')
      .update({ embedding: JSON.stringify(embeddings[i]) })
      .eq('id', rows[i].id)
    if (error) console.error(`  Failed ${rows[i].id}:`, error.message)
    else ok++
  }
  console.log(`Student profiles: embedded ${ok}/${rows.length}`)
}

async function backfillCompanyProfiles() {
  const { data: rows } = await supabase
    .from('company_profiles')
    .select('id, company_name, description, industry, location')
    .is('embedding', null)

  if (!rows?.length) {
    console.log('Company profiles: nothing to backfill')
    return
  }

  const texts = rows.map((r) =>
    [r.company_name, r.description, r.industry, r.location].filter(Boolean).join(' ')
  )

  const embeddings = await embedTexts(texts)
  let ok = 0
  for (let i = 0; i < rows.length; i++) {
    const { error } = await supabase
      .from('company_profiles')
      .update({ embedding: JSON.stringify(embeddings[i]) })
      .eq('id', rows[i].id)
    if (error) console.error(`  Failed ${rows[i].id}:`, error.message)
    else ok++
  }
  console.log(`Company profiles: embedded ${ok}/${rows.length}`)
}

async function main() {
  console.log('Starting embedding backfill...\n')
  await backfillInternships()
  await backfillStudentProfiles()
  await backfillCompanyProfiles()
  console.log('\nDone!')
}

main().catch(console.error)
