-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding columns (1536 dimensions for OpenAI text-embedding-3-small)
ALTER TABLE internships ADD COLUMN IF NOT EXISTS embedding VECTOR(1536);
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS embedding VECTOR(1536);
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS embedding VECTOR(1536);

-- Indexes for fast cosine similarity search
-- lists=20 is appropriate for small datasets (<1000 rows)
CREATE INDEX IF NOT EXISTS idx_internships_embedding ON internships
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 20);
CREATE INDEX IF NOT EXISTS idx_student_profiles_embedding ON student_profiles
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 20);
CREATE INDEX IF NOT EXISTS idx_company_profiles_embedding ON company_profiles
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 20);

-- RPC function for semantic internship search
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
    (1 - (internships.embedding <=> query_embedding))::FLOAT AS similarity
  FROM internships
  WHERE internships.status = 'active'
    AND internships.embedding IS NOT NULL
    AND (1 - (internships.embedding <=> query_embedding)) > match_threshold
  ORDER BY internships.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
