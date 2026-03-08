# AI Architecture — InternshipBridge

## Vision

Every user interaction in InternshipBridge is enhanced by AI: employers get help crafting compelling postings, students get career coaching and smart search, and both sides can discover ideal matches through semantic understanding rather than keyword matching alone. The AI layer treats the platform's structured data (profiles, postings, applications) as a knowledge base that a conversational interface can surface, explain, and act on.

Long-term, all of these capabilities are accessible through a WhatsApp chatbot, making the platform usable without ever opening the web app.

## AI Provider

**All-in on OpenAI.** One SDK (`openai`), one API key (`OPENAI_API_KEY`), one billing relationship.

| Capability | Model | Cost |
|-----------|-------|------|
| Chat / content generation | GPT-4o | ~$2.50/1M input tokens |
| Fast ranking / simple tasks | GPT-4o-mini | ~$0.15/1M input tokens |
| Embeddings | text-embedding-3-small | ~$0.02/1M tokens |
| Speech-to-text (v2) | Whisper | ~$0.006/min |
| Text-to-speech (v2) | TTS | ~$15/1M chars |

---

## Feature Areas

### 1. AI-Assisted Job Posting Creation

When an employer creates or edits an internship, an AI assistant panel offers to help.

| Version | Capability | Input | Output |
|---------|-----------|-------|--------|
| **v1** | Text chat | Employer describes the role conversationally | Polished job posting (title, description, requirements, responsibilities, skills) |
| **v2** | Voice | Employer speaks about the role (realtime or recorded) | Same structured posting, generated from speech |
| **v3** | Document upload | Employer uploads CV, company brochure, role description PDF | AI distills documents into a structured posting + saves attachments |

**How it works (v1):**
- Side panel or modal with chat interface on `/internships/create` and `/internships/[id]/edit`
- System prompt includes the internship schema fields and current form state
- GPT-4o generates structured JSON matching the form fields
- User can accept/edit individual fields or regenerate
- Conversation history persisted per draft posting

### 2. AI-Assisted Profile Creation

Same chat interface pattern for both student and company profiles.

- **Students** (`/profile`): AI helps write a compelling bio, suggests skills to highlight, coaches on what employers look for
- **Employers** (`/profile/company`): AI helps write company description, refine industry tags, improve location info

The assistant sees the current form state and suggests improvements or fills empty fields.

### 3. Vector Storage (Embeddings)

All key content is stored as vector embeddings alongside the source data for fast semantic retrieval.

**What gets embedded:**
- Internship postings (title + description + requirements + skills combined)
- Student profiles (bio + skills + graduation info combined)
- Company profiles (description + industry + location combined)

**Technology:**
- **pgvector** extension in Supabase (already available, just needs enabling)
- **Embedding model**: OpenAI `text-embedding-3-small` — 1536-dim vectors, fast, cheap ($0.02/1M tokens)
- Embeddings generated server-side on content create/update via API route
- Stored in `embedding VECTOR(1536)` columns on existing tables

**Database changes:**
```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding columns
ALTER TABLE internships ADD COLUMN embedding VECTOR(1536);
ALTER TABLE student_profiles ADD COLUMN embedding VECTOR(1536);
ALTER TABLE company_profiles ADD COLUMN embedding VECTOR(1536);

-- Indexes for fast similarity search
CREATE INDEX idx_internships_embedding ON internships
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 20);
CREATE INDEX idx_student_profiles_embedding ON student_profiles
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 20);
CREATE INDEX idx_company_profiles_embedding ON company_profiles
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 20);
```

### 4. Smart Semantic Search (Two-Tier)

Building on the existing Fuse.js fuzzy search, adds a second tier of AI-powered semantic search.

**Architecture** (adapted from `search-bar-architecture.md`):

```
User types query
  |
  +-- Tier 1: Fuse.js (instant, client-side, 0ms)
  |     Returns fuzzy keyword matches
  |
  +-- Tier 2: Semantic search (debounced 600ms, server-side)
  |     Option A: pgvector cosine similarity (fast, <100ms, no LLM call)
  |     Option B: GPT-4o-mini re-ranking (200-400ms, richer understanding)
  |
  +-- Results merged: fuzzy first, then semantic-only (deduplicated)
```

**Smart gating:** Skip semantic tier if Fuse.js already found 5+ results (saves API cost).

**Implementation:**
- New API route: `POST /api/ai/search`
- Accepts query string, returns ranked internship IDs with relevance scores
- Client merges with Fuse.js results using deduplication
- AbortController cancels in-flight requests on re-type

### 5. Student Career Coach Chat

A chat interface available to students that combines:
- **Career exploration**: General advice about industries, roles, skills to develop
- **Internship discovery**: Surfaces relevant postings from the database based on conversation context
- **Application coaching**: Help writing cover letters, preparing for interviews

**System prompt context includes:**
- Student's profile (bio, skills, graduation year)
- Active internships from their school (or global)
- Application history
- School context

**How internships surface:**
- As the student describes interests, the AI queries the vector store
- Relevant internships are embedded in the response as structured cards
- Student can click through to apply

### 6. Employer Student Explorer Chat

A chat interface for employers to discover students:
- Describe the ideal intern they're looking for
- AI searches student profiles via vector similarity
- Results shown as student cards (anonymized until mutual interest)
- Can shape a new internship posting based on available talent

**System prompt context includes:**
- Company profile
- Current active postings and their application counts
- Student profiles visible to this employer (school-scoped or global)

### 7. WhatsApp Chatbot Interface (Future)

All AI features accessible via WhatsApp, enabling the platform to work without the web app.

**Architecture:**
```
WhatsApp Business API (Meta Cloud API)
  |
  v
Webhook endpoint: POST /api/whatsapp/webhook
  |
  +-- Message router (identifies user, role, intent)
  |
  +-- Maps to same AI services used by web app:
       - Job posting assistant
       - Profile assistant
       - Career coach
       - Student explorer
       - Search
```

**Key considerations:**
- User identification via phone number linked to account
- Session/conversation state management
- Media handling (voice messages for v2, document uploads for v3)
- Rate limiting and cost controls
- Bilingual support (detect language from message or user preference)

**Provider options:**
- Direct Meta Cloud API (free tier: 1,000 conversations/month)
- Twilio WhatsApp API (more features, paid)
- 360dialog (official WhatsApp BSP)

---

## Technical Architecture

### New Dependencies

```json
{
  "openai": "latest"
}
```

Single SDK covers all AI needs: chat (GPT-4o/4o-mini), embeddings (text-embedding-3-small), speech-to-text (Whisper), and text-to-speech (TTS).

### Environment Variables

```env
# Required for all AI features
OPENAI_API_KEY=sk-proj-...

# Optional: for WhatsApp (future)
WHATSAPP_VERIFY_TOKEN=...
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
```

### File Structure

```
src/
├── app/api/ai/
│   ├── chat/route.ts              # Streaming chat endpoint
│   ├── search/route.ts            # Semantic search endpoint
│   ├── generate/
│   │   ├── posting/route.ts       # Generate job posting fields
│   │   └── profile/route.ts       # Generate profile content
│   ├── embed/route.ts             # Generate/update embeddings
│   └── voice/route.ts             # Voice processing (v2)
│
├── app/api/whatsapp/
│   └── webhook/route.ts           # WhatsApp webhook (future)
│
├── components/ai/
│   ├── AIChatPanel.tsx            # Reusable chat sidebar/modal
│   ├── AIAssistButton.tsx         # "Get AI help" trigger button
│   ├── ChatMessage.tsx            # Individual message bubble
│   ├── InternshipCard.tsx         # Inline internship result in chat
│   ├── StudentCard.tsx            # Inline student result in chat
│   ├── VoiceInput.tsx             # Microphone button + recording (v2)
│   └── DocumentUpload.tsx         # File upload + processing (v3)
│
├── lib/ai/
│   ├── client.ts                  # OpenAI SDK initialization
│   ├── embeddings.ts              # Embedding generation (text-embedding-3-small)
│   ├── prompts/
│   │   ├── posting-assistant.ts   # System prompt for job posting help
│   │   ├── profile-assistant.ts   # System prompt for profile help
│   │   ├── career-coach.ts        # System prompt for student chat
│   │   ├── student-explorer.ts    # System prompt for employer chat
│   │   └── search-ranker.ts       # System prompt for semantic ranking
│   ├── streaming.ts               # SSE/streaming response utilities
│   └── vector-search.ts           # pgvector query helpers
│
└── types/
    └── ai.ts                      # AI-specific TypeScript types
```

### Database Tables (New)

```sql
-- Chat conversation history
CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    context_type TEXT NOT NULL CHECK (context_type IN (
      'posting_assistant', 'profile_assistant',
      'career_coach', 'student_explorer', 'general'
    )),
    context_id UUID,  -- optional: internship_id, profile_id, etc.
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Individual messages within conversations
CREATE TABLE ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',  -- tool calls, internship refs, etc.
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Document attachments (v3)
CREATE TABLE ai_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    conversation_id UUID REFERENCES ai_conversations(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_url TEXT NOT NULL,  -- Supabase Storage URL
    extracted_text TEXT,     -- OCR/parsed content
    summary TEXT,            -- AI-generated summary
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

### Streaming Architecture

All chat endpoints use Server-Sent Events (SSE) for real-time streaming:

```typescript
// API route pattern
export async function POST(req: Request) {
  const { messages, context } = await req.json();

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    stream: true,
    messages: [
      { role: 'system', content: getSystemPrompt(context) },
      ...messages,
    ],
  });

  return new Response(stream.toReadableStream(), {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}
```

### Model Selection Strategy

| Use Case | Model | Why |
|----------|-------|-----|
| Chat (posting/profile/coaching) | GPT-4o | Best quality for conversational AI |
| Semantic search ranking | GPT-4o-mini | Fast, cheap, good at structured ranking tasks |
| Document processing (v3) | GPT-4o | Handles complex documents accurately |
| Embeddings | text-embedding-3-small | 1536-dim, very cheap, high quality |
| Speech-to-text (v2) | Whisper | Best accuracy for transcription |
| Text-to-speech (v2) | TTS | Natural voices |

### Security Considerations

- All AI API routes are **server-side only** (no API keys exposed to client)
- AI routes require **authenticated session** (check Supabase auth)
- **Rate limiting**: Per-user rate limits on chat and search endpoints
- **Input sanitization**: Strip prompt injection attempts from user messages
- **Cost controls**: Token usage tracking, daily/monthly caps per user
- **RLS**: AI conversations follow same row-level security as other data
- Content moderation: OpenAI's built-in moderation API + custom guardrails for school context

---

## Integration Points with Existing Code

### Internship Create/Edit Page
- Add `<AIChatPanel context="posting_assistant" />` sidebar
- Panel reads current form state via React context or props
- When AI generates fields, populate form via `react-hook-form` setValue
- Existing Zod validation still applies to AI-generated content

### Profile Pages
- Add `<AIAssistButton />` that opens `<AIChatPanel context="profile_assistant" />`
- Same pattern: AI reads form state, suggests content, user accepts/edits

### Browse Internships Page
- Add semantic search as tier 2 behind existing Fuse.js
- New `useSemanticSearch` hook wraps the API call with debounce + abort
- Merge results in existing search results display

### Dashboard (Student)
- Add "Career Coach" card/button that opens dedicated chat
- Chat persists across sessions via `ai_conversations` table

### Dashboard (Employer)
- Add "Find Students" card/button that opens explorer chat
- Surfaces student profiles as interactive cards in conversation

### i18n
- All AI UI components use `useTranslations('ai.*')`
- System prompts include user's locale for bilingual responses
- AI responds in the user's preferred language
