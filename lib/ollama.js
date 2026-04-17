export const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
export const CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL ?? "llama3.1:8b";
export const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text";

function messagesToPrompt(messages) {
  return messages
    .map(m => {
      if (m.role === "system") return `SYSTEM:\n${m.content}\n`;
      if (m.role === "user") return `USER:\n${m.content}\n`;
      if (m.role === "assistant") return `ASSISTANT:\n${m.content}\n`;
      if (m.role === "tool") return `TOOL_RESULT:\n${m.content}\n`;
      return `${m.role?.toUpperCase() ?? "MSG"}:\n${m.content}\n`;
    })
    .join("\n");
}

export async function chat({ messages, temperature = 0.2, model = CHAT_MODEL }) {
  const prompt = messagesToPrompt(messages);

  const r = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: { temperature }
    })
  });

  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Ollama chat error HTTP ${r.status}: ${text}`);
  }

  const data = await r.json();
  return data.response ?? "";
}

export async function embed(texts, model = EMBED_MODEL) {
  const input = Array.isArray(texts) ? texts : [texts];

  const vectors = [];
  for (const t of input) {
    const r = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt: t })
    });
    if (!r.ok) {
      const text = await r.text();
      throw new Error(`Ollama embed error HTTP ${r.status}: ${text}`);
    }
    const data = await r.json();
    vectors.push(data.embedding);
  }
  return vectors;
}