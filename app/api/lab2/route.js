import { NextResponse } from "next/server";
import docs from "@/data/docs.json";
import { embed } from "@/lib/ollama";
import { topK } from "@/lib/similarity";

export async function POST(req) {
  const { query } = await req.json();
  const q = (query ?? "What is RAG?").toString();

  const docVecs = await embed(docs.map(d => d.text));
  const items = docs.map((d, i) => ({ ...d, vector: docVecs[i] }));

  const [qVec] = await embed([q]);
  const top = topK(qVec, items, 5).map(x => ({ id: x.id, title: x.title, score: x.score }));

  return NextResponse.json({ query: q, top });
}