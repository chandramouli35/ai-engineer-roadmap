# Day 9 Notes - LangSmith Tracing

What I Learned:

- LangSmith is like DevTools for LangChain applications
- It automatically traces every step: retrieval, prompt, LLM call, etc.
- Very useful for debugging why RAG gives wrong/bad answers

Surprising Findings:

- Retrieval step was taking the most time
- Some questions used way more tokens than expected
- I could clearly see the contextualized question vs original question

LangSmith is a game changer for developing production AI apps.
