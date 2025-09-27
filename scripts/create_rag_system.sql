-- Create RAG (Retrieval-Augmented Generation) System
-- Run this script in your Supabase SQL Editor

-- Enable the vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================
-- 1. CREATE DOCUMENT CHUNKS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  knowledge_file_id UUID REFERENCES avatar_knowledge_files(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  avatar_id UUID REFERENCES avatars(id) ON DELETE CASCADE NOT NULL,

  -- Chunk content and metadata
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  chunk_size INTEGER NOT NULL,

  -- Vector embedding (1536 dimensions for OpenAI text-embedding-ada-002)
  embedding vector(1536),

  -- Metadata for better retrieval
  page_number INTEGER,
  section_title TEXT,
  chunk_type TEXT DEFAULT 'content', -- content, header, summary, etc.

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for efficient vector similarity search
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_document_chunks_user_id ON document_chunks(user_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_avatar_id ON document_chunks(avatar_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_file_id ON document_chunks(knowledge_file_id);

-- =============================================
-- 2. CREATE SEARCH QUERIES LOG TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS rag_search_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  avatar_id UUID REFERENCES avatars(id) ON DELETE CASCADE NOT NULL,

  -- Search details
  query_text TEXT NOT NULL,
  query_embedding vector(1536),

  -- Results
  chunks_found INTEGER DEFAULT 0,
  top_similarity_score FLOAT,

  -- Response info
  response_generated BOOLEAN DEFAULT false,
  response_tokens INTEGER,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rag_search_logs_user_id ON rag_search_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_rag_search_logs_avatar_id ON rag_search_logs(avatar_id);

-- =============================================
-- 3. ENABLE RLS (Row Level Security)
-- =============================================
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_search_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. CREATE RLS POLICIES
-- =============================================

-- Document chunks policies
DROP POLICY IF EXISTS "Users can view own document chunks" ON document_chunks;
CREATE POLICY "Users can view own document chunks"
ON document_chunks FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own document chunks" ON document_chunks;
CREATE POLICY "Users can insert own document chunks"
ON document_chunks FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own document chunks" ON document_chunks;
CREATE POLICY "Users can update own document chunks"
ON document_chunks FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own document chunks" ON document_chunks;
CREATE POLICY "Users can delete own document chunks"
ON document_chunks FOR DELETE
USING (auth.uid() = user_id);

-- Search logs policies
DROP POLICY IF EXISTS "Users can view own search logs" ON rag_search_logs;
CREATE POLICY "Users can view own search logs"
ON rag_search_logs FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own search logs" ON rag_search_logs;
CREATE POLICY "Users can insert own search logs"
ON rag_search_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 5. CREATE VECTOR SIMILARITY SEARCH FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION search_document_chunks(
  query_embedding vector(1536),
  search_user_id uuid,
  search_avatar_id uuid,
  similarity_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  chunk_id uuid,
  knowledge_file_id uuid,
  chunk_text text,
  chunk_index integer,
  page_number integer,
  section_title text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id as chunk_id,
    dc.knowledge_file_id,
    dc.chunk_text,
    dc.chunk_index,
    dc.page_number,
    dc.section_title,
    1 - (dc.embedding <=> query_embedding) as similarity
  FROM document_chunks dc
  WHERE
    dc.user_id = search_user_id
    AND dc.avatar_id = search_avatar_id
    AND dc.embedding IS NOT NULL
    AND 1 - (dc.embedding <=> query_embedding) > similarity_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- =============================================
-- 6. CREATE UPDATE TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION update_document_chunks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_document_chunks_updated_at ON document_chunks;
CREATE TRIGGER update_document_chunks_updated_at
    BEFORE UPDATE ON document_chunks
    FOR EACH ROW
    EXECUTE FUNCTION update_document_chunks_updated_at();

-- =============================================
-- 7. VERIFY SETUP
-- =============================================
SELECT 'RAG system tables created successfully' as status;

-- Check if vector extension is properly installed
SELECT 'Vector extension available: ' || CASE WHEN COUNT(*) > 0 THEN 'YES' ELSE 'NO' END as vector_status
FROM pg_extension WHERE extname = 'vector';