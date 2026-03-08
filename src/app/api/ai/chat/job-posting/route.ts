import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { openai } from '@/lib/ai/client'
import { JOB_POSTING_SYSTEM_PROMPT, JOB_POSTING_CONTEXT_PROMPT } from '@/lib/ai/prompts'

export async function POST(req: Request) {
  // Auth check
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { messages, companyName, industry } = body as {
    messages: { role: 'user' | 'assistant'; content: string }[]
    companyName?: string
    industry?: string
  }

  if (!messages?.length) {
    return NextResponse.json({ error: 'messages required' }, { status: 400 })
  }

  const systemPrompt =
    JOB_POSTING_SYSTEM_PROMPT + JOB_POSTING_CONTEXT_PROMPT(companyName, industry)

  try {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      stream: true,
      max_tokens: 2000,
      temperature: 0.7,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content
          if (text) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Job posting chat error:', error)
    return NextResponse.json(
      { error: 'Chat failed' },
      { status: 500 }
    )
  }
}
