# Day 5: Full RAG Pipeline

## Overview
Built a complete **Retrieval Augmented Generation (RAG)** system using LangChain + Gemini + Chroma.

## Features
- Loads PDF document
- Splits into chunks with overlap
- Creates embeddings using Google's embedding model
- Stores vectors in Chroma (local vector database)
- Retrieves relevant chunks for user questions
- Generates accurate answers using only the provided document

## Tech Stack
- LangChain
- Google Gemini (Embeddings + LLM)
- Chroma Vector Store
- PyPDFLoader + RecursiveCharacterTextSplitter

## How to Run
1. Place your PDF as `sample.pdf` in this folder
2. Add `GEMINI_API_KEY` in `.env`
3. `python app.py`

## What I Learned
- How RAG reduces hallucinations
- Importance of chunk size and overlap
- Power of semantic search using embeddings

This is a foundational project for building AI chat-with-your-docs applications.