# Tier 2 Semantic Search — Handoff for AI Integration Session

This document captures the context, decisions, and integration plan for adding pgvector semantic search as Tier 2 behind the existing Fuse.js fuzzy search on the internship browse page. Written by the session that built Tier 1.

---

## What exists today (Tier 1 — Fuse.js)

### Files
- **`src/lib/search.ts`** — Fuse.js index builder. Creates a `SearchableInternship` wrapper around each internship that flattens nested company data into searchable fields.
- **`src/app/internships/page.tsx`** — Browse page. Uses `useMemo` to build the Fuse index when `internships` changes and to run searches when `search` changes.

### How Fuse.js works now
```
User types → Fuse.js runs instantly (0ms, client-side)
           → Returns fuzzy matches ranked by weighted score
           → Empty query returns all internships in original order
```

Fuse config (in `src/lib/search.ts`):
- `threshold: 0.4` (fairly loose — handles typos like "softwar" → "software")
- `ignoreLocation: true` (match anywhere in the field)
- `includeScore: true` (scores available for merge logic)
- Weighted fields: title (1.0), skills (0.8), company_name (0.7), location (0.6), industry (0.5), requirements (0.4), responsibilities (0.4), description (0.3)

### Current page data flow
The browse page fetches internships via Supabase with a joined select:
```ts
.select('*, company_profiles(company_name, location, industry)')
.eq('status', 'active')
.order('created_at', { ascending: false })
```
This returns `Internship` objects with a nested `company_profiles` object (accessed via cast). The Fuse index flattens these into `SearchableInternship` docs.

### What Fuse handles well
- Typos: "javscript" → "JavaScript", "softwar" → "software"
- Partial matches: "waiter" → "Table Waiter"
- Multi-field: "music" matches company name "Music Rink"

### What Fuse cannot do (why we need Tier 2)
- Intent: "I want to work outdoors" won't match an internship about landscaping
- Synonyms: "coding" won't match "software development" (too different for fuzzy)
- Natural language: "something creative near downtown" — no field-by-field fuzzy match

---

## Tier 2 Design: pgvector Semantic Search

### Architecture (from `docs/ai-architecture.md` Section 4)

```
User types query
  |
  +-- Tier 1: Fuse.js (instant, client-side, 0ms)
  |     Returns fuzzy keyword matches
  |
  +-- Tier 2: pgvector cosine similarity (debounced 600ms, server-side)
  |     Embed the query → find nearest internship embeddings
  |
  +-- Results merged: fuzzy first, then semantic-only (deduplicated by id)
```

**Smart gating:** If Fuse.js already returned 5+ results, skip the Tier 2 API call entirely. This saves cost and latency for queries where keyword matching is sufficient.

### Why pgvector (not GPT-4o-mini ranking)
The architecture doc offers two options for Tier 2. For this platform, pgvector is the right choice:
- **Cost**: $0.02/1M tokens for embedding the query vs ~$0.15/1M for GPT-4o-mini ranking. At scale, pgvector is ~10x cheaper.
- **Latency**: pgvector cosine similarity is <100ms vs 200-400ms for an LLM call.
- **Simplicity**: One API call (embed the query) + one SQL query. No prompt engineering for ranking.
- **Reuse**: The embeddings serve double duty — they're needed for career coach chat (Phase 4) and student explorer (Phase 5), so building the embedding pipeline now pays off later.

GPT-4o-mini ranking could be added as a Tier 3 later for complex natural-language queries, but pgvector covers the 90% case.

---

## Implementation Plan

### Step 1: Database — Enable pgvector and add embedding columns

```sql
-- Enable pgvector (run in Supabase SQL editor)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding columns to existing tables
ALTER TABLE internships ADD COLUMN embedding VECTOR(1536);
ALTER TABLE student_profiles ADD COLUMN embedding VECTOR(1536);
ALTER TABLE company_profiles ADD COLUMN embedding VECTOR(1536);

-- Indexes for fast similarity search (ivfflat)
-- Note: lists=20 is fine for small datasets (<1000 rows). Increase as data grows.
CREATE INDEX idx_internships_embedding ON internships
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 20);
CREATE INDEX idx_student_profiles_embedding ON student_profiles
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 20);
CREATE INDEX idx_company_profiles_embedding ON company_profiles
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 20);
```

The student_profiles and company_profiles columns aren't needed for search Tier 2 but are cheap to add now and will be used by Phase 4/5.

### Step 2: Create `src/lib/ai/client.ts` — OpenAI singleton

```ts
import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})
```

Server-side only. The `OPENAI_API_KEY` env var is already set in `.env.local` and Vercel.

### Step 3: Create `src/lib/ai/embeddings.ts`

Core function: take text, return 1536-dim vector via `text-embedding-3-small`.

```ts
import { openai } from './client'

export async function embedText(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  return response.data[0].embedding
}

export function buildInternshipEmbeddingText(internship: {
  title: string
  description: string
  requirements?: string[]
  responsibilities?: string[]
  skills_required?: string[]
  location?: string
  company_name?: string
  industry?: string
}): string {
  return [
    internship.title,
    internship.description,
    internship.company_name,
    internship.industry,
    internship.location,
    ...(internship.skills_required || []),
    ...(internship.requirements || []),
    ...(internship.responsibilities || []),
  ].filter(Boolean).join(' ')
}
```

### Step 4: Create `src/lib/ai/vector-search.ts`

Query pgvector via Supabase RPC (or raw SQL).

```ts
import { createServerSupabase } from '@/lib/supabase'

export async function searchInternshipsByVector(
  queryEmbedding: number[],
  limit = 10,
  threshold = 0.7 // minimum cosine similarity
) {
  const supabase = createServerSupabase()
  // Requires a Supabase RPC function — see SQL below
  const { data, error } = await supabase.rpc('match_internships', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
  })
  if (error) throw error
  return data
}
```

Supporting SQL function in Supabase:
```sql
CREATE OR REPLACE FUNCTION match_internships(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    internships.id,
    internships.title,
    1 - (internships.embedding <=> query_embedding) AS similarity
  FROM internships
  WHERE internships.status = 'active'
    AND internships.embedding IS NOT NULL
    AND 1 - (internships.embedding <=> query_embedding) > match_threshold
  ORDER BY internships.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### Step 5: Create `POST /api/ai/embed` — Embedding generation endpoint

Called on internship create/update to auto-embed. Also supports a backfill mode.

```
POST /api/ai/embed
Body: { type: "internship", id: "uuid" }
  → Fetches the record, builds text, embeds, stores vector

POST /api/ai/embed
Body: { type: "internship", backfill: true }
  → Finds all internships with NULL embedding, embeds them all
```

### Step 6: Create `POST /api/ai/search` — Semantic search endpoint

```
POST /api/ai/search
Body: { query: "I want to work with animals" }
Response: { results: [{ id, title, similarity }] }
```

Steps: embed the query → call `match_internships` RPC → return results.

### Step 7: Integrate Tier 2 into the browse page

This is the key integration point. The browse page (`src/app/internships/page.tsx`) currently has:

```tsx
const fuse = useMemo(() => createInternshipSearch(internships), [internships])
const filtered = useMemo(() => {
  if (!search.trim()) return internships
  return fuse.search(search).map((r) => r.item.internship)
}, [search, fuse, internships])
```

Add semantic search alongside it:

```tsx
const [semanticResults, setSemanticResults] = useState<string[]>([]) // internship IDs
const [semanticLoading, setSemanticLoading] = useState(false)
const abortRef = useRef<AbortController | null>(null)

// Tier 1: Fuse.js (unchanged, instant)
const fuseResults = useMemo(() => {
  if (!search.trim()) return []
  return fuse.search(search).map((r) => r.item.internship)
}, [search, fuse])

// Tier 2: Semantic (debounced 600ms)
useEffect(() => {
  setSemanticResults([])
  if (search.trim().length < 3) return
  if (fuseResults.length >= 5) return // smart gating

  const timer = setTimeout(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setSemanticLoading(true)

    try {
      const res = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: search.trim() }),
        signal: controller.signal,
      })
      const data = await res.json()
      setSemanticResults(data.results.map((r: { id: string }) => r.id))
    } catch (e) {
      if ((e as Error).name !== 'AbortError') console.error(e)
    } finally {
      setSemanticLoading(false)
    }
  }, 600)

  return () => { clearTimeout(timer); abortRef.current?.abort() }
}, [search, fuseResults.length])

// Merge: fuzzy first, then semantic-only (deduplicated)
const filtered = useMemo(() => {
  if (!search.trim()) return internships
  const fuseIds = new Set(fuseResults.map(i => i.id))
  const semanticOnly = semanticResults
    .filter(id => !fuseIds.has(id))
    .map(id => internships.find(i => i.id === id))
    .filter(Boolean) as Internship[]
  return [...fuseResults, ...semanticOnly]
}, [search, internships, fuseResults, semanticResults])
```

Consider extracting this into a `useSemanticSearch` hook in `src/hooks/useSemanticSearch.ts` if it gets unwieldy.

### Step 8: Auto-embed on internship create/update

In the internship create and edit pages, after a successful Supabase insert/update, fire-and-forget to the embed endpoint:

```ts
// After successful save
fetch('/api/ai/embed', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'internship', id: internship.id }),
})
```

This keeps embeddings fresh without blocking the user.

### Step 9: Backfill existing internships

A one-time script or API call to embed all existing internships that have `embedding IS NULL`. Can be triggered via the `/api/ai/embed` endpoint with `backfill: true`, or as a standalone script.

---

## Integration constraints

### i18n
- All new UI strings (e.g., "semantic match" badge, loading spinner text) need entries in both `src/lib/i18n/messages/en.json` and `src/lib/i18n/messages/es.json`.
- Use the `useTranslations` hook — never hardcode user-facing strings.
- Namespace: `ai.search.*` for search-specific strings.

### Auth
- All `/api/ai/*` routes must check for an authenticated Supabase session.
- Use `createServerSupabase()` from `src/lib/supabase` to get the auth context.

### Types
- Existing types are in `src/types/database.ts` — the `Internship` type is what flows through the browse page.
- New AI-specific types should go in `src/types/ai.ts` (doesn't exist yet, create it).
- The `SearchableInternship` interface in `src/lib/search.ts` is intentionally separate from the database type — it flattens nested joins for Fuse.js indexing.

### Supabase client
- Client-side: `createClientSupabase()` from `src/lib/supabase`
- Server-side (API routes): `createServerSupabase()` from `src/lib/supabase`
- The browse page currently uses the client-side Supabase. The semantic search endpoint will use server-side.

### Validation
- Request validation uses Zod schemas in `src/lib/validation.ts`.
- New API routes should follow the same pattern.

### Testing
- Unit tests live in `src/__tests__/` and use Vitest with jsdom.
- Current test count: 93 tests across 3 files.
- Browser testing via Chrome DevTools MCP with `/smoke-test` and `/regression-test` slash commands.

---

## What NOT to change

- **`src/lib/search.ts`** — Tier 1 is done and tested. Don't modify the Fuse config unless there's a specific issue.
- **Fuse.js dependency** — Already installed (`fuse.js@^7.1.0`).
- **The Supabase query** on the browse page — It fetches `*, company_profiles(company_name, location, industry)`. Tier 2 results will reference internships by ID and look them up in the already-fetched array; no need to change the query.
- **Rendering logic** — The card grid rendering is correct. Tier 2 just needs to feed into the same `filtered` array.

---

## Open questions / decisions for the AI session

1. **Similarity threshold**: The plan suggests 0.7. This may need tuning based on real data. Start conservative (0.7) and lower if too few results come back.

2. **Semantic match badge**: The reference architecture shows a sparkle badge on semantic-only results. The AI session should decide if this is worth adding (requires a new i18n key and minor UI change to the card).

3. **Error handling**: If the embed endpoint or search endpoint fails, Tier 1 (Fuse.js) still works independently. The UI should degrade gracefully — just don't show semantic results.

4. **Rate limiting**: Not needed for MVP, but the architecture doc mentions per-user rate limits on AI endpoints. Can be deferred to a later pass.

5. **Backfill strategy**: With only 2 internships in dev, backfill is trivial. In production, batch the embedding calls (OpenAI supports batch embedding in a single request).
