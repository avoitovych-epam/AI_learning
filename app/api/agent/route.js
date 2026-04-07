import { NextResponse } from "next/server";
import { chat } from "@/lib/ollama";

function safeExpr(expr) {
  return /^[0-9+\-*/().%\s]+$/.test(expr);
}

function calculator(expression) {
  if (!safeExpr(expression)) return { error: "Unsafe expression." };
  const value = Function(`"use strict"; return (${expression});`)();
  return { result: value };
}

async function ragAnswer(question) {
  // call our existing RAG API (lab3) internally
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const r = await fetch(`${base}/api/lab3`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question })
  });
  return r.json();
}

function looksLikeMath(input) {
  // e.g. "Compute (12.5*4)/3" or "2+2"
  const s = input.toLowerCase();
  return s.includes("compute") || s.includes("calculate") || safeExpr(input);
}

export async function POST(req) {
  const body = await req.json();
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const lastUser = [...messages].reverse().find(m => m.role === "user")?.content ?? "";

  // --- simple "agent" decision ---
  if (looksLikeMath(lastUser)) {
    const expr = lastUser.replace(/compute|calculate/gi, "").trim();
    const toolResult = calculator(expr);

    return NextResponse.json({
      tool: "calculator",
      toolResult,
      reply: toolResult.error ? toolResult.error : `Result: ${toolResult.result}`
    });
  }

  // if user asks about "RAG/embeddings/onboarding/notes" -> use RAG
  const lower = String(lastUser).toLowerCase();
  if (lower.includes("rag") || lower.includes("onboarding") || lower.includes("notes") || lower.includes("embeddings") || lower.includes("chunk")) {
    const toolResult = await ragAnswer(lastUser);

    // now generate a grounded final response using retrieved context
    const reply = await chat({
      messages: [
        { role: "system", content: "Answer grounded in the provided tool result. If tool result says unknown, say you don't know." },
        { role: "user", content: `Tool result (JSON):\n${JSON.stringify(toolResult, null, 2)}\n\nUser question:\n${lastUser}\n\nGive a short answer and cite chunk ids if present.` }
      ],
      temperature: 0.2
    });

    return NextResponse.json({ tool: "ragAnswer", toolResult, reply });
  }

  // otherwise just chat
  const reply = await chat({ messages, temperature: 0.4 });
  return NextResponse.json({ tool: "none", reply });
}