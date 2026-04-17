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
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const r = await fetch(`${base}/api/lab3`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question })
  });
  return r.json();
}

function looksLikeMath(input) {
  const s = input.toLowerCase();
  return s.includes("compute") || s.includes("calculate") || safeExpr(input);
}

export async function POST(req) {
  const body = await req.json();
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const lastUser = [...messages].reverse().find(m => m.role === "user")?.content ?? "";

  if (looksLikeMath(lastUser)) {
    const expr = lastUser.replace(/compute|calculate/gi, "").trim();
    const toolResult = calculator(expr);

    return NextResponse.json({
      tool: "calculator",
      toolResult,
      reply: toolResult.error ? toolResult.error : `Result: ${toolResult.result}`
    });
  }

  const lower = String(lastUser).toLowerCase();
  if (lower.includes("rag") || lower.includes("onboarding") || lower.includes("notes") || lower.includes("embeddings") || lower.includes("chunk")) {
    const toolResult = await ragAnswer(lastUser);

    const reply = await chat({
      messages: [
        { role: "system", content: "Answer grounded in the provided tool result. If tool result says unknown, say you don't know." },
        { role: "user", content: `Tool result (JSON):\n${JSON.stringify(toolResult, null, 2)}\n\nUser question:\n${lastUser}\n\nGive a short answer and cite chunk ids if present.` }
      ],
      temperature: 0.2
    });

    return NextResponse.json({ tool: "ragAnswer", toolResult, reply });
  }

  const reply = await chat({ messages, temperature: 0.4 });
  return NextResponse.json({ tool: "none", reply });
}