import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { embed, chat } from "@/lib/ollama";
import { chunkText } from "@/lib/chunking";
import { topK } from "@/lib/similarity";

let indexCache = null;

async function buildIndex() {
  const filePath = path.join(process.cwd(), "data", "source.md");
  const text = await fs.readFile(filePath, "utf-8");
  const chunks = chunkText(text, { maxChars: 850 });
  const vecs = await embed(chunks.map(c => c.text));
  return chunks.map((c, i) => ({ ...c, vector: vecs[i] }));
}

export async function POST(req) {
  const { question } = await req.json();
  const q = (question ?? "What is RAG?").toString();

  if (!indexCache) indexCache = await buildIndex();

  const [qVec] = await embed([q]);
  const retrieved = topK(qVec, indexCache, 4);

  const context = retrieved.map(r => `[#${r.id}]\n${r.text}`).join("\n\n---\n\n");

  const answer = await chat({
    messages: [
      { role: "system", content: "Use only the provided context. If missing, say you don't know." },
      { role: "user", content:
`Use ONLY this context. If the answer is not present reply exactly: "I don't know based on the provided context."

Context:
${context}

Question: ${q}

Return a short answer and end with: Citations: <chunk_ids>` }
    ],
    temperature: 0.2
  });

  return NextResponse.json({
    question: q,
    retrieved: retrieved.map(r => ({ id: r.id, score: r.score })),
    answer
  });
}