import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { getOpenAI } from '@/lib/ai/client'
import { suggestInternshipTags, type TaggingInput } from '@/lib/ai/tagging'

export async function POST(req: Request) {
  // Auth check: only employers (and global admins) post internships
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (userData?.role !== 'employer' && userData?.role !== 'global_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = (await req.json()) as Partial<TaggingInput>
  if (!body.title?.trim() || !body.description?.trim()) {
    return NextResponse.json({ error: 'title and description are required' }, { status: 400 })
  }

  // Existing tags across active internships, so suggestions reuse the same spelling
  const { data: rows } = await supabase
    .from('internships')
    .select('skills_required')
    .eq('status', 'active')
  const knownSkills = [...new Set((rows || []).flatMap((r) => r.skills_required || []))]

  try {
    const result = await suggestInternshipTags(
      getOpenAI(),
      {
        title: body.title,
        description: body.description,
        requirements: body.requirements,
        responsibilities: body.responsibilities,
        skills: body.skills,
      },
      knownSkills
    )
    return NextResponse.json(result)
  } catch (error) {
    console.error('Internship tagging error:', error)
    return NextResponse.json({ error: 'Tagging failed' }, { status: 500 })
  }
}
