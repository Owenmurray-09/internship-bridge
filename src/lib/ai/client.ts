import OpenAI from 'openai'

// Lazy singleton — avoids throwing at build time when env vars aren't available
let _openai: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required')
    }
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _openai
}
