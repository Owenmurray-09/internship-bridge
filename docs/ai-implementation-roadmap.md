# AI Implementation Roadmap — InternshipBridge

This breaks the [AI Architecture](./ai-architecture.md) into concrete implementation phases. Each phase is independently shippable.

---

## Phase 1: Foundation + AI-Assisted Job Posting (v1)

**Goal:** Get OpenAI working end-to-end with a single high-value feature.

### Tasks

1. **Infrastructure setup**
   - Install `openai` SDK (already done in Phase 3 if starting there)
   - Add `OPENAI_API_KEY` to `.env.local` and Vercel
   - Create `src/lib/ai/client.ts` — OpenAI SDK singleton
   - Create `src/types/ai.ts` — shared types (ChatMessage, ConversationContext, etc.)

2. **Streaming chat API route**
   - `POST /api/ai/chat` — accepts messages + context, returns SSE stream
   - Auth check (Supabase session required)
   - Context-aware system prompt selection
   - Create `src/lib/ai/streaming.ts` — SSE helpers

3. **System prompts**
   - `src/lib/ai/prompts/posting-assistant.ts` — prompt for job posting help
   - Includes: internship schema fields, current form state, school context, language preference
   - Output format: structured JSON with form field values

4. **Reusable chat UI**
   - `src/components/ai/AIChatPanel.tsx` — slide-out panel or modal
   - `src/components/ai/ChatMessage.tsx` — message bubbles with markdown
   - `src/components/ai/AIAssistButton.tsx` — trigger button
   - Streaming display (typewriter effect)
   - "Apply to form" button on AI-generated suggestions

5. **Integration with internship create page**
   - Add AI panel to `/internships/create`
   - Wire AI output → `react-hook-form` `setValue()` for each field
   - User reviews and can edit before saving
   - i18n keys for all new UI strings (EN + ES)

6. **Conversation persistence**
   - Database migration: `ai_conversations` + `ai_messages` tables
   - Save/load chat history per posting draft
   - RLS policies for conversations

### Definition of Done
- Employer can open AI assistant on job posting page
- Chat back and forth about the role
- AI generates structured posting content
- One-click apply to form fields
- Works in both EN and ES

---

## Phase 2: AI-Assisted Profiles

**Goal:** Apply the same chat pattern to student and company profile pages.

### Tasks

1. **System prompts**
   - `src/lib/ai/prompts/profile-assistant.ts`
   - Student variant: bio writing, skills coaching, employer perspective
   - Company variant: description writing, industry/location refinement

2. **Integration with profile pages**
   - Add `<AIAssistButton />` + `<AIChatPanel context="profile_assistant" />` to `/profile` and `/profile/company`
   - Same form integration pattern as Phase 1

3. **i18n**
   - Add `ai.profile.*` translation keys

### Definition of Done
- Students and employers can get AI help writing their profiles
- Suggestions populate form fields
- Works in both languages

---

## Phase 3: Vector Storage + Semantic Search

**Goal:** Enable AI-powered search that understands intent, not just keywords.

### Tasks

1. **Embedding infrastructure**
   - Install `openai` SDK (also used later for voice in Phase 6)
   - Add `OPENAI_API_KEY` to env
   - Create `src/lib/ai/embeddings.ts` — embed text via `text-embedding-3-small`, batch embed
   - Create `src/lib/ai/vector-search.ts` — cosine similarity queries

2. **Database migration**
   - Enable pgvector extension
   - Add `embedding VECTOR(1536)` columns to internships, student_profiles, company_profiles
   - Add ivfflat indexes

3. **Embedding generation pipeline**
   - `POST /api/ai/embed` — generates embedding for a record
   - Auto-embed on internship create/update
   - Auto-embed on profile create/update
   - Backfill script for existing records

4. **Two-tier search on browse page**
   - `POST /api/ai/search` — accepts query, returns pgvector results
   - `src/hooks/useSemanticSearch.ts` — debounced search with AbortController
   - Merge with existing Fuse.js results on `/internships` page
   - Smart gating: skip semantic if Fuse.js found 5+ results
   - Source tagging ("semantic match" badge)

### Definition of Done
- All profiles and postings have vector embeddings
- Search understands intent ("I want to work with animals" finds veterinary internships)
- Fuse.js and semantic results merge seamlessly
- New content is auto-embedded on save

---

## Phase 4: Student Career Coach Chat

**Goal:** Students get a dedicated AI advisor that knows their profile and available internships.

### Tasks

1. **System prompt**
   - `src/lib/ai/prompts/career-coach.ts`
   - Includes: student profile, school's active internships, application history
   - Personality: encouraging, practical, school-appropriate

2. **Chat page or panel**
   - Accessible from student dashboard
   - Full-page chat or persistent side panel
   - Conversation history preserved across sessions

3. **Internship surfacing**
   - When student describes interests, AI queries vector store
   - Internships embedded as clickable cards in the chat
   - `src/components/ai/InternshipCard.tsx`

4. **Application coaching**
   - Help drafting cover letters for specific internships
   - Interview prep tips based on the role

### Definition of Done
- Student opens career coach from dashboard
- Can explore careers, get advice, discover internships through conversation
- Relevant internships appear as interactive cards
- Conversation persists across sessions

---

## Phase 5: Employer Student Explorer Chat

**Goal:** Employers can discover students through conversational search.

### Tasks

1. **System prompt**
   - `src/lib/ai/prompts/student-explorer.ts`
   - Includes: company profile, active postings, visible student profiles
   - Respects school scoping (global vs school-affiliated)

2. **Chat interface**
   - Accessible from employer dashboard
   - `src/components/ai/StudentCard.tsx` for inline results

3. **Privacy controls**
   - Show limited info until mutual interest expressed
   - Respect school-based visibility rules via RLS

### Definition of Done
- Employer describes ideal intern in chat
- AI surfaces matching student profiles as cards
- Can shape a posting based on available talent
- Respects school scoping and privacy

---

## Phase 6: Voice Interface (v2)

**Goal:** Employers can speak to create job postings instead of typing.

### Tasks

1. **Speech-to-text**
   - OpenAI Whisper API (already have `openai` SDK from Phase 3)
   - Browser Web Speech API as offline fallback
   - `src/components/ai/VoiceInput.tsx`

2. **Text-to-speech**
   - OpenAI TTS API (natural voices, same SDK)
   - Browser SpeechSynthesis API as offline fallback

3. **Integration**
   - VoiceInput component added to AIChatPanel
   - Transcribed text sent as normal chat messages
   - Same posting generation flow

### Definition of Done
- Employer can tap microphone and describe a role
- Speech transcribed and processed by AI
- Job posting generated from voice description

---

## Phase 7: Document Upload (v3)

**Goal:** Employers can upload documents that AI distills into postings and profiles.

### Tasks

1. **File upload**
   - Supabase Storage bucket for AI attachments
   - `src/components/ai/DocumentUpload.tsx`
   - Accept: PDF, DOCX, images (with OCR)

2. **Document processing**
   - `POST /api/ai/voice` (rename to `/api/ai/process`) or new route
   - Extract text from uploaded files
   - GPT-4o processes extracted text into structured data

3. **Database**
   - `ai_attachments` table migration
   - Link attachments to conversations

4. **Integration**
   - Upload button in AIChatPanel
   - AI reads document and suggests form field values
   - Attachments saved and linked to the posting/profile

### Definition of Done
- Employer uploads a company brochure or role description
- AI extracts relevant information
- Generates posting/profile fields from document content
- Original document saved as attachment

---

## Phase 8: WhatsApp Integration (Future)

**Goal:** Full platform access via WhatsApp messaging.

### Tasks

1. **WhatsApp Business API setup**
2. **Webhook endpoint** — `POST /api/whatsapp/webhook`
3. **User linking** — phone number to account mapping
4. **Message routing** — intent detection, context management
5. **All AI features via text messages**
6. **Media support** — voice messages, document uploads

### Definition of Done
- Users can interact with all AI features via WhatsApp
- Account linking works securely
- Bilingual support (language detection)

---

## Cross-Cutting Concerns (All Phases)

### i18n
- Every phase adds translation keys for new UI to both `en.json` and `es.json`
- System prompts respect `preferred_locale`
- AI responds in user's language

### Testing
- Unit tests for prompt construction and response parsing
- Integration tests for API routes
- Smoke tests via Chrome DevTools MCP for UI flows

### Cost Management
- Token usage logging per user per feature
- Daily caps configurable per school
- Dashboard for global admins showing AI usage

### Security
- All AI routes behind auth middleware
- No API keys in client bundle
- Rate limiting on all AI endpoints
- Content moderation appropriate for school context
