# AI Onboarding Labs (Next.js + Ollama)

This repo contains foundational hands-on labs for:
- Prompt engineering
- Embeddings + similarity search
- RAG (Retrieval-Augmented Generation)
- A simple agent/chatbot using tool-like routing (calculator + RAG)

## Environment (Acceptance Criteria)
- OS: Windows 11
- Runtime: Node.js 20+
- IDE: VS Code (GitHub Copilot enabled)
- Local LLM runtime: Ollama (`http://localhost:11434`)
  - Chat model: `llama3.1:8b` (or `llama3.2:3b` for faster runs)
  - Embeddings model: `nomic-embed-text:latest`
- App: Next.js (UI + API routes)

This satisfies “local or cloud environment” via **local infrastructure**.

## Repository Structure
- `app/` – Next.js UI and API routes:
  - `app/api/lab1` – prompting patterns
  - `app/api/lab2` – embeddings similarity search
  - `app/api/lab3` – RAG Q&A grounded in local docs
  - `app/api/agent` – simple agent behavior (calculator + RAG)
- `lib/` – shared logic (Ollama client, chunking, similarity)
- `data/`
  - `data/source.md` – knowledge base for RAG
  - `data/docs.json` – small dataset for embeddings lab

## Prerequisites
- Node.js 20+
- Ollama installed: https://ollama.com/download

## Setup
### 1) Install dependencies
```bash
npm install