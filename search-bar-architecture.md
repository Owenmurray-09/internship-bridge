# Search Bar Architecture — Two-Tier Instant + Semantic Search

This documents the search bar pattern from the Cascade AI Portfolio app. It provides instant question-matching via Fuse.js with a debounced semantic fallback via Claude Haiku, all within a question library UI that supports browsing, filtering, and custom free-text queries.

## Overview

The search bar serves **three modes** from a single input:

1. **Browse** — When empty, users browse pre-built questions grouped by category, filtered by time horizon
2. **Search** — As the user types, matching questions appear instantly (fuzzy) with smarter results filling in after 600ms (semantic)
3. **Generate** — Press Enter or click "Generate New Report" to submit a free-text question directly to the analysis API

---

## Architecture Diagram

```
┌──────────────────────────────────────────────┐
│              SearchBar (UI)                  │
│  [🔍 input field] [✨ Generate New Report]   │
└────────────┬────────────────────┬────────────┘
             │                    │
        onChange(value)      onGenerate()
             │                    │
             ▼                    ▼
┌──────────────────────┐  ┌──────────────────────┐
│  QuestionLibrary     │  │  page.tsx             │
│  (search orchestrator│  │  handleCustomQuestion │
│   + result merger)   │  │  → runReport(query)   │
└──────┬───────┬───────┘  │  → POST /api/ask      │
       │       │          └──────────────────────┘
       ▼       ▼
┌──────────┐ ┌──────────────┐
│ Tier 1:  │ │ Tier 2:      │
│ Fuse.js  │ │ Claude Haiku │
│ (instant)│ │ (600ms delay)│
│ client   │ │ POST /api/   │
│ side     │ │    search    │
└────┬─────┘ └──────┬───────┘
     │               │
     └───────┬───────┘
             ▼
   ┌──────────────────┐
   │  Merged Results  │
   │  (deduplicated)  │
   │  fuzzy first,    │
   │  then semantic   │
   └────────┬─────────┘
            ▼
   ┌──────────────────┐
   │   QuestionList   │
   │   (flat ranked   │
   │    or grouped    │
   │    by category)  │
   └──────────────────┘
```

---

## Component Breakdown

### 1. `SearchBar.tsx` — Pure Presentational Input

A stateless input + button. The parent owns the search state.

```tsx
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;   // fires on every keystroke
  onGenerate: () => void;              // fires on Enter or button click
  disabled?: boolean;
}
```

**Key behaviors:**
- Enter key on the input calls `onGenerate()` (submits free-text question to the analysis API)
- Button is disabled when input is empty
- Search icon (lucide `Search`) is positioned absolutely inside the input
- Button has a sparkle icon (lucide `Sparkles`) to signal AI-generated content

### 2. `QuestionLibrary/index.tsx` — Search Orchestrator

This is the brain. It manages both search tiers and merges results.

**State:**
```tsx
const [semanticResults, setSemanticResults] = useState<SearchResult[]>([]);
const [isSemanticLoading, setIsSemanticLoading] = useState(false);
const abortRef = useRef<AbortController | null>(null);
```

**Tier 1 — Instant Fuzzy Search (Fuse.js, client-side):**
```tsx
const fuzzyResults = useMemo(() => {
  if (!searchQuery.trim()) return [];
  return fuzzySearch(searchQuery);       // from lib/search.ts
}, [searchQuery]);
```

Runs synchronously on every keystroke via `useMemo`. Zero network latency.

**Tier 2 — Semantic Search (Claude Haiku, debounced):**

Triggered inside a `useEffect` with a 600ms `setTimeout`:

```tsx
useEffect(() => {
  setSemanticResults([]);
  if (searchQuery.trim().length < 3) return;     // too short
  if (fuzzyResults.length >= 5) return;           // fuzzy found enough, skip semantic

  const timer = setTimeout(async () => {
    abortRef.current?.abort();                    // cancel any in-flight request
    const controller = new AbortController();
    abortRef.current = controller;

    const res = await fetch("/api/search", {
      method: "POST",
      body: JSON.stringify({ query: searchQuery.trim() }),
      signal: controller.signal,
    });

    const data = await res.json();
    setSemanticResults(mapped);
  }, 600);

  return () => {
    clearTimeout(timer);
    abortRef.current?.abort();                    // cleanup on unmount/re-type
  };
}, [searchQuery, fuzzyResults.length, categories]);
```

**Key design decisions:**
- **Skip semantic if fuzzy found ≥5 results** — avoids unnecessary API calls when keyword matching already works
- **600ms debounce** — prevents firing while the user is still typing
- **AbortController** — cancels in-flight requests when the query changes, preventing stale results
- Semantic results cleared immediately on each keystroke, then backfilled

**Result Merging:**
```tsx
const mergedResults = useMemo(() => {
  const seen = new Set(fuzzyResults.map(r => r.questionId));
  const semanticOnly = semanticResults.filter(r => !seen.has(r.questionId));
  return [...fuzzyResults, ...semanticOnly];    // fuzzy first, then semantic extras
}, [searchQuery, fuzzyResults, semanticResults]);
```

Deduplication ensures the same question doesn't appear twice. Fuzzy results are always shown first (they're instant and usually very good), with semantic results appended below.

### 3. `lib/search.ts` — Fuse.js Configuration

Flattens all questions into a searchable index at module load time.

**Fields indexed (with weights):**
| Field | Weight | Source |
|-------|--------|--------|
| `text` | 1.0 | The question itself |
| `intent_keywords` | 0.8 | Curated keywords like "ROI", "spend", "burning" |
| `analysis_hints` | 0.4 | Analytical guidance for the question |
| `decision_type` | 0.3 | e.g., "continue_or_cut" |
| `category_short_name` | 0.3 | e.g., "Portfolio Strategy" |
| `category_core_tension` | 0.2 | e.g., "Are we investing in the right things?" |

**Fuse.js options:**
```tsx
{
  threshold: 0.4,          // fairly loose matching (0 = exact, 1 = match anything)
  ignoreLocation: true,    // match anywhere in the string, not just the start
  includeScore: true,      // return relevance scores for ranking
}
```

**Score inversion:** Fuse.js scores 0 = perfect match, 1 = worst. The app inverts this to `1 - score` so higher = better, consistent with the semantic search scores.

### 4. `app/api/search/route.ts` — Semantic Search Endpoint

A Next.js API route that sends the user's query + all question texts to Claude Haiku for relevance ranking.

```tsx
const response = await anthropic.messages.create({
  model: "claude-haiku-4-5-20251001",
  max_tokens: 512,
  messages: [{
    role: "user",
    content: `Given this search query from a healthcare executive: "${query}"

Which of these questions are most relevant? Return ONLY a JSON array of
{id, score} for the top 8 matches, where score is 0-1 relevance. No other text.

q-001: Which initiatives are delivering value...
q-002: Are any initiatives stuck in pilot purgatory...
...all questions listed as id: text pairs...`
  }],
});
```

**Why Claude Haiku:**
- Fast (~200-400ms response time)
- Cheap (designed for high-volume, low-cost tasks)
- Understands intent, synonyms, and healthcare domain language
- Returns structured JSON scores, not just boolean matches

**Response parsing:** Strips markdown code fences, parses JSON, falls back to empty array on failure.

### 5. `QuestionList.tsx` — Result Rendering

Three rendering modes:

**A. Search results mode** (when `searchResults` is provided):
- Flat ranked list, no category grouping
- Each result shows: question text, category badge, horizon label
- Semantic matches get a sparkle badge ("semantic match") to distinguish from fuzzy
- Shows "Finding more matches..." spinner while semantic search is in flight

**B. Empty search state:**
- Shows "No matching questions found" with hint to try different terms or press Enter

**C. Browse mode** (no search active):
- Questions grouped by category with icons
- Each category has an "Executive Summary" button
- Filtered by selected time horizon and optional selected category

### 6. `page.tsx` — State Orchestration

The root page component manages all state and defines what happens when the user interacts with search results.

**Question click** (`handleQuestionClick`):
1. Look up the question by ID
2. Check if a canned (pre-computed) report exists in `reportRegistry`
3. If canned: display instantly with `type: "canned"` (no API call)
4. If not canned: call `runReport()` → `POST /api/ask` for live AI-generated analysis

**Custom question** (`handleCustomQuestion`):
1. Take the raw search bar text
2. Call `runReport()` → `POST /api/ask` to generate a live analysis
3. Report type is `"custom"`

This means the same input serves as both search and freeform question entry.

---

## Data Flow Summary

```
User types "ROI"
  ├─ Instantly: Fuse.js returns questions matching "ROI" (0ms)
  ├─ After 600ms: POST /api/search → Claude Haiku ranks all questions (200-400ms)
  └─ Results merged: fuzzy first, then semantic-only (deduplicated)

User presses Enter
  └─ POST /api/ask with "ROI" as a freeform question → full AI analysis
```

---

## Question Data Model

Each question in `questions.json` has fields that support both fuzzy and semantic search:

```json
{
  "id": "q-001",
  "horizon": "now",
  "text": "Which initiatives are delivering value this quarter — and which are burning cash with little to show?",
  "intent_keywords": ["value", "ROI", "spend", "burning", "delivering", "underperforming", "waste"],
  "decision_type": "continue_or_cut",
  "analysis_hints": "Compare budget_spent vs roi_cumulative and adoption_rate. Flag initiatives where spend is high but ROI is negative."
}
```

- `intent_keywords` — curated synonyms and related terms that boost fuzzy matching
- `analysis_hints` — used by Fuse.js for matching AND passed to the analysis API to guide report generation
- `decision_type` — categorizes the kind of decision (e.g., "continue_or_cut", "invest_or_divest")

---

## UI Layout

```
┌────────────────────────────────────────────────────────┐
│ Cascade AI Portfolio                    Data as of ... │
├────────────────────────────────────────────────────────┤
│ What decision are you making today?                    │
│ ┌──────────────────────────────────────┐ ┌───────────┐│
│ │ 🔍 Search or ask your own...        │ │✨ Generate ││
│ └──────────────────────────────────────┘ └───────────┘│
│ [Right Now] [6 Months] [12 Months] [3 Years]          │
├──────────────┬─────────────────────────────────────────┤
│ Categories   │ Common Questions & Prepared Reports     │
│              │                                         │
│ ● Portfolio  │ Portfolio Strategy              [Exec]  │
│   Strategy   │ ┌─────────────────────────────────────┐ │
│              │ │ 📊 Which initiatives are delivering │ │
│ ○ Value &    │ │    value this quarter...            │ │
│   Outcomes   │ └─────────────────────────────────────┘ │
│              │ ┌─────────────────────────────────────┐ │
│ ○ Clinical   │ │ 📊 Are any stuck in pilot           │ │
│   Safety     │ │    purgatory...                     │ │
│              │ └─────────────────────────────────────┘ │
│ ○ Adoption   │                                         │
│              │ Value & Outcomes                 [Exec] │
│ ○ Patient    │ ...                                     │
│   Experience │                                         │
│              │                                         │
│ ○ Execution  │                                         │
│   Risk       │                                         │
└──────────────┴─────────────────────────────────────────┘
```

When search is active, the right panel switches from grouped categories to a flat ranked results list.

---

## Key Patterns to Reuse

1. **Two-tier search** — Instant client-side fuzzy + debounced server-side semantic. The fuzzy tier covers 80% of queries; semantic adds value for intent-based queries.

2. **Smart gating** — Skip the semantic API call when fuzzy already found ≥5 results. Saves cost and latency.

3. **AbortController cleanup** — Cancel in-flight semantic requests when the user types another character. Prevents stale results from appearing.

4. **Dual-purpose input** — Same text field works as both search filter and freeform question entry. Search results are shown inline; Enter submits the raw text as a custom query.

5. **Search result source tagging** — Each result carries `source: "fuzzy" | "semantic"` so the UI can badge semantic matches differently.

6. **Enriched search documents** — Index not just the question text, but also curated keywords, hints, and category metadata. This makes fuzzy search much more effective without any API calls.

7. **Pre-computed reports as first-class citizens** — If a canned report exists for a question, clicking it loads instantly (no API call). The search bar doesn't distinguish between canned and live questions — the decision happens at click time.
