import { NextResponse } from "next/server";
import { OLLAMA_BASE_URL, CHAT_MODEL, EMBED_MODEL } from "@/lib/ollama";

export async function GET() {
  try {
    const r = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { cache: "no-store" });
    const text = await r.text();

    if (!r.ok) {
      return NextResponse.json(
        {
          ok: false,
          provider: "ollama",
          baseUrl: OLLAMA_BASE_URL,
          chatModel: CHAT_MODEL,
          embedModel: EMBED_MODEL,
          status: r.status,
          details: text
        },
        { status: 500 }
      );
    }

    const data = JSON.parse(text);
    return NextResponse.json({
      ok: true,
      provider: "ollama",
      baseUrl: OLLAMA_BASE_URL,
      chatModel: CHAT_MODEL,
      embedModel: EMBED_MODEL,
      models: (data.models ?? []).map(m => m.name)
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        provider: "ollama",
        baseUrl: OLLAMA_BASE_URL,
        chatModel: CHAT_MODEL,
        embedModel: EMBED_MODEL,
        error: String(e)
      },
      { status: 500 }
    );
  }
}