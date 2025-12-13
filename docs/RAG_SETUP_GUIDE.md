# RAG System Setup Guide

## Overview
This guide will help you set up the Retrieval-Augmented Generation (RAG) system for the AvatarLab knowledge base. The RAG system enables your avatars to access and search through uploaded PDF documents using semantic similarity.

## System Architecture

The RAG system consists of several components:

1. **PDF Text Extraction** (`src/utils/pdfExtractor.ts`)
   - Extracts text from PDF files using PDF.js
   - Cleans and preprocesses text for optimal chunking

2. **Document Chunking & Embeddings** (`src/services/ragService.ts`)
   - Splits documents into manageable chunks with overlap
   - Generates vector embeddings using OpenAI's text-embedding-ada-002
   - Stores chunks with embeddings in PostgreSQL with pgvector

3. **Semantic Search**
   - Performs vector similarity search using cosine similarity
   - Returns most relevant chunks based on user queries

4. **Enhanced Chat Integration** (`src/services/chatbotService.ts`)
   - Integrates RAG retrieval into chat responses
   - Provides context-aware answers based on knowledge base

## Setup Instructions

### 1. Database Setup

**IMPORTANT**: You must run the database setup script in your Supabase SQL Editor:

```sql
-- Run this file in Supabase SQL Editor
-- File: scripts/create_rag_system.sql
```

This script will:
- Enable the vector extension
- Create the `document_chunks` table with vector storage
- Create the `rag_search_logs` table for analytics
- Set up Row Level Security (RLS) policies
- Create the vector similarity search function
- Add necessary indexes for performance

### 2. Required Dependencies

Make sure these packages are installed:
```bash
npm install pdfjs-dist
```

The system also requires:
- OpenAI API key (for embeddings and chat completions)
- Supabase with pgvector extension enabled

### 3. Storage Bucket Configuration

Ensure your Supabase storage bucket `knowledge-base` is properly configured:
- Public read access for file downloads
- Proper RLS policies for user access control

### 4. Processing Pipeline

After setup, the RAG processing pipeline works as follows:

1. **Upload PDF**: User uploads PDF files through the Knowledge Base interface
2. **Process for RAG**: Click "Process for RAG" button to:
   - Extract text from PDF using PDF.js
   - Split text into chunks (1000 chars with 200 char overlap)
   - Generate embeddings for each chunk using OpenAI API
   - Store chunks with embeddings in database
3. **Link Documents**: Ensure documents are linked to make them available during conversations
4. **Query**: When users ask questions, the system:
   - Generates embedding for the query
   - Searches for similar chunks using vector similarity
   - Enhances the AI prompt with relevant context
   - Generates contextual responses

## Usage

### Processing Documents

1. Go to Avatar Training → Knowledge Base
2. Upload PDF files
3. Click "Process for RAG" button for each file
4. Wait for processing to complete (status will show "RAG Ready")
5. Ensure files are "Linked" to make them available

### Status Indicators

- **Needs Processing**: File uploaded but not yet processed for RAG
- **RAG Ready**: File fully processed and searchable
- **Processing Failed**: Error occurred during processing
- **Linked/Not Linked**: Whether file is available during conversations

### Testing the System

1. Process at least one PDF document
2. Go to Test Chat
3. Ask questions related to the content in your PDFs
4. The avatar should provide contextual answers with references to the knowledge base

## Key Features

- **Semantic Search**: Finds relevant content even with different wording
- **Context-Aware Responses**: AI responses include relevant document snippets
- **Chunk Management**: Optimal text chunking with overlap for better context
- **Real-time Processing**: Process documents on-demand with progress feedback
- **Performance Optimized**: Vector indexes and efficient similarity search
- **Analytics**: Query logging for performance monitoring

## Troubleshooting

### Common Issues

1. **"Vector extension not available"**
   - Ensure pgvector extension is enabled in Supabase
   - Run the setup SQL script

2. **"OpenAI API key required"**
   - Add your OpenAI API key in Settings → API Keys
   - Ensure the key has access to embeddings API

3. **"Processing failed"**
   - Check PDF file is not corrupted
   - Ensure file size is under 50MB
   - Verify OpenAI API quota and limits

4. **"No relevant chunks found"**
   - Ensure documents are processed (RAG Ready status)
   - Ensure documents are linked
   - Try different query wording

### Performance Optimization

- Vector similarity search is optimized with IVFFlat index
- Chunk size and overlap can be adjusted in `RAGService.chunkText()`
- Similarity threshold can be tuned for better results
- Batch processing handles rate limits automatically

## File Structure

```
src/
├── services/
│   ├── ragService.ts          # Core RAG functionality
│   └── chatbotService.ts      # Enhanced with RAG integration
├── utils/
│   └── pdfExtractor.ts        # PDF text extraction
├── components/
│   ├── knowledge-base/
│   │   └── ProcessDocumentButton.tsx  # Processing UI
│   └── chatbot-training/
│       └── KnowledgeBase.tsx  # Enhanced with RAG status
└── scripts/
    └── create_rag_system.sql  # Database setup
```

## Next Steps

1. Run the database setup script in Supabase
2. Upload and process your first PDF document
3. Test the system with queries related to your content
4. Monitor performance and adjust settings as needed

The RAG system is now fully implemented and ready for use! Your avatars can now provide intelligent, context-aware responses based on your uploaded documents.